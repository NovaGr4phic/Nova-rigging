// ===== ریگ ارمور =====
var ARMOR_ZIP_URL = 'https://novagr4phic.github.io/Nova-rigging/armors_textures.zip';
var ARMOR_GLTF_URL = 'https://novagr4phic.github.io/Nova-rigging/Di_armor.gltf';

var armorBaseTextures = {};      // armors: diamond_1.png, diamond_2.png, ...
var armorTrimTextures = {};      // trims: coast.png, coast_leggings.png, ...
var armorPaletteTextures = {};   // color pallets: gold.png, emerald.png, ...

var armorZipLoaded = false;
var armorZipLoading = false;
var armorGltfLoaded = false;

var armorScene, armorCamera, armorRenderer, armorControls;
var armorMesh = null;
var currentArmorScale = 1;

var selectedArmorBase = null;    // مثل: diamond
var selectedArmorTrim = null;    // مثل: coast
var selectedArmorPalette = null; // مثل: gold

// ===== لود ZIP =====
function loadArmorTextures() {
  if (armorZipLoading) return;
  armorZipLoading = true;

  var status = document.getElementById('armorStatus');
  if (status) {
    status.innerHTML = '<svg><use href="#i-spinner"/></svg> در حال لود تکسچرهای ارمور...';
  }

  fetch(ARMOR_ZIP_URL)
    .then(function(r) {
      if (!r.ok) throw new Error('خطا در دانلود ZIP');
      return r.blob();
    })
    .then(function(blob) {
      return JSZip.loadAsync(blob);
    })
    .then(function(zip) {
      var promises = [];

      zip.forEach(function(path, file) {
        if (!path.toLowerCase().endsWith('.png')) return;

        var parts = path.split('/');
        var filename = parts[parts.length - 1].replace('.png', '');
        var folder = parts[parts.length - 2];

        var p = file.async('blob').then(function(blob) {
          var url = URL.createObjectURL(blob);

          if (folder === 'armors') {
            armorBaseTextures[filename] = url;
          } else if (folder === 'trims') {
            armorTrimTextures[filename] = url;
          } else if (folder === 'color pallets') {
            armorPaletteTextures[filename] = url;
          }
        });
        promises.push(p);
      });

      return Promise.all(promises);
    })
    .then(function() {
      armorZipLoaded = true;
      armorZipLoading = false;

      // لیست‌ها رو پر کن
      renderArmorBaseList();
      renderArmorTrimList();
      renderArmorPaletteList();

      updateArmorStatus('آرمور، تریم و متریال رو انتخاب کن');

      // GLTF رو لود کن
      loadArmorGltf();
    })
    .catch(function(err) {
      armorZipLoading = false;
      console.error(err);
      if (status) {
        status.innerHTML = '<svg><use href="#i-x"/></svg> خطا در لود تکسچرها: ' + err.message;
      }
    });
}

// ===== لود GLTF =====
function loadArmorGltf() {
  var viewer = document.getElementById('armorViewer');
  if (!viewer) return;

  armorScene = new THREE.Scene();

  var w = viewer.clientWidth;
  var h = viewer.clientHeight;

  armorCamera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
  armorCamera.position.set(2.5, 2, 2.5);

  armorRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  armorRenderer.setSize(w, h);
  armorRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  viewer.appendChild(armorRenderer.domElement);

  armorControls = new THREE.OrbitControls(armorCamera, armorRenderer.domElement);
  armorControls.enableDamping = true;
  armorControls.dampingFactor = 0.1;
  armorControls.enablePan = false;
  armorControls.minDistance = 1.5;
  armorControls.maxDistance = 8;

  armorScene.add(new THREE.AmbientLight(0xffffff, 0.9));
  var l1 = new THREE.DirectionalLight(0xffffff, 0.6);
  l1.position.set(5, 10, 7);
  armorScene.add(l1);
  var l2 = new THREE.DirectionalLight(0xa855f7, 0.4);
  l2.position.set(-5, -5, -5);
  armorScene.add(l2);

  var loader = new THREE.GLTFLoader();
  loader.load(ARMOR_GLTF_URL, function(gltf) {
    armorMesh = gltf.scene;

    // مقیاس اولیه
    armorMesh.scale.set(1, 1, 1);

    // موقعیت
    armorMesh.position.set(0, -1.5, 0);

    armorScene.add(armorMesh);

    // تنظیمات دوربین
    var box = new THREE.Box3().setFromObject(armorMesh);
    var center = box.getCenter(new THREE.Vector3());
    var size = box.getSize(new THREE.Vector3());
    var maxDim = Math.max(size.x, size.y, size.z);

    armorCamera.position.set(center.x + maxDim * 1.5, center.y + maxDim * 0.8, center.z + maxDim * 1.5);
    armorControls.target.copy(center);
    armorControls.update();

    armorGltfLoaded = true;
    updateArmorStatus('آرمور، تریم و متریال رو انتخاب کن');

    // دکمه ریست چرخش
    var resetViewBtn = document.getElementById('armorResetViewBtn');
    if (resetViewBtn) {
      resetViewBtn.onclick = function() {
        armorCamera.position.set(center.x + maxDim * 1.5, center.y + maxDim * 0.8, center.z + maxDim * 1.5);
        armorControls.target.copy(center);
        armorControls.update();
      };
    }
  }, undefined, function(err) {
    console.error('GLTF load error:', err);
    updateArmorStatus('خطا در لود مدل ارمور');
  });

  armorLoop();
  window.addEventListener('resize', onArmorResize);
}

function onArmorResize() {
  var viewer = document.getElementById('armorViewer');
  if (!viewer || !armorCamera) return;
  armorCamera.aspect = viewer.clientWidth / viewer.clientHeight;
  armorCamera.updateProjectionMatrix();
  armorRenderer.setSize(viewer.clientWidth, viewer.clientHeight);
}

function armorLoop() {
  requestAnimationFrame(armorLoop);
  if (armorControls) armorControls.update();
  if (armorRenderer) armorRenderer.render(armorScene, armorCamera);
}

// ===== لیست آرمور پایه =====
function renderArmorBaseList() {
  var list = document.getElementById('armorBaseList');
  if (!list) return;

  var names = [];
  for (var name in armorBaseTextures) {
    if (name.indexOf('_1') !== -1 || name.indexOf('_2') !== -1) {
      var baseName = name.replace('_1', '').replace('_2', '');
      if (names.indexOf(baseName) === -1) {
        names.push(baseName);
      }
    }
  }

  if (names.length === 0) {
    list.innerHTML = '<div class="no-result-mini">تکسچری پیدا نشد</div>';
    return;
  }

  list.innerHTML = '';
  names.forEach(function(name) {
    var item = document.createElement('div');
    item.className = 'armor-item';
    item.setAttribute('data-name', name);

    // آیکون: از _1 استفاده کن
    var img = document.createElement('img');
    img.src = armorBaseTextures[name + '_1'];
    img.alt = name;
    img.title = name;

    item.appendChild(img);

    item.onclick = function() {
      var all = list.querySelectorAll('.armor-item');
      for (var i = 0; i < all.length; i++) all[i].classList.remove('selected');
      item.classList.add('selected');
      selectedArmorBase = name;
      updateArmorInfo();
      updateArmorStatus('آرمور: ' + name + ' انتخاب شد');
      updateArmorPreview();
    };

    list.appendChild(item);
  });
}

// ===== لیست تریم =====
function renderArmorTrimList() {
  var list = document.getElementById('armorTrimList');
  if (!list) return;

  var names = [];
  for (var name in armorTrimTextures) {
    if (name.indexOf('_leggings') === -1) {
      names.push(name);
    }
  }

  if (names.length === 0) {
    list.innerHTML = '<div class="no-result-mini">تریمی پیدا نشد</div>';
    return;
  }

  list.innerHTML = '';
  names.forEach(function(name) {
    var item = document.createElement('div');
    item.className = 'armor-item';
    item.setAttribute('data-name', name);

    var img = document.createElement('img');
    img.src = armorTrimTextures[name];
    img.alt = name;
    img.title = name;

    item.appendChild(img);

    item.onclick = function() {
      var all = list.querySelectorAll('.armor-item');
      for (var i = 0; i < all.length; i++) all[i].classList.remove('selected');
      item.classList.add('selected');
      selectedArmorTrim = name;
      updateArmorInfo();
      updateArmorStatus('تریم: ' + name + ' انتخاب شد');
      updateArmorPreview();
    };

    list.appendChild(item);
  });
}

// ===== لیست متریال (پالت) =====
function renderArmorPaletteList() {
  var list = document.getElementById('armorPaletteList');
  if (!list) return;

  var names = [];
  for (var name in armorPaletteTextures) {
    if (name.indexOf('_darker') === -1 && name !== 'trim_palette') {
      names.push(name);
    }
  }

  if (names.length === 0) {
    list.innerHTML = '<div class="no-result-mini">متریالی پیدا نشد</div>';
    return;
  }

  list.innerHTML = '';
  names.forEach(function(name) {
    var item = document.createElement('div');
    item.className = 'armor-item';
    item.setAttribute('data-name', name);

    var img = document.createElement('img');
    img.src = armorPaletteTextures[name];
    img.alt = name;
    img.title = name;

    item.appendChild(img);

    item.onclick = function() {
      var all = list.querySelectorAll('.armor-item');
      for (var i = 0; i < all.length; i++) all[i].classList.remove('selected');
      item.classList.add('selected');
      selectedArmorPalette = name;
      updateArmorInfo();
      updateArmorStatus('متریال: ' + name + ' انتخاب شد');
      updateArmorPreview();
    };

    list.appendChild(item);
  });
}

// ===== پیش‌نمایش (ترکیب تکسچرها) =====
function updateArmorPreview() {
  // چون GLTF خودش تکسچر diamond داره، اینجا فقط اگه خواستیم تکسچر رو عوض کنیم
  // فعلاً فقط یه پیام نشون می‌دیم
  
  if (selectedArmorBase && selectedArmorTrim && selectedArmorPalette) {
    updateArmorStatus('همه چیز آماده! می‌تونی دانلود کنی');
    var status = document.getElementById('armorStatus');
    if (status) status.classList.add('active');
    var btn = document.getElementById('armorDlBtn');
    if (btn) btn.disabled = false;
  } else if (selectedArmorBase) {
    updateArmorStatus('تریم و متریال رو هم انتخاب کن (یا بدون تریم دانلود کن)');
    var btn2 = document.getElementById('armorDlBtn');
    if (btn2) btn2.disabled = false;
  } else {
    var btn3 = document.getElementById('armorDlBtn');
    if (btn3) btn3.disabled = true;
  }
}

// ===== آپدیت اطلاعات =====
function updateArmorInfo() {
  var baseName = document.getElementById('armorBaseName');
  var trimName = document.getElementById('armorTrimName');
  var palName = document.getElementById('armorPaletteName');

  if (baseName) baseName.textContent = selectedArmorBase || '-';
  if (trimName) trimName.textContent = selectedArmorTrim || '-';
  if (palName) palName.textContent = selectedArmorPalette || '-';
}

// ===== آپدیت وضعیت =====
function updateArmorStatus(msg) {
  var status = document.getElementById('armorStatus');
  if (!status) return;
  status.innerHTML = '<svg><use href="#i-shield"/></svg> ' + msg;
  status.classList.remove('active');
}

// ===== ترکیب تکسچرها (Base + Trim + Palette) =====
// این تابع تکسچر نهایی رو با ترکیب سه لایه می‌سازه
function compositeArmorTexture(baseUrl, trimUrl, paletteUrl, callback) {
  var canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 32;
  var ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  var baseImg = new Image();
  baseImg.crossOrigin = 'anonymous';

  var trimImg = new Image();
  trimImg.crossOrigin = 'anonymous';

  var paletteImg = new Image();
  paletteImg.crossOrigin = 'anonymous';

  var loaded = 0;
  var total = 1 + (trimUrl ? 1 : 0) + (paletteUrl ? 1 : 0);

  function checkDone() {
    loaded++;
    if (loaded >= total) {
      // ترکیب نهایی
      ctx.drawImage(baseImg, 0, 0);

      if (trimUrl && paletteUrl) {
        // تریم + پالت: رنگ تریم رو با پالت عوض کن
        var tempCanvas = document.createElement('canvas');
        tempCanvas.width = 64;
        tempCanvas.height = 32;
        var tempCtx = tempCanvas.getContext('2d');
        tempCtx.imageSmoothingEnabled = false;

        // تریم رو بکش
        tempCtx.drawImage(trimImg, 0, 0);

        // پالت رو روی تریم بذار (multiply)
        tempCtx.globalCompositeOperation = 'multiply';
        tempCtx.drawImage(paletteImg, 0, 0, 64, 32);
        tempCtx.globalCompositeOperation = 'source-over';

        // تریم رنگ‌شده رو روی base بذار
        ctx.drawImage(tempCanvas, 0, 0);
      }

      callback(canvas);
    }
  }

  baseImg.onload = checkDone;
  baseImg.onerror = checkDone;
  baseImg.src = baseUrl;

  if (trimUrl) {
    trimImg.onload = checkDone;
    trimImg.onerror = checkDone;
    trimImg.src = trimUrl;
  }

  if (paletteUrl) {
    paletteImg.onload = checkDone;
    paletteImg.onerror = checkDone;
    paletteImg.src = paletteUrl;
  }
}

// ===== دانلود ریگ ارمور =====
function downloadArmorRig() {
  if (!selectedArmorBase) {
    alert('اول یه آرمور انتخاب کن!');
    return;
  }

  updateArmorStatus('در حال آماده‌سازی...');

  // تکسچرهای Main و Leggings رو ترکیب کن
  var baseMain = armorBaseTextures[selectedArmorBase + '_1'];
  var baseLeggings = armorBaseTextures[selectedArmorBase + '_2'];

  var trimMain = selectedArmorTrim ? armorTrimTextures[selectedArmorTrim] : null;
  var trimLeggings = selectedArmorTrim ? armorTrimTextures[selectedArmorTrim + '_leggings'] : null;

  var paletteUrl = selectedArmorPalette ? armorPaletteTextures[selectedArmorPalette] : null;

  // ترکیب Main
  compositeArmorTexture(baseMain, trimMain, paletteUrl, function(finalMainCanvas) {
    // ترکیب Leggings
    compositeArmorTexture(baseLeggings, trimLeggings, paletteUrl, function(finalLeggingsCanvas) {

      // ساخت ZIP
      var zip = new JSZip();

      // GLTF رو دانلود کن
      fetch(ARMOR_GLTF_URL)
        .then(function(r) { return r.text(); })
        .then(function(gltfText) {
          zip.file('model.gltf', gltfText);

          // تکسچرهای نهایی رو اضافه کن
          var mainDataUrl = finalMainCanvas.toDataURL('image/png');
          var leggingsDataUrl = finalLeggingsCanvas.toDataURL('image/png');

          zip.file('texture_main.png', mainDataUrl.split(',')[1], { base64: true });
          zip.file('texture_leggings.png', leggingsDataUrl.split(',')[1], { base64: true });

          return zip.generateAsync({ type: 'blob', compression: 'STORE' });
        })
        .then(function(blob) {
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = 'nova-rigs-armor.zip';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
          updateArmorStatus('ریگ ارمور دانلود شد!');
        })
        .catch(function(err) {
          console.error(err);
          alert('خطا: ' + err.message);
        });
    });
  });
}

// ===== ریست =====
function resetArmor() {
  selectedArmorBase = null;
  selectedArmorTrim = null;
  selectedArmorPalette = null;

  // پاک کردن انتخاب‌ها
  document.querySelectorAll('#armorBaseList .armor-item, #armorTrimList .armor-item, #armorPaletteList .armor-item').forEach(function(el) {
    el.classList.remove('selected');
  });

  updateArmorInfo();
  updateArmorStatus('آرمور، تریم و متریال رو انتخاب کن');

  var btn = document.getElementById('armorDlBtn');
  if (btn) btn.disabled = true;
}

// ===== اسلایدر مقیاس =====
function setupArmorScale() {
  var slider = document.getElementById('armorScale');
  var val = document.getElementById('asv');

  if (slider) {
    slider.oninput = function(e) {
      currentArmorScale = parseFloat(e.target.value) || 1;
      if (val) val.textContent = e.target.value;
      if (armorMesh) {
        armorMesh.scale.set(currentArmorScale, currentArmorScale, currentArmorScale);
      }
    };
  }
}

// ===== شروع =====
loadArmorTextures();
setupArmorScale();

var armorDlBtn = document.getElementById('armorDlBtn');
if (armorDlBtn) armorDlBtn.onclick = downloadArmorRig;

var armorResetBtn = document.getElementById('armorResetBtn');
if (armorResetBtn) armorResetBtn.onclick = resetArmor;
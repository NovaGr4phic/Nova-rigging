// ===== ریگ بلاک =====
var BLOCKS_ZIP_URL = 'https://novagr4phic.github.io/Nova-rigging/blocks.zip';
var BLOCK_TEXTURES = {};
var BLOCK_ZIP_LOADED = false;
var BLOCK_LOADING = false;

// ===== متغیرهای Three.js =====
var blockScene, blockCamera, blockRenderer, blockControls;
var blockMesh, blockRaycaster, blockMouse;
var selectedFace = null;
var faceTextures = {
  front: null, back: null, right: null, left: null, top: null, bottom: null
};

// ===== الگوی علامت سؤال =====
var QUESTION_PATTERN = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
  '<defs>' +
  '<pattern id="q" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">' +
  '<rect width="16" height="16" fill="#1a0d2e"/>' +
  '<text x="8" y="12" font-size="12" text-anchor="middle" fill="#a855f7" opacity="0.4" font-family="Arial" font-weight="bold">?</text>' +
  '</pattern>' +
  '</defs>' +
  '<rect width="64" height="64" fill="url(#q)"/>' +
  '</svg>'
);

// ===== لود ZIP =====
function loadBlocks() {
  if (BLOCK_LOADING) return;
  BLOCK_LOADING = true;

  var textureList = document.getElementById('blockTextureList');
  if (textureList) {
    textureList.innerHTML = '<div class="no-result-mini"><svg><use href="#i-spinner"/></svg> در حال لود...</div>';
  }

  fetch(BLOCKS_ZIP_URL)
    .then(function(r) {
      if (!r.ok) throw new Error('خطا در دانلود ZIP');
      return r.blob();
    })
    .then(function(blob) {
      return JSZip.loadAsync(blob);
    })
    .then(function(zip) {
      var promises = [];
      var count = 0;

      zip.forEach(function(path, file) {
        if (!path.toLowerCase().endsWith('.png')) return;
        if (count >= 3000) return;
        count++;

        var p = file.async('blob').then(function(blob) {
          var name = path.split('/').pop().replace('.png', '');
          BLOCK_TEXTURES[name] = URL.createObjectURL(blob);
        });
        promises.push(p);
      });

      return Promise.all(promises);
    })
    .then(function() {
      BLOCK_ZIP_LOADED = true;
      BLOCK_LOADING = false;

      var textureList = document.getElementById('blockTextureList');
      if (textureList) {
        var count = Object.keys(BLOCK_TEXTURES).length;
        textureList.innerHTML = '<div class="no-result-mini">' + count + ' تکسچر آماده<br>یه کلمه تایپ کن</div>';
      }

      var searchBtn = document.getElementById('blockSearchBtn');
      if (searchBtn) searchBtn.disabled = false;

      initBlockViewer();
    })
    .catch(function(err) {
      BLOCK_LOADING = false;
      console.error(err);
      var textureList = document.getElementById('blockTextureList');
      if (textureList) {
        textureList.innerHTML = '<div class="no-result-mini">خطا در لود<br>' + err.message + '</div>';
      }
    });
}

// ===== ساخت Three.js =====
function initBlockViewer() {
  var viewer = document.getElementById('blockViewer');
  if (!viewer) return;

  blockScene = new THREE.Scene();

  var w = viewer.clientWidth;
  var h = viewer.clientHeight;

  blockCamera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
  blockCamera.position.set(2.5, 2, 2.5);

  blockRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  blockRenderer.setSize(w, h);
  blockRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  viewer.appendChild(blockRenderer.domElement);

  blockControls = new THREE.OrbitControls(blockCamera, blockRenderer.domElement);
  blockControls.enableDamping = true;
  blockControls.dampingFactor = 0.1;
  blockControls.enablePan = false;
  blockControls.minDistance = 2;
  blockControls.maxDistance = 8;

  // نورها
  blockScene.add(new THREE.AmbientLight(0xffffff, 0.9));
  var l1 = new THREE.DirectionalLight(0xffffff, 0.6);
  l1.position.set(5, 10, 7);
  blockScene.add(l1);
  var l2 = new THREE.DirectionalLight(0xa855f7, 0.4);
  l2.position.set(-5, -5, -5);
  blockScene.add(l2);

  // مکعب با ۶ وجه
  var geo = new THREE.BoxGeometry(2, 2, 2);
  var materials = [];

  ['right', 'left', 'top', 'bottom', 'front', 'back'].forEach(function() {
    var tex = new THREE.TextureLoader().load(QUESTION_PATTERN);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    materials.push(new THREE.MeshStandardMaterial({
      map: tex,
      transparent: false
    }));
  });

  blockMesh = new THREE.Mesh(geo, materials);
  blockScene.add(blockMesh);

  // Raycaster
  blockRaycaster = new THREE.Raycaster();
  blockMouse = new THREE.Vector2();

  blockRenderer.domElement.addEventListener('click', onBlockClick);

  // دکمه ریست چرخش
  var resetBtn = document.getElementById('resetViewBtn');
  if (resetBtn) {
    resetBtn.onclick = function() {
      blockCamera.position.set(2.5, 2, 2.5);
      blockControls.target.set(0, 0, 0);
      blockControls.update();
    };
  }

  // دکمه ریست همه
  var resetAllBtn = document.getElementById('blockResetBtn');
  if (resetAllBtn) {
    resetAllBtn.onclick = function() {
      for (var f in faceTextures) {
        faceTextures[f] = null;
      }
      selectedFace = null;
      updateBlockMaterials();
      updateFaceInfo();
      updateStatus('یه وجه رو انتخاب کن');
      updateDownloadBtn();
    };
  }

  // دکمه دانلود
  var dlBtn = document.getElementById('blockDlBtn');
  if (dlBtn) {
    dlBtn.onclick = downloadBlockRig;
  }

  blockLoop();

  window.addEventListener('resize', onBlockResize);
}

function onBlockResize() {
  var viewer = document.getElementById('blockViewer');
  if (!viewer || !blockCamera) return;
  blockCamera.aspect = viewer.clientWidth / viewer.clientHeight;
  blockCamera.updateProjectionMatrix();
  blockRenderer.setSize(viewer.clientWidth, viewer.clientHeight);
}

function blockLoop() {
  requestAnimationFrame(blockLoop);
  blockControls.update();
  blockRenderer.render(blockScene, blockCamera);
}

// ===== تشخیص وجه از نرمال =====
function getFaceFromNormal(normal) {
  if (Math.abs(normal.x) > 0.9) {
    return normal.x > 0 ? 'right' : 'left';
  }
  if (Math.abs(normal.y) > 0.9) {
    return normal.y > 0 ? 'top' : 'bottom';
  }
  if (Math.abs(normal.z) > 0.9) {
    return normal.z > 0 ? 'front' : 'back';
  }
  return null;
}

// ===== کلیک روی وجه =====
function onBlockClick(event) {
  var rect = blockRenderer.domElement.getBoundingClientRect();
  blockMouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  blockMouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  blockRaycaster.setFromCamera(blockMouse, blockCamera);
  var intersects = blockRaycaster.intersectObject(blockMesh);

  if (intersects.length > 0) {
    var normal = intersects[0].face.normal;
    var faceName = getFaceFromNormal(normal);

    if (faceName) {
      selectedFace = faceName;
      updateStatus('وجه انتخاب‌شده: ' + getFaceNameFa(faceName) + ' — یه تکسچر انتخاب کن');
      updateFaceInfo();
    }
  }
}

function getFaceNameFa(face) {
  var names = {
    front: 'جلو',
    back: 'پشت',
    right: 'راست',
    left: 'چپ',
    top: 'بالا',
    bottom: 'پایین'
  };
  return names[face] || face;
}

// ===== جستجوی تکسچرها =====
function searchBlockTextures() {
  var q = document.getElementById('blockSearchInput').value.trim().toLowerCase();
  var list = document.getElementById('blockTextureList');

  if (!q) {
    list.innerHTML = '<div class="no-result-mini">یه کلمه تایپ کن</div>';
    return;
  }

  if (!BLOCK_ZIP_LOADED) {
    list.innerHTML = '<div class="no-result-mini">هنوز لود نشده...</div>';
    return;
  }

  var found = [];
  for (var name in BLOCK_TEXTURES) {
    if (name.toLowerCase().indexOf(q) !== -1) {
      found.push(name);
    }
  }

  if (found.length === 0) {
    list.innerHTML = '<div class="no-result-mini">تکسچری پیدا نشد</div>';
    return;
  }

  list.innerHTML = '';
  found.slice(0, 100).forEach(function(name) {
    var item = document.createElement('div');
    item.className = 'texture-item';

    var img = document.createElement('img');
    img.src = BLOCK_TEXTURES[name];
    img.loading = 'lazy';
    img.alt = name;
    img.title = name;

    item.appendChild(img);

    item.onclick = function() {
      if (!selectedFace) {
        updateStatus('اول یه وجه رو از بلاک انتخاب کن!');
        return;
      }
      faceTextures[selectedFace] = BLOCK_TEXTURES[name];
      updateBlockMaterials();
      updateFaceInfo();
      updateStatus('تکسچر "' + name + '" روی ' + getFaceNameFa(selectedFace) + ' قرار گرفت');
      updateDownloadBtn();
    };

    list.appendChild(item);
  });
}

// ===== آپدیت متریال مکعب =====
function updateBlockMaterials() {
  if (!blockMesh) return;

  var order = ['right', 'left', 'top', 'bottom', 'front', 'back'];

  order.forEach(function(face, index) {
    var mat = blockMesh.material[index];
    var url = faceTextures[face];

    var loader = new THREE.TextureLoader();
    loader.load(url || QUESTION_PATTERN, function(tex) {
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      mat.map = tex;
      mat.needsUpdate = true;
    });
  });
}

// ===== آپدیت اطلاعات وجه‌ها =====
function updateFaceInfo() {
  var items = document.querySelectorAll('.face-item');
  items.forEach(function(item) {
    var face = item.getAttribute('data-face');
    var nameFa = getFaceNameFa(face);

    if (faceTextures[face]) {
      item.classList.add('filled');
      item.innerHTML = nameFa + ': <b>✓</b>';
    } else {
      item.classList.remove('filled');
      item.innerHTML = nameFa + ': <b>-</b>';
    }

    if (selectedFace === face) {
      item.classList.add('current');
    } else {
      item.classList.remove('current');
    }
  });
}

// ===== آپدیت وضعیت =====
function updateStatus(msg) {
  var status = document.getElementById('blockStatus');
  if (!status) return;
  status.innerHTML = '<svg><use href="#i-cube"/></svg> ' + msg;
}

// ===== چک کردن کامل بودن =====
function updateDownloadBtn() {
  var allFilled = true;
  for (var face in faceTextures) {
    if (!faceTextures[face]) {
      allFilled = false;
      break;
    }
  }

  var btn = document.getElementById('blockDlBtn');
  if (btn) btn.disabled = !allFilled;

  var status = document.getElementById('blockStatus');
  if (allFilled) {
    updateStatus('همه‌ی وجه‌ها کامل شدن! می‌تونی دانلود کنی');
    if (status) status.classList.add('active');
  } else {
    if (status) status.classList.remove('active');
  }
}

// ===== دانلود =====
function downloadBlockRig() {
  var allFilled = true;
  for (var face in faceTextures) {
    if (!faceTextures[face]) {
      allFilled = false;
      break;
    }
  }

  if (!allFilled) {
    alert('اول باید همه‌ی ۶ وجه رو تکسچر بدی!');
    return;
  }

  try {
    var zip = new JSZip();
    var objLines = ['# Nova Rigs - Block Rig', 'mtllib model.mtl', 'usemtl block', ''];
    var textureNames = [];
    var texIndices = {};

    for (var face in faceTextures) {
      var url = faceTextures[face];
      var existingIdx = -1;
      for (var i = 0; i < textureNames.length; i++) {
        if (textureNames[i] === url) {
          existingIdx = i;
          break;
        }
      }
      if (existingIdx === -1) {
        texIndices[face] = textureNames.length;
        textureNames.push(url);
      } else {
        texIndices[face] = existingIdx;
      }
    }

    var mtlLines = ['# Nova Rigs - Block MTL'];
    textureNames.forEach(function(url, index) {
      mtlLines.push('newmtl texture_' + index);
      mtlLines.push('Ka 1 1 1');
      mtlLines.push('Kd 1 1 1');
      mtlLines.push('Ks 0 0 0');
      mtlLines.push('d 1.0');
      mtlLines.push('illum 1');
      mtlLines.push('map_Kd texture_' + index + '.png');
      mtlLines.push('');
    });

    var s = 8;
    var verts = [
      [-s, -s,  s], [ s, -s,  s], [ s,  s,  s], [-s,  s,  s],
      [ s, -s, -s], [-s, -s, -s], [-s,  s, -s], [ s,  s, -s]
    ];
    verts.forEach(function(v) {
      objLines.push('v ' + v[0] + ' ' + v[1] + ' ' + v[2]);
    });

    objLines.push('vt 0 1');
    objLines.push('vt 1 1');
    objLines.push('vt 1 0');
    objLines.push('vt 0 0');

    [[0,0,1],[0,0,-1],[1,0,0],[-1,0,0],[0,1,0],[0,-1,0]].forEach(function(n) {
      objLines.push('vn ' + n[0] + ' ' + n[1] + ' ' + n[2]);
    });

    objLines.push('usemtl texture_' + texIndices.front);
    objLines.push('f 1/1/1 2/2/1 3/3/1 4/4/1');

    objLines.push('usemtl texture_' + texIndices.back);
    objLines.push('f 5/2/2 6/1/2 7/4/2 8/3/2');

    objLines.push('usemtl texture_' + texIndices.right);
    objLines.push('f 2/1/3 5/2/3 8/3/3 3/4/3');

    objLines.push('usemtl texture_' + texIndices.left);
    objLines.push('f 6/1/4 1/2/4 4/3/4 7/4/4');

    objLines.push('usemtl texture_' + texIndices.top);
    objLines.push('f 4/1/5 3/2/5 8/3/5 7/4/5');

    objLines.push('usemtl texture_' + texIndices.bottom);
    objLines.push('f 6/1/6 5/2/6 2/3/6 1/4/6');

    zip.file('model.obj', objLines.join('\n'));
    zip.file('model.mtl', mtlLines.join('\n'));

    var texturePromises = textureNames.map(function(url, index) {
      return fetch(url).then(function(r) { return r.blob(); }).then(function(blob) {
        zip.file('texture_' + index + '.png', blob);
      });
    });

    Promise.all(texturePromises).then(function() {
      return zip.generateAsync({ type: 'blob', compression: 'STORE' });
    }).then(function(blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'nova-rigs-block.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
      updateStatus('ریگ دانلود شد!');
    });

  } catch(e) {
    console.error(e);
    alert('خطا: ' + e.message);
  }
}

// ===== شروع =====
loadBlocks();

var searchBtn = document.getElementById('blockSearchBtn');
if (searchBtn) searchBtn.onclick = searchBlockTextures;

var searchInput = document.getElementById('blockSearchInput');
if (searchInput) {
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') searchBlockTextures();
  });
}
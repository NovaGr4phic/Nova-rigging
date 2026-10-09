// ===== تبدیل تکسچر به سه‌بعدی =====
var scene, camera, renderer, controls, mesh;
var imgData = null;
var originalCanvas = null;
var resizedCanvas = null;
var objData = null;

function initViewer() {
  var v = document.getElementById('viewer');
  if (!v) return;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, v.clientWidth / v.clientHeight, 0.1, 10000);
  camera.position.set(20, 20, 30);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(v.clientWidth, v.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  v.appendChild(renderer.domElement);
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.2;
  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  var l1 = new THREE.DirectionalLight(0xffffff, 0.7);
  l1.position.set(1, 1.5, 1);
  scene.add(l1);
  var l2 = new THREE.DirectionalLight(0xd946ef, 0.4);
  l2.position.set(-1, -0.5, -1);
  scene.add(l2);
  var grid = new THREE.GridHelper(100, 20, 0xa855f7, 0x4c1d95);
  grid.material.opacity = 0.25;
  grid.material.transparent = true;
  scene.add(grid);
  loop();
  window.addEventListener('resize', function() {
    camera.aspect = v.clientWidth / v.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(v.clientWidth, v.clientHeight);
  });
}

function loop() {
  requestAnimationFrame(loop);
  controls.update();
  renderer.render(scene, camera);
}

function setupFileUpload() {
  var fileInput = document.getElementById('file');
  if (!fileInput) return;
  fileInput.addEventListener('change', function(e) {
    var f = e.target.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function(ev) {
      var img = new Image();
      img.onload = function() { processLoadedImage(img, f.name); };
      img.onerror = function() { showStatus('err', 'فایل تصویری نامعتبر'); };
      img.src = ev.target.result;
    };
    r.readAsDataURL(f);
  });
}

function processLoadedImage(img, name) {
  try {
    originalCanvas = document.createElement('canvas');
    originalCanvas.width = img.width;
    originalCanvas.height = img.height;
    var ctx = originalCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0);
    imgData = ctx.getImageData(0, 0, img.width, img.height);

    document.getElementById('preview').src = originalCanvas.toDataURL('image/png');
    document.getElementById('preview').style.display = 'block';
    document.getElementById('os').textContent = img.width + '×' + img.height;
    document.getElementById('uploadTxt').textContent = 'انتخاب شد: ' + name;
    showStatus('ok', 'آماده تبدیل');
    document.getElementById('conv').disabled = false;
    document.getElementById('rst').disabled = false;
  } catch(e) {
    showStatus('err', 'خطا در پردازش تصویر');
    console.error(e);
  }
}

function showStatus(type, msg) {
  var st = document.getElementById('st');
  if (!st) return;
  var icons = { ok: 'i-check', err: 'i-x', load: 'i-spinner' };
  var iconId = icons[type] || 'i-check';
  st.innerHTML = '<svg><use href="#' + iconId + '"/></svg> ' + msg;
  st.className = 'status ' + type;
}

function setupSliders() {
  var t = document.getElementById('thick');
  var a = document.getElementById('alpha');
  var m = document.getElementById('maxs');
  if (t) t.oninput = function(e) { document.getElementById('tv').textContent = e.target.value; };
  if (a) a.oninput = function(e) { document.getElementById('av').textContent = e.target.value; };
  if (m) m.oninput = function(e) { document.getElementById('mv').textContent = e.target.value; };
}

function setupConvert() {
  var btn = document.getElementById('conv');
  if (!btn) return;
  btn.onclick = function() {
    if (!imgData) return;
    showStatus('load', 'در حال پردازش...');
    setTimeout(function() {
      try {
        var thick = parseFloat(document.getElementById('thick').value);
        var alphaTh = parseInt(document.getElementById('alpha').value);
        var maxs = parseInt(document.getElementById('maxs').value);
        build(imgData, thick, alphaTh, maxs);
        showStatus('ok', 'مدل ساخته شد!');
        document.getElementById('dlZip').disabled = false;
      } catch(err) {
        showStatus('err', err.message);
      }
    }, 50);
  };
}

function build(data, thick, alphaTh, maxs) {
  if (mesh) {
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
    mesh = null;
  }
  var w = data.width, h = data.height, d = data.data;
  var texCanvas = originalCanvas;

  if (w > maxs || h > maxs) {
    var sf = Math.max(w, h) / maxs;
    var nw = Math.round(w / sf), nh = Math.round(h / sf);
    var sc = document.createElement('canvas');
    sc.width = w; sc.height = h;
    sc.getContext('2d').putImageData(data, 0, 0);
    texCanvas = document.createElement('canvas');
    texCanvas.width = nw; texCanvas.height = nh;
    var tctx = texCanvas.getContext('2d');
    tctx.imageSmoothingEnabled = false;
    tctx.drawImage(sc, 0, 0, nw, nh);
    var nd = tctx.getImageData(0, 0, nw, nh);
    w = nw; h = nh; d = nd.data;
  }

  resizedCanvas = texCanvas;
  var positions = [], uvs = [], normals = [], indices = [];
  var vc = 0, fc = 0, voxc = 0;
  var s = 0.5, z = thick / 2;

  var faceVerts = [
    [[-s,-s, z], [s,-s, z], [s,s, z], [-s,s, z]],
    [[ s,-s,-z], [-s,-s,-z], [-s,s,-z], [ s,s,-z]],
    [[-s, s, z], [s, s, z], [s, s,-z], [-s, s,-z]],
    [[-s,-s,-z], [s,-s,-z], [s,-s, z], [-s,-s, z]],
    [[ s,-s, z], [s,-s,-z], [s, s,-z], [ s, s, z]],
    [[-s,-s,-z], [-s,-s, z], [-s, s, z], [-s, s,-z]]
  ];
  var faceNorms = [[0,0,1],[0,0,-1],[0,1,0],[0,-1,0],[1,0,0],[-1,0,0]];

  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      var i = (y * w + x) * 4;
      var r = d[i] / 255, g = d[i+1] / 255, b = d[i+2] / 255, a = d[i+3];
      if (a < alphaTh) continue;
      voxc++;
      var cx = x - w / 2 + 0.5;
      var cy = (h - y - 1) - h / 2 + 0.5;
      var u0 = x / w, u1 = (x + 1) / w;
      var v0 = 1 - (y + 1) / h, v1 = 1 - y / h;
      for (var f = 0; f < 6; f++) {
        for (var vi = 0; vi < 4; vi++) {
          positions.push(faceVerts[f][vi][0] + cx, faceVerts[f][vi][1] + cy, faceVerts[f][vi][2]);
          normals.push(faceNorms[f][0], faceNorms[f][1], faceNorms[f][2]);
        }
        uvs.push(u0, v0, u1, v0, u1, v1, u0, v1);
        indices.push(vc, vc+1, vc+2, vc, vc+2, vc+3);
        vc += 4; fc += 2;
      }
    }
  }

  if (voxc === 0) throw new Error('هیچ پیکسل غیرشفافی پیدا نشد!');

  objData = { positions: positions, uvs: uvs, normals: normals, indices: indices };

  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);

  var threeTex = new THREE.CanvasTexture(texCanvas);
  threeTex.magFilter = THREE.NearestFilter;
  threeTex.minFilter = THREE.NearestFilter;
  var mat = new THREE.MeshLambertMaterial({ map: threeTex, side: THREE.DoubleSide });
  mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  var box = new THREE.Box3().setFromObject(mesh);
  var center = box.getCenter(new THREE.Vector3());
  var size = box.getSize(new THREE.Vector3());
  var md = Math.max(size.x, size.y, size.z);
  camera.position.set(center.x + md * 1.5, center.y + md * 1.5, center.z + md * 1.5);
  controls.target.copy(center);
  controls.update();

  document.getElementById('vc').textContent = voxc.toLocaleString('fa-IR');
  document.getElementById('fc').textContent = fc.toLocaleString('fa-IR');
}

function generateOBJ() {
  var lines = ['# Nova Rigs', 'mtllib model.mtl', 'usemtl texture', ''];
  var pos = objData.positions, uvs = objData.uvs, norms = objData.normals, idx = objData.indices;
  for (var i = 0; i < pos.length; i += 3) {
    lines.push('v ' + pos[i].toFixed(6) + ' ' + pos[i+1].toFixed(6) + ' ' + pos[i+2].toFixed(6));
  }
  for (var i = 0; i < uvs.length; i += 2) {
    lines.push('vt ' + uvs[i].toFixed(6) + ' ' + uvs[i+1].toFixed(6));
  }
  for (var i = 0; i < norms.length; i += 3) {
    lines.push('vn ' + norms[i].toFixed(6) + ' ' + norms[i+1].toFixed(6) + ' ' + norms[i+2].toFixed(6));
  }
  for (var i = 0; i < idx.length; i += 3) {
    var a = idx[i] + 1, b = idx[i+1] + 1, c = idx[i+2] + 1;
    lines.push('f ' + a + '/' + a + '/' + a + ' ' + b + '/' + b + '/' + b + ' ' + c + '/' + c + '/' + c);
  }
  return lines.join('\n');
}

function generateMTL() {
  return '# Nova Rigs\nnewmtl texture\nKa 1 1 1\nKd 1 1 1\nKs 0 0 0\nd 1.0\nillum 1\nmap_Kd texture.png\n';
}

function setupDownload() {
  var btn = document.getElementById('dlZip');
  if (!btn) return;
  btn.onclick = function() {
    if (!mesh) return;
    try {
      var zip = new JSZip();
      zip.file('model.obj', generateOBJ());
      zip.file('model.mtl', generateMTL());
      var texDataURL = resizedCanvas.toDataURL('image/png');
      zip.file('texture.png', texDataURL.split(',')[1], { base64: true });
      zip.generateAsync({ type: 'blob' }).then(function(blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'nova-rigs-model.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
        showStatus('ok', 'ZIP دانلود شد!');
      });
    } catch(e) {
      showStatus('err', e.message);
    }
  };
}

function setupReset() {
  var btn = document.getElementById('rst');
  if (!btn) return;
  btn.onclick = function() {
    if (mesh) {
      scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
      mesh = null;
    }
    document.getElementById('file').value = '';
    imgData = null;
    originalCanvas = null;
    document.getElementById('preview').style.display = 'none';
    document.getElementById('os').textContent = '-';
    document.getElementById('vc').textContent = '-';
    document.getElementById('fc').textContent = '-';
    document.getElementById('conv').disabled = true;
    document.getElementById('rst').disabled = true;
    document.getElementById('dlZip').disabled = true;
    document.getElementById('uploadTxt').textContent = 'برای انتخاب تکسچر کلیک کن';
    showStatus('', 'منتظر انتخاب تکسچر...');
  };
}

initViewer();
setupFileUpload();
setupSliders();
setupConvert();
setupDownload();
setupReset();
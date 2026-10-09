// ===== دانلود بلاک انتخاب‌شده =====
function downloadBlock(block) {
  if (!block) return;

  try {
    var zip = new JSZip();
    var objLines = ['# Nova Rigs - Block Rig', 'mtllib model.mtl', 'usemtl block', ''];
    
    var textures = {};
    var textureNames = [];
    
    // جمع‌آوری تکسچرهای یکتا
    for (var face in block.faces) {
      var texData = block.faces[face];
      if (!textures[texData]) {
        var texName = 'texture_' + textureNames.length + '.png';
        textures[texData] = texName;
        textureNames.push(texData);
      }
    }
    
    // ساخت MTL
    var mtlLines = ['# Nova Rigs - Block MTL'];
    textureNames.forEach(function(texData, index) {
      mtlLines.push('newmtl texture_' + index);
      mtlLines.push('Ka 1 1 1');
      mtlLines.push('Kd 1 1 1');
      mtlLines.push('Ks 0 0 0');
      mtlLines.push('d 1.0');
      mtlLines.push('illum 1');
      mtlLines.push('map_Kd texture_' + index + '.png');
      mtlLines.push('');
    });
    
    // ساخت مکعب
    var s = 8; // نیم اندازه مکعب (کل: 16 واحد)
    
    // 8 راس مکعب
    var verts = [
      [-s, -s,  s], [ s, -s,  s], [ s,  s,  s], [-s,  s,  s], // جلو
      [ s, -s, -s], [-s, -s, -s], [-s,  s, -s], [ s,  s, -s]  // پشت
    ];
    
    verts.forEach(function(v) {
      objLines.push('v ' + v[0] + ' ' + v[1] + ' ' + v[2]);
    });
    
    // UVها (0,0 تا 1,1 برای هر وجه)
    var uvs = [
      [0,0], [1,0], [1,1], [0,1]
    ];
    
    uvs.forEach(function(uv) {
      objLines.push('vt ' + uv[0] + ' ' + uv[1]);
    });
    
    // Normals
    var normals = [
      [0, 0, 1],   // جلو
      [0, 0, -1],  // پشت
      [1, 0, 0],   // راست
      [-1, 0, 0],  // چپ
      [0, 1, 0],   // بالا
      [0, -1, 0]   // پایین
    ];
    
    normals.forEach(function(n) {
      objLines.push('vn ' + n[0] + ' ' + n[1] + ' ' + n[2]);
    });
    
    // ===== تعریف وجه‌ها =====
    // هر وجه: 4 راس + UV + normal
    // ترتیب: front, back, right, left, top, bottom
    
    // جلو (front)
    var frontTexIdx = getTexIndex(block.faces.front, textureNames);
    objLines.push('usemtl texture_' + frontTexIdx);
    objLines.push('f 1/1/1 2/2/1 3/3/1 4/4/1');
    
    // پشت (back)
    var backTexIdx = getTexIndex(block.faces.back || block.faces.front, textureNames);
    objLines.push('usemtl texture_' + backTexIdx);
    objLines.push('f 5/1/2 8/2/2 7/3/2 6/4/2');
    
    // راست (right)
    var rightTexIdx = getTexIndex(block.faces.right || block.faces.side || block.faces.front, textureNames);
    objLines.push('usemtl texture_' + rightTexIdx);
    objLines.push('f 2/1/3 5/2/3 8/3/3 3/4/3');
    
    // چپ (left)
    var leftTexIdx = getTexIndex(block.faces.left || block.faces.side || block.faces.front, textureNames);
    objLines.push('usemtl texture_' + leftTexIdx);
    objLines.push('f 6/1/4 1/2/4 4/3/4 7/4/4');
    
    // بالا (top)
    var topTexIdx = getTexIndex(block.faces.top || block.faces.front, textureNames);
    objLines.push('usemtl texture_' + topTexIdx);
    objLines.push('f 4/1/5 3/2/5 8/3/5 7/4/5');
    
    // پایین (bottom)
    var bottomTexIdx = getTexIndex(block.faces.bottom || block.faces.top || block.faces.front, textureNames);
    objLines.push('usemtl texture_' + bottomTexIdx);
    objLines.push('f 6/1/6 5/2/6 2/3/6 1/4/6');
    
    // ساخت OBJ
    zip.file('model.obj', objLines.join('\n'));
    zip.file('model.mtl', mtlLines.join('\n'));
    
    // اضافه کردن تکسچرها
    textureNames.forEach(function(texData, index) {
      var base64 = texData.split(',')[1];
      zip.file('texture_' + index + '.png', base64, { base64: true });
    });
    
    // دانلود ZIP
    zip.generateAsync({ type: 'blob' }).then(function(blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'nova-rigs-' + block.name + '.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    });
    
  } catch(e) {
    console.error(e);
    alert('خطا: ' + e.message);
  }
}

function getTexIndex(texData, textureNames) {
  var idx = textureNames.indexOf(texData);
  return idx !== -1 ? idx : 0;
}

// ===== دکمه دانلود بلاک =====
document.addEventListener('DOMContentLoaded', function() {
  // اضافه کردن دکمه به هر کارت
  var blockResults = document.getElementById('blockResults');
  if (blockResults) {
    blockResults.addEventListener('click', function(e) {
      var card = e.target.closest('.block-card');
      if (card && window.selectedBlock) {
        // دوبار کلیک → دانلود
      }
    });
  }
  
  // کیبورد Enter برای دانلود
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && window.selectedBlock) {
      downloadBlock(window.selectedBlock);
    }
  });
});
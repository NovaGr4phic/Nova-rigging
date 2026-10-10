// ===== ریگ بلاک =====
var BLOCKS_ZIP_URL = 'https://novagr4phic.github.io/Nova-rigging/blocks.zip';
var BLOCK_DATABASE = [];
var BLOCK_ZIP_LOADED = false;
var BLOCK_LOADING = false;

// ===== جدول دانش ماینکرفت =====
var BLOCK_KNOWLEDGE = {
  'grass_block': { top: 'grass_block_top', side: 'grass_block_side', bottom: 'dirt' },
  'crafting_table': { front: 'crafting_table_front', side: 'crafting_table_side', top: 'crafting_table_top', bottom: 'oak_planks' },
  'oak_log': { top: 'oak_log_top', bottom: 'oak_log_top', side: 'oak_log' },
  'birch_log': { top: 'birch_log_top', bottom: 'birch_log_top', side: 'birch_log' },
  'spruce_log': { top: 'spruce_log_top', bottom: 'spruce_log_top', side: 'spruce_log' },
  'jungle_log': { top: 'jungle_log_top', bottom: 'jungle_log_top', side: 'jungle_log' },
  'acacia_log': { top: 'acacia_log_top', bottom: 'acacia_log_top', side: 'acacia_log' },
  'dark_oak_log': { top: 'dark_oak_log_top', bottom: 'dark_oak_log_top', side: 'dark_oak_log' },
  'mangrove_log': { top: 'mangrove_log_top', bottom: 'mangrove_log_top', side: 'mangrove_log' },
  'cherry_log': { top: 'cherry_log_top', bottom: 'cherry_log_top', side: 'cherry_log' },
  'bamboo_block': { top: 'bamboo_block_top', bottom: 'bamboo_block_top', side: 'bamboo_block' },
  'crimson_stem': { top: 'crimson_stem_top', bottom: 'crimson_stem_top', side: 'crimson_stem' },
  'warped_stem': { top: 'warped_stem_top', bottom: 'warped_stem_top', side: 'warped_stem' },
  'furnace': { front: 'furnace_front_off', side: 'furnace_side', top: 'furnace_top', bottom: 'furnace_top' },
  'blast_furnace': { front: 'blast_furnace_front_off', side: 'blast_furnace_side', top: 'blast_furnace_top', bottom: 'blast_furnace_top' },
  'smoker': { front: 'smoker_front_off', side: 'smoker_side', top: 'smoker_top', bottom: 'smoker_bottom' },
  'chest': { front: 'chest_front', side: 'chest_side', top: 'chest_top', bottom: 'chest_top' },
  'ender_chest': { front: 'ender_chest_front', side: 'ender_chest_side', top: 'ender_chest_top', bottom: 'ender_chest_top' },
  'trapped_chest': { front: 'trapped_chest_front', side: 'trapped_chest_side', top: 'trapped_chest_top', bottom: 'trapped_chest_top' },
  'bookshelf': { top: 'oak_planks', bottom: 'oak_planks', side: 'bookshelf' },
  'pumpkin': { top: 'pumpkin_top', bottom: 'pumpkin_top', side: 'pumpkin_side', front: 'pumpkin_face_off' },
  'carved_pumpkin': { top: 'pumpkin_top', bottom: 'pumpkin_top', side: 'pumpkin_side', front: 'carved_pumpkin' },
  'jack_o_lantern': { top: 'pumpkin_top', bottom: 'pumpkin_top', side: 'pumpkin_side', front: 'jack_o_lantern' },
  'melon': { top: 'melon_top', bottom: 'melon_top', side: 'melon_side' },
  'hay_block': { top: 'hay_block_top', bottom: 'hay_block_top', side: 'hay_block_side' },
  'bone_block': { top: 'bone_block_top', bottom: 'bone_block_top', side: 'bone_block_side' },
  'quartz_block': { top: 'quartz_block_top', bottom: 'quartz_block_bottom', side: 'quartz_block_side' },
  'snow_block': { top: 'snow', bottom: 'snow', side: 'snow' },
  'sandstone': { top: 'sandstone_top', bottom: 'sandstone_bottom', side: 'sandstone' },
  'chiseled_sandstone': { top: 'sandstone_top', bottom: 'sandstone_bottom', side: 'chiseled_sandstone' },
  'cut_sandstone': { top: 'sandstone_top', bottom: 'sandstone_bottom', side: 'cut_sandstone' },
  'red_sandstone': { top: 'red_sandstone_top', bottom: 'red_sandstone_bottom', side: 'red_sandstone' },
  'purpur_pillar': { top: 'purpur_pillar_top', bottom: 'purpur_pillar_top', side: 'purpur_pillar' },
  'basalt': { top: 'basalt_top', bottom: 'basalt_top', side: 'basalt_side' },
  'polished_basalt': { top: 'polished_basalt_top', bottom: 'polished_basalt_top', side: 'polished_basalt_side' },
  'deepslate': { top: 'deepslate_top', bottom: 'deepslate_top', side: 'deepslate' },
  'tnt': { top: 'tnt_top', bottom: 'tnt_bottom', side: 'tnt_side' },
  'dried_kelp_block': { top: 'dried_kelp_top', bottom: 'dried_kelp_bottom', side: 'dried_kelp_side' }
};

var EXCLUDE_PATTERNS = [
  '_pane', '_door', '_trapdoor', '_vine', '_rod', '_coral',
  '_pattern', '_stem', '_stage', '_age', '_lit', '_active',
  '_blooming', '_lower', '_upper', '_inner', '_outer', '_tip', '_head',
  '_on', '_off'
];

function shouldExclude(name) {
  var lower = name.toLowerCase();
  for (var i = 0; i < EXCLUDE_PATTERNS.length; i++) {
    if (lower.indexOf(EXCLUDE_PATTERNS[i]) !== -1) return true;
  }
  return false;
}

// ===== لود ZIP =====
function loadBlocks() {
  if (BLOCK_LOADING) return;
  BLOCK_LOADING = true;

  var results = document.getElementById('blockResults');
  results.innerHTML = '<div class="no-result">در حال دانلود پکیج بلاک‌ها...<br><small>اولین بار چند ثانیه طول می‌کشه</small></div>';

  fetch(BLOCKS_ZIP_URL)
    .then(function(r) {
      if (!r.ok) throw new Error('خطا در دانلود ZIP');
      return r.blob();
    })
    .then(function(blob) {
      results.innerHTML = '<div class="no-result">در حال باز کردن پکیج...</div>';
      return JSZip.loadAsync(blob);
    })
    .then(function(zip) {
      var promises = [];
      var textureMap = {};

      zip.forEach(function(path, file) {
        if (!path.toLowerCase().endsWith('.png')) return;
        var filename = path.split('/').pop().replace('.png', '');
        if (shouldExclude(filename)) return;

        var p = file.async('blob').then(function(blob) {
          textureMap[filename] = URL.createObjectURL(blob);
        });
        promises.push(p);
      });

      return Promise.all(promises).then(function() { return textureMap; });
    })
    .then(function(textureMap) {
      buildBlockGroups(textureMap);
      BLOCK_ZIP_LOADED = true;
      BLOCK_LOADING = false;

      document.getElementById('blockResults').innerHTML =
        '<div class="no-result">' + BLOCK_DATABASE.length + ' بلاک آماده جستجوئه!<br>یه کلمه تایپ کن</div>';

      document.getElementById('blockSearchBtn').disabled = false;
    })
    .catch(function(err) {
      BLOCK_LOADING = false;
      console.error(err);
      document.getElementById('blockResults').innerHTML =
        '<div class="no-result">خطا در لود بلاک‌ها<br><small>' + err.message + '</small></div>';
    });
}

// ===== گروه‌بندی =====
function buildBlockGroups(textureMap) {
  var usedTextures = {};

  for (var blockName in BLOCK_KNOWLEDGE) {
    var faces = BLOCK_KNOWLEDGE[blockName];
    var blockTex = {};
    var allFound = true;

    for (var face in faces) {
      var texName = faces[face];
      if (textureMap[texName]) {
        blockTex[face] = textureMap[texName];
        usedTextures[texName] = true;
      } else {
        allFound = false;
      }
    }

    if (allFound) {
      BLOCK_DATABASE.push({ name: blockName, faces: blockTex });
    }
  }

  var baseGroups = {};
  for (var texName in textureMap) {
    if (usedTextures[texName]) continue;

    if (texName.indexOf('_front') !== -1 ||
        texName.indexOf('_side') !== -1 ||
        texName.indexOf('_top') !== -1 ||
        texName.indexOf('_bottom') !== -1 ||
        texName.indexOf('_back') !== -1) {

      var baseName = texName
        .replace('_front', '').replace('_side', '')
        .replace('_top', '').replace('_bottom', '').replace('_back', '');

      if (!baseGroups[baseName]) baseGroups[baseName] = {};
      if (texName.indexOf('_front') !== -1 && !baseGroups[baseName].front) baseGroups[baseName].front = texName;
      if (texName.indexOf('_side') !== -1 && !baseGroups[baseName].side) baseGroups[baseName].side = texName;
      if (texName.indexOf('_top') !== -1 && !baseGroups[baseName].top) baseGroups[baseName].top = texName;
      if (texName.indexOf('_bottom') !== -1 && !baseGroups[baseName].bottom) baseGroups[baseName].bottom = texName;
      if (texName.indexOf('_back') !== -1 && !baseGroups[baseName].back) baseGroups[baseName].back = texName;

      usedTextures[texName] = true;
    }
  }

  for (var baseName in baseGroups) {
    var group = baseGroups[baseName];
    if (group.front || group.side || group.top) {
      var blockTex = {};
      if (group.front) blockTex.front = textureMap[group.front];
      if (group.side) blockTex.side = textureMap[group.side];
      if (group.top) blockTex.top = textureMap[group.top];
      if (group.bottom) blockTex.bottom = textureMap[group.bottom];
      if (group.back) blockTex.back = textureMap[group.back];

      if (!blockTex.front && blockTex.side) blockTex.front = blockTex.side;
      if (!blockTex.back) {
        if (blockTex.side) blockTex.back = blockTex.side;
        else if (blockTex.front) blockTex.back = blockTex.front;
      }
      if (!blockTex.left) {
        if (blockTex.side) blockTex.left = blockTex.side;
        else if (blockTex.front) blockTex.left = blockTex.front;
      }
      if (!blockTex.right) {
        if (blockTex.side) blockTex.right = blockTex.side;
        else if (blockTex.front) blockTex.right = blockTex.front;
      }
      if (!blockTex.top) {
        if (blockTex.side) blockTex.top = blockTex.side;
        else if (blockTex.front) blockTex.top = blockTex.front;
      }
      if (!blockTex.bottom) {
        if (blockTex.top) blockTex.bottom = blockTex.top;
        else if (blockTex.side) blockTex.bottom = blockTex.side;
        else if (blockTex.front) blockTex.bottom = blockTex.front;
      }

      BLOCK_DATABASE.push({ name: baseName, faces: blockTex });
    }
  }

  for (var texName in textureMap) {
    if (usedTextures[texName]) continue;

    BLOCK_DATABASE.push({
      name: texName,
      faces: {
        front: textureMap[texName],
        back: textureMap[texName],
        left: textureMap[texName],
        right: textureMap[texName],
        top: textureMap[texName],
        bottom: textureMap[texName]
      }
    });
  }
}

function getFaceTexture(faces, face) {
  if (faces[face]) return faces[face];
  if (face === 'front' || face === 'back' || face === 'left' || face === 'right') {
    if (faces.side) return faces.side;
  }
  if (face === 'top' || face === 'bottom') {
    if (faces.top) return faces.top;
  }
  if (faces.front) return faces.front;
  for (var key in faces) return faces[key];
  return null;
}

// ===== جستجو =====
function searchBlocks() {
  var q = document.getElementById('blockSearchInput').value.trim().toLowerCase();
  var results = document.getElementById('blockResults');

  if (!q) {
    results.innerHTML = '<div class="no-result">کلمه‌ای برای جستجو وارد کن</div>';
    return;
  }
  if (!BLOCK_ZIP_LOADED) {
    results.innerHTML = '<div class="no-result">بلاک‌ها هنوز لود نشدن. چند ثانیه صبر کن...</div>';
    return;
  }

  var found = BLOCK_DATABASE.filter(function(item) {
    return item.name.toLowerCase().indexOf(q) !== -1;
  });

  if (found.length === 0) {
    results.innerHTML = '<div class="no-result">بلاکی با "' + q + '" پیدا نشد</div>';
    return;
  }

  results.innerHTML = '';
  found.slice(0, 60).forEach(function(block) {
    var card = document.createElement('div');
    card.className = 'block-card';

    var cubeWrap = document.createElement('div');
    cubeWrap.className = 'cube-wrap';
    var cube = document.createElement('div');
    cube.className = 'cube';

    ['front', 'back', 'right', 'left', 'top', 'bottom'].forEach(function(face) {
      var faceDiv = document.createElement('div');
      faceDiv.className = 'cube-face ' + face;
      var tex = getFaceTexture(block.faces, face);
      if (tex) faceDiv.style.backgroundImage = 'url(' + tex + ')';
      cube.appendChild(faceDiv);
    });

    cubeWrap.appendChild(cube);

    var name = document.createElement('div');
    name.className = 'block-name';
    name.textContent = block.name;

    var dlBtn = document.createElement('button');
    dlBtn.className = 'block-dl-btn';
    dlBtn.innerHTML = 'دانلود';
    dlBtn.onclick = function(e) {
      e.stopPropagation();
      downloadBlock(block);
    };

    card.appendChild(cubeWrap);
    card.appendChild(name);
    card.appendChild(dlBtn);

    card.onclick = function() {
      var all = results.querySelectorAll('.block-card');
      for (var i = 0; i < all.length; i++) all[i].classList.remove('selected');
      card.classList.add('selected');
    };

    results.appendChild(card);
  });
}

// ===== دانلود =====
function downloadBlock(block) {
  if (!block) return;

  try {
    var zip = new JSZip();
    var objLines = ['# Nova Rigs - Block Rig', 'mtllib model.mtl', 'usemtl block', ''];
    var textures = {};
    var textureNames = [];
    var texIndices = {};

    var facesToUse = ['front', 'back', 'right', 'left', 'top', 'bottom'];
    facesToUse.forEach(function(face) {
      var texData = getFaceTexture(block.faces, face);
      if (!texData) return;

      if (!textures[texData]) {
        var idx = textureNames.length;
        textures[texData] = 'texture_' + idx + '.png';
        textureNames.push(texData);
        texIndices[face] = idx;
      } else {
        texIndices[face] = textureNames.indexOf(texData);
      }
    });

    if (textureNames.length === 0) {
      alert('هیچ تکسچری برای این بلاک پیدا نشد!');
      return;
    }

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

    objLines.push('usemtl texture_' + (texIndices.front !== undefined ? texIndices.front : 0));
    objLines.push('f 1/1/1 2/2/1 3/3/1 4/4/1');

    objLines.push('usemtl texture_' + (texIndices.back !== undefined ? texIndices.back : 0));
    objLines.push('f 5/2/2 6/1/2 7/4/2 8/3/2');

    objLines.push('usemtl texture_' + (texIndices.right !== undefined ? texIndices.right : 0));
    objLines.push('f 2/1/3 5/2/3 8/3/3 3/4/3');

    objLines.push('usemtl texture_' + (texIndices.left !== undefined ? texIndices.left : 0));
    objLines.push('f 6/1/4 1/2/4 4/3/4 7/4/4');

    objLines.push('usemtl texture_' + (texIndices.top !== undefined ? texIndices.top : 0));
    objLines.push('f 4/1/5 3/2/5 8/3/5 7/4/5');

    objLines.push('usemtl texture_' + (texIndices.bottom !== undefined ? texIndices.bottom : 0));
    objLines.push('f 6/1/6 5/2/6 2/3/6 1/4/6');

    zip.file('model.obj', objLines.join('\n'));
    zip.file('model.mtl', mtlLines.join('\n'));

    // تکسچرها رو مستقیم از Blob اضافه کن
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

// ===== شروع =====
loadBlocks();

document.getElementById('blockSearchBtn').onclick = searchBlocks;
document.getElementById('blockSearchInput').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') searchBlocks();
});
// ===== جستجوی تکسچر =====
var TEXTURES_URL = 'textures.json';
var TEXTURE_DATABASE = [];

function loadTextures() {
  fetch(TEXTURES_URL + '?t=' + Date.now())
    .then(function(r) {
      if (!r.ok) throw new Error('not found');
      return r.json();
    })
    .then(function(data) {
      TEXTURE_DATABASE = data.textures || [];
      console.log('✅ ' + TEXTURE_DATABASE.length + ' تکسچر لود شد');
    })
    .catch(function(err) {
      console.warn('⚠️ textures.json لود نشد:', err.message);
    });
}

function doSearch() {
  var q = document.getElementById('searchInput').value.trim().toLowerCase();
  var results = document.getElementById('results');
  if (!q) {
    results.innerHTML = '<div class="no-result"><svg><use href="#i-search"/></svg> کلمه‌ای برای جستجو وارد کن</div>';
    return;
  }
  if (TEXTURE_DATABASE.length === 0) {
    results.innerHTML = '<div class="no-result">⚠️ دیتابیس تکسچرها هنوز آماده نیست<br>چند ثانیه صبر کن و دوباره بزن</div>';
    return;
  }
  var found = TEXTURE_DATABASE.filter(function(item) {
    return item.name.toLowerCase().indexOf(q) !== -1 ||
           (item.category && item.category.indexOf(q) !== -1);
  });
  if (found.length === 0) {
    results.innerHTML = '<div class="no-result">❌ تکسچری با "' + q + '" پیدا نشد</div>';
    return;
  }
  results.innerHTML = '';
  found.slice(0, 60).forEach(function(item) {
    var div = document.createElement('div');
    div.className = 'result-item';
    var img = document.createElement('img');
    img.src = item.url;
    img.crossOrigin = 'anonymous';
    img.loading = 'lazy';
    img.onerror = function() { this.style.opacity = '0.2'; };
    var name = document.createElement('div');
    name.className = 'name';
    name.textContent = item.name;
    div.appendChild(img);
    div.appendChild(name);
    div.onclick = function() {
      var all = results.querySelectorAll('.result-item');
      for (var i = 0; i < all.length; i++) all[i].classList.remove('selected');
      div.classList.add('selected');
      loadTextureFromURL(item.url, item.name);
    };
    results.appendChild(div);
  });
}

function loadTextureFromURL(url, name) {
  showStatus('load', 'در حال دانلود...');
  var img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function() {
    processLoadedImage(img, name);
  };
  img.onerror = function() {
    showStatus('err', 'خطا در دانلود تکسچر');
  };
  img.src = url;
}

// ===== شروع =====
loadTextures();
document.getElementById('searchBtn').onclick = doSearch;
document.getElementById('searchInput').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') doSearch();
});
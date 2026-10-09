// ===== جستجوی تکسچر =====
var ZIP_URL = 'https://github.com/NovaGr4phic/Nova-rigging/releases/download/v1.0/textures.zip';
var TEXTURE_DATABASE = [];
var ZIP_LOADED = false;
var LOADING = false;

function loadFromZip() {
  if (LOADING) return;
  LOADING = true;

  var results = document.getElementById('results');
  results.innerHTML = '<div class="no-result">در حال دانلود پکیج تکسچرها...<br><small>اولین بار ممکنه چند ثانیه طول بکشه</small></div>';

  fetch(ZIP_URL)
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
      var count = 0;

      zip.forEach(function(path, file) {
        if (!path.toLowerCase().endsWith('.png')) return;
        if (path.indexOf('textures/items/') === -1 &&
            path.indexOf('textures/blocks/') === -1 &&
            path.indexOf('textures/entity/') === -1) return;
        if (count >= 2000) return;
        count++;

        var p = file.async('base64').then(function(base64) {
          var name = path.split('/').pop().replace('.png', '');
          var category = 'تکسچر';
          if (path.indexOf('items/') !== -1) category = 'آیتم';
          else if (path.indexOf('blocks/') !== -1) category = 'بلاک';
          else if (path.indexOf('entity/') !== -1) category = 'موجود';

          TEXTURE_DATABASE.push({
            name: name,
            category: category,
            dataUrl: 'data:image/png;base64,' + base64
          });
        });

        promises.push(p);
      });

      return Promise.all(promises);
    })
    .then(function() {
      ZIP_LOADED = true;
      LOADING = false;
      console.log(TEXTURE_DATABASE.length + ' textures loaded');

      document.getElementById('results').innerHTML =
        '<div class="no-result">' + TEXTURE_DATABASE.length + ' تکسچر آماده جستجوئه!<br>یه کلمه تایپ کن</div>';

      document.getElementById('searchBtn').disabled = false;
    })
    .catch(function(err) {
      LOADING = false;
      console.error(err);
      document.getElementById('results').innerHTML =
        '<div class="no-result">خطا در لود تکسچرها<br><small>' + err.message + '</small></div>';
    });
}

function doSearch() {
  var q = document.getElementById('searchInput').value.trim().toLowerCase();
  var results = document.getElementById('results');

  if (!q) {
    results.innerHTML = '<div class="no-result"><svg><use href="#i-search"/></svg> کلمه‌ای برای جستجو وارد کن</div>';
    return;
  }

  if (!ZIP_LOADED) {
    results.innerHTML = '<div class="no-result">تکسچرها هنوز لود نشدن. چند ثانیه صبر کن...</div>';
    return;
  }

  var found = TEXTURE_DATABASE.filter(function(item) {
    return item.name.toLowerCase().indexOf(q) !== -1 ||
           item.category.indexOf(q) !== -1;
  });

  if (found.length === 0) {
    results.innerHTML = '<div class="no-result">تکسچری با "' + q + '" پیدا نشد</div>';
    return;
  }

  results.innerHTML = '';
  found.slice(0, 60).forEach(function(item) {
    var div = document.createElement('div');
    div.className = 'result-item';

    var img = document.createElement('img');
    img.src = item.dataUrl;
    img.loading = 'lazy';

    var name = document.createElement('div');
    name.className = 'name';
    name.textContent = item.name;

    div.appendChild(img);
    div.appendChild(name);

    div.onclick = function() {
      var all = results.querySelectorAll('.result-item');
      for (var i = 0; i < all.length; i++) all[i].classList.remove('selected');
      div.classList.add('selected');
      loadTextureFromDataURL(item.dataUrl, item.name);
    };

    results.appendChild(div);
  });
}

function loadTextureFromDataURL(dataUrl, name) {
  showStatus('load', 'در حال پردازش...');
  var img = new Image();
  img.onload = function() {
    processLoadedImage(img, name);
  };
  img.onerror = function() {
    showStatus('err', 'خطا در بارگذاری تکسچر');
  };
  img.src = dataUrl;
}

// ===== شروع =====
loadFromZip();
document.getElementById('searchBtn').onclick = doSearch;
document.getElementById('searchInput').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') doSearch();
});
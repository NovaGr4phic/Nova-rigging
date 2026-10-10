// ===== جستجوی تکسچر آیتم =====
var ZIP_URL = 'https://novagr4phic.github.io/Nova-rigging/items.zip';
var TEXTURE_DATABASE = [];
var ZIP_LOADED = false;
var LOADING = false;

function loadFromZip() {
  if (LOADING) return;
  LOADING = true;

  var results = document.getElementById('results');
  results.innerHTML = '<div class="no-result">در حال دانلود پکیج تکسچرها...<br><small>اولین بار چند ثانیه طول می‌کشه</small></div>';

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
        if (count >= 2000) return;
        count++;

        var p = file.async('blob').then(function(blob) {
          var name = path.split('/').pop().replace('.png', '');
          TEXTURE_DATABASE.push({
            name: name,
            url: URL.createObjectURL(blob)
          });
        });

        promises.push(p);
      });

      return Promise.all(promises);
    })
    .then(function() {
      ZIP_LOADED = true;
      LOADING = false;

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
    return item.name.toLowerCase().indexOf(q) !== -1;
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
    img.src = item.url;
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

      var newImg = new Image();
      newImg.onload = function() {
        processLoadedImage(newImg, item.name);
      };
      newImg.onerror = function() {
        showStatus('err', 'خطا در بارگذاری تکسچر');
      };
      newImg.src = item.url;
    };

    results.appendChild(div);
  });
}

// ===== شروع =====
loadFromZip();
document.getElementById('searchBtn').onclick = doSearch;
document.getElementById('searchInput').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') doSearch();
});
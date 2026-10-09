// ===== مدیریت تب‌ها =====
(function() {
  var tabs = document.querySelectorAll('.tab');
  var contents = document.querySelectorAll('.tab-content');

  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      var target = tab.getAttribute('data-tab');

      // حذف active از همه
      tabs.forEach(function(t) { t.classList.remove('active'); });
      contents.forEach(function(c) { c.classList.remove('active'); });

      // اضافه کردن active به تب و محتوای انتخابی
      tab.classList.add('active');
      var targetContent = document.getElementById('tab-' + target);
      if (targetContent) targetContent.classList.add('active');

      // resize کردن viewer اگه تب آیتم باز شد
      if (target === 'item' && typeof window.onResizeViewer === 'function') {
        setTimeout(window.onResizeViewer, 100);
      }
    });
  });
})();
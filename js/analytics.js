// Vercel Web Analytics (@vercel/analytics — inject côté navigateur)
(function () {
  if (typeof window === 'undefined' || window.va) return;
  window.va = function () { (window.vaq = window.vaq || []).push(arguments); };
  if (document.querySelector('script[src*="/_vercel/insights/script.js"]')) return;
  var s = document.createElement('script');
  s.defer = true;
  s.src = '/_vercel/insights/script.js';
  s.dataset.sdkn = '@vercel/analytics';
  s.dataset.sdkv = '2.0.1';
  document.head.appendChild(s);
})();

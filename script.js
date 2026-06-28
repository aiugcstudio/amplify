/* =========================================================
   AMPLIFY — interactions (warm editorial luxury)
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var STORAGE_KEY = 'amplify-theme';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme: light is the default; honor a saved choice only ---------- */
  var themeColors = { light: '#FBFAF8', dark: '#161512' };

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', themeColors[theme] || themeColors.dark);
    var toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(theme === 'light'));
      toggle.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    }
  }

  var saved;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { saved = null; }
  applyTheme(saved === 'dark' ? 'dark' : 'light');

  var themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(next);
      try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
    });
  }

  /* ---------- Nav elevate on scroll ---------- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 12) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Hero reveal (editorial fade-up) ---------- */
  (function heroReveal() {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add('ready'); }); });
    // failsafe: never leave the hero hidden
    window.setTimeout(function () { hero.classList.add('ready'); }, 1200);
  })();

  /* ---------- Reveal on scroll + hairline draw ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
    // failsafe: if the observer never fires (odd viewport / headless), reveal all
    window.setTimeout(function () {
      if (document.querySelectorAll('.reveal.in').length === 0) {
        reveals.forEach(function (el) { el.classList.add('in'); });
      }
    }, 2600);
  }

  /* ---------- Stat count-up ---------- */
  var stats = Array.prototype.slice.call(document.querySelectorAll('.stat-n[data-target]'));
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-target')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var duration = 1100, startTime = null;
    function frame(now) {
      if (startTime === null) startTime = now;
      var p = Math.min((now - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(frame);
  }
  if (stats.length) {
    if (!('IntersectionObserver' in window)) {
      stats.forEach(countUp);
    } else {
      var statObs = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { countUp(entry.target); obs.unobserve(entry.target); }
        });
      }, { threshold: 0.6 });
      stats.forEach(function (el) { statObs.observe(el); });
    }
  }

  /* ---------- FAQ single-open accordion ---------- */
  var faqItems = Array.prototype.slice.call(document.querySelectorAll('.faq-item'));
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (item.open) faqItems.forEach(function (o) { if (o !== item) o.open = false; });
    });
  });

  /* ---------- Calendly inline embed (lazy + theme-aware) ---------- */
  (function () {
    var host = document.getElementById('calendly-embed');
    if (!host) return;
    var baseUrl = host.getAttribute('data-url') || 'https://calendly.com/amplifyaiwork/revenue-audit?back=1';
    var initialized = false, loadingScript = false;

    function colors() {
      var light = root.getAttribute('data-theme') === 'light';
      return light ? { bg: 'ffffff', text: '211c17', primary: 'cb5a3c' }
                   : { bg: '1d1b17', text: 'f3f0e9', primary: 'e5805f' };
    }
    function buildUrl() {
      var c = colors();
      var sep = baseUrl.indexOf('?') > -1 ? '&' : '?';
      return baseUrl + sep + 'hide_gdpr_banner=1&background_color=' + c.bg + '&text_color=' + c.text + '&primary_color=' + c.primary;
    }
    function render() {
      if (!window.Calendly || !window.Calendly.initInlineWidget) return;
      host.innerHTML = '';
      window.Calendly.initInlineWidget({ url: buildUrl(), parentElement: host });
      initialized = true;
    }
    function ensureScript(cb) {
      if (window.Calendly) { cb(); return; }
      if (loadingScript) return;
      loadingScript = true;
      if (!document.querySelector('link[href*="assets.calendly.com/assets/external/widget.css"]')) {
        var l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = 'https://assets.calendly.com/assets/external/widget.css';
        document.head.appendChild(l);
      }
      var s = document.createElement('script');
      s.src = 'https://assets.calendly.com/assets/external/widget.js';
      s.async = true;
      s.onload = cb;
      document.head.appendChild(s);
    }
    function activate() { ensureScript(render); }

    if ('IntersectionObserver' in window) {
      var io2 = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (e) { if (e.isIntersecting) { activate(); obs.disconnect(); } });
      }, { rootMargin: '320px' });
      io2.observe(host);
    } else {
      activate();
    }

    // also load on scroll proximity, in case the observer never fires
    function scrollFallback() {
      if (initialized || loadingScript) return;
      var r = host.getBoundingClientRect();
      if (r.top < (window.innerHeight || 800) * 1.6) {
        activate();
        window.removeEventListener('scroll', scrollFallback);
      }
    }
    window.addEventListener('scroll', scrollFallback, { passive: true });

    // re-render with matching colors when the theme flips (only if already loaded)
    if (themeToggle) {
      themeToggle.addEventListener('click', function () {
        if (initialized) setTimeout(render, 20);
      });
    }
  })();

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) {
    var y = new Date().getFullYear();
    if (y && !isNaN(y)) yearEl.textContent = String(y);
  }
})();

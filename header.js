(() => {
  const mount = document.getElementById('siteHeaderMount');
  if (!mount) return;

  function isHomePage() {
    var p = location.pathname;
    if (p === '/' || p === '' || /\/index\.html$/i.test(p)) return true;
    /* Project root without explicit index, e.g. https://user.github.io/DealOn/ */
    if (/^\/[^/.]+(\/)?$/.test(p)) return true;
    return false;
  }

  function sectionHref(hash) {
    return isHomePage() ? hash : 'index.html' + hash;
  }

  function sellerContactHref() {
    /* Hash is handled only on homepage (seller-contact-modal.js); elsewhere navigate to index. */
    return isHomePage() ? '#seller-contact' : 'index.html#seller-contact';
  }

  var logoHref = isHomePage() ? '#' : 'index.html';

  mount.innerHTML = `
<nav class="nav">
  <div class="nav-inner">
    <a href="${logoHref}" class="nav-logo">
      <picture>
        <source media="(prefers-color-scheme: dark)" srcset="DealOn%20logo-dark.svg">
        <img src="DealOn%20logo.svg" alt="DealOn" class="nav-logo-img">
      </picture>
    </a>
    <ul class="nav-links">
      <li><a href="${sectionHref('#about')}">Why DealOn</a></li>
      <li><a href="${sectionHref('#services')}">Services</a></li>
      <li><a href="${sectionHref('#ai')}">AI Engine</a></li>
      <li><a href="${sectionHref('#fees')}">Fee Model</a></li>
      <li><a href="${sectionHref('#faq')}">FAQs</a></li>
      <li><a href="${sectionHref('#how-it-works')}">How It Works</a></li>
      <li><a href="${sellerContactHref()}" class="nav-cta seller-contact-open" data-contact-intent="talk">Talk to Us</a></li>
    </ul>
    <button class="nav-mobile-toggle" id="siteNavToggle" type="button" aria-label="Toggle navigation" aria-expanded="false">
      <span class="nav-mobile-toggle-icon" aria-hidden="true">
        <span></span><span></span><span></span>
      </span>
    </button>
  </div>
</nav>
`;

  const nav = mount.querySelector('.nav');
  const navLinks = mount.querySelector('.nav-links');
  const navToggle = mount.querySelector('#siteNavToggle');
  const mq = window.matchMedia('(max-width: 940px)');
  let closeTimer = null;
  const closeAnimMs = 220;
  let scrollLockY = 0;

  function syncNavBar() {
    if (!nav) return;
    var solid = window.scrollY > 80 || nav.classList.contains('menu-open');
    nav.style.setProperty(
      '--nav-tint',
      solid ? 'var(--nav-bg-scrolled)' : 'transparent'
    );
    nav.style.borderBottomColor = solid ? 'var(--nav-border-scrolled)' : 'transparent';
  }

  function lockBodyScroll() {
    if (document.body.classList.contains('nav-scroll-lock')) return;
    scrollLockY = window.scrollY || window.pageYOffset || 0;
    document.body.style.top = '-' + scrollLockY + 'px';
    document.body.classList.add('nav-scroll-lock');
  }

  function unlockBodyScroll() {
    if (!document.body.classList.contains('nav-scroll-lock')) return;
    document.body.classList.remove('nav-scroll-lock');
    document.body.style.top = '';
    /* Match seller-contact-modal: html { scroll-behavior: smooth } would animate this restore. */
    var root = document.documentElement;
    var prevSb = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, scrollLockY);
    root.style.scrollBehavior = prevSb;
  }

  function setMenuOpen(open) {
    if (!navLinks) return;
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    if (open) {
      navLinks.classList.remove('closing');
      navLinks.classList.add('show');
      if (nav) nav.classList.add('menu-open');
      if (mq.matches) lockBodyScroll();
    } else if (navLinks.classList.contains('show')) {
      navLinks.classList.add('closing');
      if (nav) nav.classList.remove('menu-open');
      closeTimer = setTimeout(function () {
        navLinks.classList.remove('show', 'closing');
        unlockBodyScroll();
        syncNavBar();
        closeTimer = null;
      }, closeAnimMs);
    } else {
      if (nav) nav.classList.remove('menu-open');
      unlockBodyScroll();
      syncNavBar();
    }
    syncNavBar();
    if (navToggle) navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  if (navToggle) {
    navToggle.addEventListener('click', function () {
      setMenuOpen(!navLinks.classList.contains('show'));
    });
  }
  navLinks.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      setMenuOpen(false);
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenuOpen(false);
  });
  window.addEventListener('resize', function () {
    if (!mq.matches) setMenuOpen(false);
  });
  window.addEventListener('scroll', syncNavBar, { passive: true });
  syncNavBar();
})();

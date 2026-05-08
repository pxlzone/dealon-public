(() => {
  var modal = document.getElementById('sellerContactModal');
  var dialog = document.getElementById('sellerContactDialog');
  var form = document.getElementById('contact-form');
  var topicField = document.getElementById('contact-topic');
  var intentInput = document.getElementById('contactCtaIntent');
  var messageEl = document.getElementById('contact-message');
  var websiteEl = document.getElementById('contact-website');
  var titleEl = document.getElementById('sellerContactTitle');
  var descEl = document.getElementById('sellerContactDesc');
  var lastFocus = null;
  var scrollY = 0;

  if (!modal || !dialog || !form) return;

  var PH_WEB_DEFAULT = 'https://company.com';
  var PH_WEB_BUYER = 'Fund / portfolio site or LinkedIn';

  var DEFAULT_MODAL_TITLE = 'Get in touch';
  var DEFAULT_MODAL_LEDE =
    'Brief details below — we usually reply within one business day.';

  function headlineForIntent(intent) {
    var lede = DEFAULT_MODAL_LEDE;
    switch (intent) {
      case 'consultation':
        return { title: 'Book Free Consultation', lede: lede };
      case 'start-deal':
        return { title: 'Start Your Deal', lede: lede };
      case 'buyer-register':
        return { title: 'Register as Buyer', lede: lede };
      case 'valuation':
        return { title: 'Get Your Free Valuation', lede: lede };
      case 'advisor':
        return { title: 'Talk to an Advisor', lede: lede };
      case 'talk':
        return { title: 'Talk to Us', lede: lede };
      case 'footer':
        return { title: 'Contact form', lede: lede };
      case 'hash':
      case 'direct-link':
      case 'general':
      default:
        return { title: DEFAULT_MODAL_TITLE, lede: lede };
    }
  }

  function topicForIntent(intent) {
    switch (intent) {
      case 'start-deal':
        return 'Selling a business';
      case 'valuation':
        return 'Valuation';
      case 'buyer-register':
        return 'Buying a business';
      case 'consultation':
        return 'Consultation';
      case 'advisor':
        return 'Selling a business';
      case 'talk':
      case 'footer':
      case 'hash':
      case 'direct-link':
      case 'general':
      default:
        return 'General';
    }
  }

  function placeholdersForIntent(intent) {
    switch (intent) {
      case 'buyer-register':
        return {
          message:
            'Mandate, geographies & sectors of interest, cheque size, timeline…',
          website: PH_WEB_BUYER,
        };
      case 'consultation':
        return {
          message: 'What you’d like to cover on the call.',
        };
      case 'start-deal':
        return {
          message:
            'Sector, geography, rough revenue band, and when you aim to complete…',
        };
      case 'valuation':
        return {
          message:
            'Business model, indicative size & geography — what you need valued…',
        };
      case 'advisor':
        return {
          message: 'Questions or context for your advisor conversation.',
        };
      default:
        return {
          message:
            'Anything that helps us route your enquiry.',
        };
    }
  }

  function isHomepage() {
    var p = location.pathname;
    if (p === '/' || p === '' || /\/index\.html$/i.test(p)) return true;
    if (/^\/[^/.]+(\/?)$/.test(p)) return true;
    return false;
  }

  function lockScroll() {
    if (document.body.classList.contains('seller-contact-scroll-lock')) return;
    scrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.top = '-' + scrollY + 'px';
    document.body.classList.add('seller-contact-scroll-lock');
  }

  function unlockScroll() {
    if (!document.body.classList.contains('seller-contact-scroll-lock')) return;
    document.body.classList.remove('seller-contact-scroll-lock');
    document.body.style.top = '';
    window.scrollTo(0, scrollY);
  }

  function setIntent(intent) {
    var v = intent && typeof intent === 'string' ? intent.trim() : '';
    if (!v) v = 'general';

    if (intentInput) intentInput.value = v;

    if (topicField) topicField.value = topicForIntent(v);

    var headline = headlineForIntent(v);
    if (titleEl) titleEl.textContent = headline.title;
    if (descEl) descEl.textContent = headline.lede;

    var ph = placeholdersForIntent(v);
    if (messageEl) messageEl.placeholder = ph.message;
    if (websiteEl)
      websiteEl.placeholder = ph.website != null ? ph.website : PH_WEB_DEFAULT;
  }

  function openModal(opts) {
    opts = opts || {};
    lastFocus = document.activeElement;
    lockScroll();
    modal.hidden = false;
    modal.classList.add('seller-contact-modal--open');
    modal.setAttribute('aria-hidden', 'false');

    var intentAttr = '';
    var triggerEl = opts.trigger;
    if (triggerEl && triggerEl.dataset) intentAttr = triggerEl.dataset.contactIntent || '';
    setIntent(intentAttr || opts.intent || 'general');

    var focusEl =
      document.getElementById('contact-name') || dialog.querySelector('input, textarea');
    if (focusEl) {
      window.requestAnimationFrame(function () {
        try {
          focusEl.focus();
        } catch (_e) {}
      });
    }
  }

  function closeModal() {
    modal.classList.remove('seller-contact-modal--open');
    modal.setAttribute('aria-hidden', 'true');
    modal.hidden = true;
    unlockScroll();
    try {
      if (history.replaceState && location.hash === '#seller-contact') {
        history.replaceState(null, '', location.pathname + location.search);
      }
    } catch (_e) {}
    if (lastFocus && typeof lastFocus.focus === 'function') {
      try {
        lastFocus.focus();
      } catch (_e2) {}
    }
    lastFocus = null;
  }

  modal.querySelectorAll('[data-seller-contact-dismiss]').forEach(function (el) {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('seller-contact-modal--open')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
    }
  });

  document.addEventListener('click', function (e) {
    var opener = e.target.closest('a.seller-contact-open');
    if (!opener) return;
    /* From other hosted pages (`index.html#seller-contact`) the browser navigates normally; bootstrap opens the modal after load. */
    if (!isHomepage()) return;

    var href = opener.getAttribute('href') || '';
    if (href !== '#seller-contact') return;

    e.preventDefault();
    openModal({ trigger: opener });
  });

  window.addEventListener('hashchange', function () {
    if (location.hash !== '#seller-contact') return;
    requestAnimationFrame(function () {
      if (!modal.hidden && modal.classList.contains('seller-contact-modal--open')) return;
      openModal({ intent: 'hash', updateHash: false });
    });
  });

  function bootstrapFromHash() {
    if (location.hash !== '#seller-contact') return;
    requestAnimationFrame(function () {
      openModal({ intent: 'direct-link', updateHash: false });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapFromHash, { once: true });
  } else {
    bootstrapFromHash();
  }
})();

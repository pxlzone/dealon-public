(() => {
  var modal = document.getElementById('sellerContactModal');
  var dialog = document.getElementById('sellerContactDialog');
  var form = document.getElementById('contact-form');
  var formFlow = document.getElementById('sellerContactFormFlow');
  var successFlow = document.getElementById('sellerContactSuccessFlow');
  var formError = document.getElementById('sellerContactFormError');
  var subjectField = document.getElementById('contactFormSubject');
  var topicField = document.getElementById('contact-topic');
  var messageEl = document.getElementById('contact-message');
  var websiteEl = document.getElementById('contact-website');
  var nameInput = document.getElementById('contact-name');
  var emailInput = document.getElementById('contact-email');
  var titleEl = document.getElementById('sellerContactTitle');
  var descEl = document.getElementById('sellerContactDesc');
  var submitBtn = form ? form.querySelector('.contact-submit') : null;
  var lastFocus = null;
  var scrollY = 0;

  if (!modal || !dialog || !form) return;

  var PH_WEB_DEFAULT = 'https://company.com';
  var PH_WEB_BUYER = 'Fund / portfolio site or LinkedIn';

  var DEFAULT_MODAL_TITLE = 'Get in touch';
  var DEFAULT_MODAL_LEDE =
    'Brief details below — we usually reply within one business day.';

  /* Checkbox v2. Google’s documented test site key passes locally; production: window.DEALON_RECAPTCHA_SITE_KEY = '…'; in <head> before scripts. */
  var GOOGLE_RECAPTCHA_TEST_SITEKEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
  var recaptchaSellerWidgetId = null;
  var RECAPTCHA_SITE_KEY = '';
  var rawRecaptchaCfg =
    typeof window.DEALON_RECAPTCHA_SITE_KEY === 'string'
      ? window.DEALON_RECAPTCHA_SITE_KEY.trim()
      : '';
  RECAPTCHA_SITE_KEY = rawRecaptchaCfg || GOOGLE_RECAPTCHA_TEST_SITEKEY;

  function onRecaptchaStateChange() {
    syncSubmitEnabled();
  }

  function tryRenderSellerRecaptcha() {
    if (!RECAPTCHA_SITE_KEY) return;
    var mount = document.getElementById('sellerContactRecaptcha');
    if (!mount || recaptchaSellerWidgetId !== null) return;
    if (typeof grecaptcha === 'undefined' || typeof grecaptcha.render !== 'function') return;
    try {
      var light =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-color-scheme: light)').matches;
      recaptchaSellerWidgetId = grecaptcha.render(mount, {
        sitekey: RECAPTCHA_SITE_KEY,
        theme: light ? 'light' : 'dark',
        callback: onRecaptchaStateChange,
        'expired-callback': onRecaptchaStateChange,
        'error-callback': onRecaptchaStateChange,
      });
      syncSubmitEnabled();
    } catch (_err) {
      recaptchaSellerWidgetId = null;
    }
  }

  function syncRecaptchaOnModalOpen() {
    if (!RECAPTCHA_SITE_KEY) return;
    if (typeof grecaptcha === 'undefined') return;
    if (recaptchaSellerWidgetId !== null) {
      try {
        grecaptcha.reset(recaptchaSellerWidgetId);
      } catch (_e) {}
      syncSubmitEnabled();
      return;
    }
    tryRenderSellerRecaptcha();
  }

  function getFormSubmitAjaxUrl() {
    var a = (form.getAttribute('action') || '').trim();
    if (!a) return '';
    if (/formsubmit\.co\/ajax\//i.test(a)) return a;
    return a.replace(/formsubmit\.co\//i, 'formsubmit.co/ajax/');
  }

  function isMandatoryComplete() {
    var nameOk = nameInput && nameInput.value.trim() !== '';
    var emailOk =
      emailInput &&
      emailInput.value.trim() !== '' &&
      typeof emailInput.checkValidity === 'function' &&
      emailInput.checkValidity();
    var webOk = websiteEl && websiteEl.value.trim() !== '';
    return !!(nameOk && emailOk && webOk);
  }

  function isRecaptchaComplete() {
    if (!RECAPTCHA_SITE_KEY) return true;
    if (recaptchaSellerWidgetId === null || typeof grecaptcha === 'undefined')
      return false;
    var token = '';
    try {
      token = grecaptcha.getResponse(recaptchaSellerWidgetId);
    } catch (_e) {
      return false;
    }
    return !!(token && String(token).trim() !== '');
  }

  function syncSubmitEnabled() {
    if (!submitBtn) return;
    if (!modal.classList.contains('seller-contact-modal--open')) return;
    if (successFlow && !successFlow.hidden) return;
    if (submitBtn.getAttribute('aria-busy') === 'true') {
      submitBtn.disabled = true;
      return;
    }
    submitBtn.disabled = !(isMandatoryComplete() && isRecaptchaComplete());
  }

  function hideFormError() {
    if (!formError) return;
    formError.hidden = true;
    formError.textContent = '';
  }

  function showFormError(msg) {
    if (!formError) return;
    formError.textContent = msg;
    formError.hidden = false;
  }

  function resetModalView() {
    hideFormError();
    var succIcon = document.getElementById('sellerContactSuccessIcon');
    if (succIcon) succIcon.classList.remove('seller-contact-modal__success-icon--animating');
    if (formFlow) formFlow.hidden = false;
    if (successFlow) successFlow.hidden = true;
    if (submitBtn) {
      submitBtn.removeAttribute('aria-busy');
    }
    syncSubmitEnabled();
  }

  function showSuccessInModal() {
    if (formFlow) formFlow.hidden = true;
    if (successFlow) successFlow.hidden = false;
    var icon = document.getElementById('sellerContactSuccessIcon');
    if (icon) {
      icon.classList.remove('seller-contact-modal__success-icon--animating');
      void icon.getBoundingClientRect();
      window.requestAnimationFrame(function () {
        icon.classList.add('seller-contact-modal__success-icon--animating');
      });
    }
    var doneBtn = successFlow
      ? successFlow.querySelector('.seller-contact-modal__done-btn')
      : null;
    if (doneBtn) {
      window.requestAnimationFrame(function () {
        try {
          doneBtn.focus();
        } catch (_e) {}
      });
    }
    if (submitBtn) submitBtn.removeAttribute('aria-busy');
  }

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

  function subjectForIntent(intent) {
    switch (intent) {
      case 'consultation':
        return 'DealOn — Book free consultation';
      case 'start-deal':
        return 'DealOn — Start your deal';
      case 'buyer-register':
        return 'DealOn — Register as buyer';
      case 'valuation':
        return 'DealOn — Free valuation';
      case 'advisor':
        return 'DealOn — Talk to an advisor';
      case 'talk':
        return 'DealOn — Talk to us';
      case 'footer':
        return 'DealOn — Contact form';
      case 'hash':
      case 'direct-link':
      case 'general':
      default:
        return 'DealOn — Website enquiry';
    }
  }

  /* Human-readable enquiry goal in FormSubmit tables / CRM (synced from CTA). */
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
          message: 'Anything that helps us route your enquiry.',
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
    /* Mobile nav uses the same fixed-body pattern (nav-scroll-lock). window.scrollY is then ~0; recover Y from body.top. */
    if (document.body.classList.contains('nav-scroll-lock')) {
      var t = (document.body.style.top || '').trim();
      var m = /^-(\d+(?:\.\d+)?)px$/.exec(t);
      scrollY = m
        ? Math.round(parseFloat(m[1]))
        : window.scrollY || window.pageYOffset || 0;
      document.body.classList.remove('nav-scroll-lock');
    } else {
      scrollY = window.scrollY || window.pageYOffset || 0;
    }
    document.body.style.top = '-' + scrollY + 'px';
    document.body.classList.add('seller-contact-scroll-lock');
  }

  function unlockScroll() {
    if (!document.body.classList.contains('seller-contact-scroll-lock')) return;
    document.body.classList.remove('seller-contact-scroll-lock');
    document.body.style.top = '';
    /* html { scroll-behavior: smooth } would animate this restore; force instant jump. */
    var root = document.documentElement;
    var prevSb = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, scrollY);
    root.style.scrollBehavior = prevSb;
  }

  function setIntent(intent) {
    var v = intent && typeof intent === 'string' ? intent.trim() : '';
    if (!v) v = 'general';

    if (subjectField) subjectField.value = subjectForIntent(v);
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
    resetModalView();
    form.reset();

    lockScroll();
    modal.hidden = false;
    modal.classList.add('seller-contact-modal--open');
    modal.setAttribute('aria-hidden', 'false');

    var intentAttr = '';
    var triggerEl = opts.trigger;
    if (triggerEl && triggerEl.dataset)
      intentAttr = triggerEl.dataset.contactIntent || '';
    setIntent(intentAttr || opts.intent || 'general');
    syncSubmitEnabled();

    window.requestAnimationFrame(function () {
      syncRecaptchaOnModalOpen();
      syncSubmitEnabled();
      var focusEl = document.getElementById('contact-name');
      if (focusEl) {
        try {
          focusEl.focus();
        } catch (_e) {}
      }
    });
  }

  function closeModal() {
    modal.classList.remove('seller-contact-modal--open');
    modal.setAttribute('aria-hidden', 'true');
    modal.hidden = true;
    unlockScroll();
    resetModalView();
    form.reset();
    syncSubmitEnabled();
    try {
      if (history.replaceState && location.hash === '#seller-contact') {
        history.replaceState(null, '', location.pathname + location.search);
      }
    } catch (_e) {}
    if (lastFocus && typeof lastFocus.focus === 'function') {
      try {
        lastFocus.focus({ preventScroll: true });
      } catch (_e2) {
        try {
          lastFocus.focus();
        } catch (_e3) {}
      }
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

  form.addEventListener('input', syncSubmitEnabled);
  form.addEventListener('change', syncSubmitEnabled);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (submitBtn && submitBtn.disabled) return;
    hideFormError();

    var ajaxUrl = getFormSubmitAjaxUrl();
    if (!ajaxUrl) {
      showFormError('Configuration error — please refresh and try again.');
      return;
    }

    if (RECAPTCHA_SITE_KEY) {
      if (recaptchaSellerWidgetId === null || typeof grecaptcha === 'undefined') {
        showFormError(
          'Verification is still loading — wait a moment and try again.'
        );
        return;
      }
      if (!grecaptcha.getResponse(recaptchaSellerWidgetId)) {
        showFormError('Please complete the verification below.');
        return;
      }
    }

    if (!submitBtn) return;
    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-busy', 'true');

    var fd = new FormData(form);
    fetch(ajaxUrl, {
      method: 'POST',
      body: fd,
      headers: { Accept: 'application/json' },
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Request failed');
        return res.text();
      })
      .then(function () {
        showSuccessInModal();
      })
      .catch(function () {
        showFormError(
          'Something went wrong. Try again shortly, or reach us via the links below.'
        );
        submitBtn.removeAttribute('aria-busy');
        syncSubmitEnabled();
      });
  });

  window.addEventListener('hashchange', function () {
    if (location.hash !== '#seller-contact') return;
    window.requestAnimationFrame(function () {
      if (!modal.hidden && modal.classList.contains('seller-contact-modal--open')) return;
      openModal({ intent: 'hash', updateHash: false });
    });
  });

  function bootstrapFromHash() {
    if (location.hash !== '#seller-contact') return;
    window.requestAnimationFrame(function () {
      openModal({ intent: 'direct-link', updateHash: false });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapFromHash, { once: true });
  } else {
    bootstrapFromHash();
  }

  window.dealonSellerContactRecaptchaLoaded = function () {
    tryRenderSellerRecaptcha();
    syncSubmitEnabled();
  };
})();

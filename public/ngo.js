document.addEventListener('DOMContentLoaded', function(){
  const btn = document.querySelector('.hamburger-btn');
  const collapse = document.getElementById('mainNav');

  if(btn){
    btn.addEventListener('click', function(){
      btn.classList.toggle('open');
      setTimeout(() => {
        if(collapse && collapse.classList.contains('show')){
          collapse.classList.remove('show');
        } else if(collapse){
          collapse.classList.add('show');
        }
      }, 20);
    });
  }

  const partnerMenus = document.querySelectorAll('.nav-item.dropdown-holder');
  partnerMenus.forEach((menu) => {
    const trigger = menu.querySelector('.partners-toggle');
    if(!trigger) return;

    const setOpen = (isOpen) => {
      menu.classList.toggle('open', isOpen);
      trigger.setAttribute('aria-expanded', String(isOpen));
    };

    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    if(isDesktop){
      menu.addEventListener('mouseenter', () => setOpen(true));
      menu.addEventListener('mouseleave', () => setOpen(false));
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        const willOpen = !menu.classList.contains('open');
        setOpen(willOpen);
      });
    } else {
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        const willOpen = !menu.classList.contains('open');
        setOpen(willOpen);
      });
    }

    document.addEventListener('click', (event) => {
      if(!menu.contains(event.target)) setOpen(false);
    });
  });
});

document.addEventListener('DOMContentLoaded', function(){
  const counters = document.querySelectorAll('.stat-number[data-count]');
  if(!counters.length) return;

  const animateCounter = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1500;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const value = Math.round(target * progress);
      el.textContent = value + suffix;
      if(progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if(entry.isIntersecting){
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  counters.forEach((counter) => observer.observe(counter));
});

document.addEventListener('DOMContentLoaded', function(){
  const holder = document.querySelector('.holder');
  const topBar = document.querySelector('.top');
  const spacer = document.querySelector('.holder-spacer');
  if(!holder || !topBar || !spacer) return;

  const onScroll = () => {
    const scrolledPast = window.scrollY > topBar.offsetHeight;
    if(scrolledPast){
      if(!holder.classList.contains('is-pinned')){
        spacer.style.height = holder.offsetHeight + 'px';
        holder.classList.add('is-pinned');
      }
    } else {
      holder.classList.remove('is-pinned');
      spacer.style.height = '0px';
    }
  };

  // track scroll direction for shrink behavior
  let lastY = window.scrollY;
  const onScrollDirection = () => {
    const currentY = window.scrollY;
    if(currentY > lastY && currentY > 60){
      // scrolling down -> shrink header
      holder.classList.add('shrink');
    } else {
      // scrolling up -> restore header
      holder.classList.remove('shrink');
    }
    lastY = currentY;
  };

  window.addEventListener('scroll', function(){ onScroll(); onScrollDirection(); }, { passive: true });
  onScroll();
});

document.addEventListener('DOMContentLoaded', function(){
  const popup = document.getElementById('mailingPopup');
  const form = document.getElementById('mailingForm');
  const aboutSection = document.querySelector('.about-section');
  if(!popup || !form || !aboutSection) return;

  const closeBtn = popup.querySelector('.mailing-popup-close');
  const SUBSCRIBED_KEY = 'lagosSistemaSubscribed';
  const RESHOW_DELAY = 15000;
  let reshowTimer = null;

  const isSubscribed = () => localStorage.getItem(SUBSCRIBED_KEY) === 'true';

  const openPopup = () => {
    if(isSubscribed()) return;
    popup.hidden = false;
  };

  const closePopup = () => {
    popup.hidden = true;
    if(!isSubscribed()){
      clearTimeout(reshowTimer);
      reshowTimer = setTimeout(openPopup, RESHOW_DELAY);
    }
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if(entry.isIntersecting) openPopup();
    });
  }, { threshold: 0.3 });
  observer.observe(aboutSection);

  closeBtn.addEventListener('click', closePopup);
  popup.addEventListener('click', (event) => {
    if(event.target === popup) closePopup();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    localStorage.setItem(SUBSCRIBED_KEY, 'true');
    clearTimeout(reshowTimer);
    popup.hidden = true;
    observer.disconnect();
  });
});

document.addEventListener('DOMContentLoaded', function(){
  const toggle = document.getElementById('a11yToggle');
  const panel = document.getElementById('a11yPanel');
  const closeBtn = document.getElementById('a11yPanelClose');
  if(!toggle || !panel) return;

  const openPanel = () => {
    panel.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
  };
  const closePanel = () => {
    panel.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', function(){
    if(panel.classList.contains('open')) closePanel();
    else openPanel();
  });
  closeBtn && closeBtn.addEventListener('click', closePanel);
  document.addEventListener('click', function(event){
    if(panel.classList.contains('open') && !panel.contains(event.target) && event.target !== toggle && !toggle.contains(event.target)){
      closePanel();
    }
  });
  document.addEventListener('keydown', function(event){
    if(event.key === 'Escape') closePanel();
  });

  const body = document.body;
  const TEXT_LEVEL_CLASSES = ['', 'a11y-text-lg', 'a11y-text-xl'];
  const TOGGLE_KEYS = ['contrast', 'grayscale', 'underline', 'spacing', 'motion'];
  const TOGGLE_CLASSES = {
    contrast: 'a11y-contrast',
    grayscale: 'a11y-grayscale',
    underline: 'a11y-underline',
    spacing: 'a11y-spacing',
    motion: 'a11y-reduce-motion'
  };
  const toggleBtns = {};
  TOGGLE_KEYS.forEach((key) => { toggleBtns[key] = panel.querySelector('[data-a11y="' + key + '"]'); });

  let textLevel = parseInt(localStorage.getItem('a11yTextLevel') || '0', 10) || 0;
  const toggleState = {};
  TOGGLE_KEYS.forEach((key) => { toggleState[key] = localStorage.getItem('a11y_' + key) === 'true'; });

  const applyState = () => {
    TEXT_LEVEL_CLASSES.forEach((cls) => { if(cls) body.classList.remove(cls); });
    if(TEXT_LEVEL_CLASSES[textLevel]) body.classList.add(TEXT_LEVEL_CLASSES[textLevel]);
    localStorage.setItem('a11yTextLevel', String(textLevel));

    TOGGLE_KEYS.forEach((key) => {
      body.classList.toggle(TOGGLE_CLASSES[key], toggleState[key]);
      if(toggleBtns[key]) toggleBtns[key].setAttribute('aria-pressed', String(toggleState[key]));
      localStorage.setItem('a11y_' + key, String(toggleState[key]));
    });

    if(toggleState.motion){
      document.querySelectorAll('.carousel').forEach((el) => {
        if(window.bootstrap && window.bootstrap.Carousel){
          const inst = window.bootstrap.Carousel.getOrCreateInstance(el);
          inst.pause();
        }
      });
    }
  };

  // Read Page Aloud -- uses the browser's built-in speech synthesis, no external
  // service or API key needed. Reads the page title plus the visible content
  // sections (skips nav/footer chrome).
  const readBtn = panel.querySelector('[data-a11y="read-aloud"]');
  const getPageText = () => {
    const nodes = document.querySelectorAll('.page-hero, .content-section, .section, article');
    let text = document.title + '. ';
    nodes.forEach((n) => { text += n.innerText + '. '; });
    return text;
  };
  const stopReading = () => {
    if('speechSynthesis' in window) window.speechSynthesis.cancel();
    if(readBtn) readBtn.setAttribute('aria-pressed', 'false');
  };
  if(readBtn){
    readBtn.addEventListener('click', function(){
      if(!('speechSynthesis' in window)){
        alert('Sorry, your browser does not support reading pages aloud.');
        return;
      }
      if(readBtn.getAttribute('aria-pressed') === 'true'){
        stopReading();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(getPageText());
      utterance.rate = 0.95;
      utterance.onend = stopReading;
      utterance.onerror = stopReading;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      readBtn.setAttribute('aria-pressed', 'true');
    });
  }

  panel.addEventListener('click', function(event){
    const btn = event.target.closest('[data-a11y]');
    if(!btn) return;

    switch(btn.dataset.a11y){
      case 'font-inc':
        textLevel = Math.min(textLevel + 1, TEXT_LEVEL_CLASSES.length - 1);
        applyState();
        break;
      case 'font-dec':
        textLevel = Math.max(textLevel - 1, 0);
        applyState();
        break;
      case 'contrast':
      case 'grayscale':
      case 'underline':
      case 'spacing':
      case 'motion':
        toggleState[btn.dataset.a11y] = !toggleState[btn.dataset.a11y];
        applyState();
        break;
      case 'reset':
        textLevel = 0;
        TOGGLE_KEYS.forEach((key) => { toggleState[key] = false; });
        stopReading();
        applyState();
        break;
    }
  });

  applyState();
});

document.addEventListener('DOMContentLoaded', function(){
  // Donate page: the amount chips and the free-text amount field are
  // separate inputs (only the text field is actually named "amount" and
  // submitted), so picking a chip needs to copy its value into the field.
  const donateForm = document.querySelector('.donate-form');
  if(!donateForm) return;

  const presets = donateForm.querySelectorAll('input[name="amount-preset"]');
  const amountField = donateForm.querySelector('input[name="amount"]');
  if(!presets.length || !amountField) return;

  // When frequency changes, update the amount presets and min accordingly
  const freqOnce = donateForm.querySelector('#freq-once');
  const freqMonthly = donateForm.querySelector('#freq-monthly');
  const updateForFrequency = () => {
    const isMonthly = freqMonthly && freqMonthly.checked;
    // update displayed labels and the amountField min
    presets.forEach((preset) => {
      const onetime = preset.dataset.onetime;
      const monthly = preset.dataset.monthly;
      if(preset.value === 'custom') return;
      preset.value = isMonthly ? monthly : onetime;
      const label = donateForm.querySelector('label[for="' + preset.id + '"]');
      if(label){ label.textContent = '₦' + Number(preset.value).toLocaleString(); }
    });
    amountField.min = isMonthly ? 50000 : 100000;
    // re-initialize checked preset value into field
    const checked = donateForm.querySelector('input[name="amount-preset"]:checked');
    if(checked && checked.value !== 'custom') amountField.value = checked.value;
  };
  if(freqOnce && freqMonthly){
    freqOnce.addEventListener('change', updateForFrequency);
    freqMonthly.addEventListener('change', updateForFrequency);
    updateForFrequency();
  }

  presets.forEach(function(preset){
    preset.addEventListener('change', function(){
      if(preset.value === 'custom'){
        amountField.value = '';
        amountField.focus();
      } else {
        amountField.value = preset.value;
      }
    });
  });
  amountField.addEventListener('input', function(){
    const matchingPreset = donateForm.querySelector('input[name="amount-preset"][value="' + amountField.value + '"]');
    presets.forEach(function(preset){ preset.checked = false; });
    if(matchingPreset) matchingPreset.checked = true;
  });

  // Initialize with the default-checked preset's value
  const checkedPreset = donateForm.querySelector('input[name="amount-preset"]:checked');
  if(checkedPreset && checkedPreset.value !== 'custom') amountField.value = checkedPreset.value;
});

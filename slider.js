(function () {
  "use strict";

  if (typeof Swiper === "undefined") return;

  function initializeSwipers() {
    const swiperElements = document.querySelectorAll('[data-slider="slider"]');
    if (swiperElements.length === 0) return;

    swiperElements.forEach((element, index) => {
      initializeSwiper(element, index);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeSwipers);
  } else {
    initializeSwipers();
  }

  // --- Resize Handler ---
  let resizeTimeout;
  let lastWidth = window.innerWidth;

  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const currentWidth = window.innerWidth;
      if (currentWidth !== lastWidth) {
        lastWidth = currentWidth;
        if (window.AttributesSwiper && window.AttributesSwiper.reinitialize) {
          window.AttributesSwiper.reinitialize();
        }
      }
    }, 250);
  }
  window.addEventListener("resize", handleResize);

  // --- Main Initialization ---
  function initializeSwiper(element, index) {
    try {
      processWebflowCMSLists(element);

      // 1. Init Swiper
      const config = getSwiperConfig(element);
      const swiper = new Swiper(element, config);
      element.swiperInstance = swiper;

      // 2. Setup Features
      setupHeightCalculation(element, swiper);
      setupLiveCounter(element, swiper);
      setupScopedGLightbox(element, swiper);

    } catch (error) {
      console.error("Swiper init error:", error);
    }
  }

  // --- GLightbox Integration ---
  function setupScopedGLightbox(element, swiper) {
    const componentWrapper = element.closest('[data-slider="component"]');
    if (!componentWrapper) return;

    const triggerBtn = componentWrapper.querySelector('[data-slider="lightbox-trigger"]');
    
    const slides = element.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)');
    const galleryElements = [];

    slides.forEach((slide) => {
      const img = slide.querySelector('img');
      if (img) {
        const imgSrc = img.currentSrc || img.src;
        galleryElements.push({
          href: imgSrc,
          type: 'image',
          alt: img.getAttribute('alt') || '',
          title: img.getAttribute('alt') || '',
        });
      }
    });

    if (galleryElements.length === 0) return;

    // Phosphor Icons (Fill Variant)
    const iconPrev = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M163.06,40.61a8,8,0,0,0-8.72,1.73l-80,80a8,8,0,0,0,0,11.32l80,80A8,8,0,0,0,168,208V48A8,8,0,0,0,163.06,40.61Z"/></svg>`;
    const iconNext = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M181.66,122.34l-80-80A8,8,0,0,0,88,48V208a8,8,0,0,0,13.66,5.66l80-80A8,8,0,0,0,181.66,122.34Z"/></svg>`;
    const iconClose = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm37.66,130.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/></svg>`;

    const lightbox = GLightbox({
      elements: galleryElements,
      touchNavigation: true,
      loop: true,
      zoomable: true,
      openEffect: 'zoom',
      closeEffect: 'zoom',
      // Inject Custom Icons
      prevHtml: iconPrev,
      nextHtml: iconNext,
      closeHtml: iconClose
    });

    // Sync: Lightbox -> Swiper
    lightbox.on('slide_changed', ({ current }) => {
      // Synchronize Swiper to the index currently viewed in Lightbox
      if (swiper.params.loop) {
        swiper.slideToLoop(current.index, 0); // 0ms for instant update
      } else {
        swiper.slideTo(current.index, 0);
      }
    });

    // Sync: Swiper -> Lightbox (via Trigger)
    if (triggerBtn) {
      triggerBtn.style.cursor = 'pointer';
      triggerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        lightbox.openAt(swiper.realIndex);
      });
    }
  }

  // --- Live Counter ---
  function setupLiveCounter(element, swiper) {
    const component = element.closest('[data-slider="component"]');
    if (!component) return;

    const counterEl = component.querySelector('[data-slider="counter"]');
    if (!counterEl) return;

    const updateCounter = () => {
      const total = element.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)').length;
      const current = swiper.realIndex + 1;
      counterEl.textContent = `${current}/${total}`;
    };

    updateCounter();
    swiper.on('slideChange', updateCounter);
    swiper.on('slideChangeTransitionEnd', updateCounter);
  }

  // --- Height Calculation ---
  function setupHeightCalculation(element, swiper) {
    function updateSliderHeight() {
      const slides = element.querySelectorAll('.swiper-slide');
      if (slides.length === 0) return;
      
      element.style.height = '';
      let maxHeight = 0;
      slides.forEach(slide => {
        slide.style.height = 'auto';
        const h = slide.offsetHeight;
        if (h > maxHeight) maxHeight = h;
      });
      
      if (maxHeight > 0) element.style.height = maxHeight + 'px';
      if (swiper) swiper.update();
    }
    
    updateSliderHeight();
    swiper.on('slideChange', updateSliderHeight);
    swiper.on('slideChangeTransitionEnd', updateSliderHeight);
    swiper.on('resize', updateSliderHeight);
  }

  // --- Helpers ---
  function processWebflowCMSLists(element) {
    const selectors = [".w-dyn-list", ".w-dyn-items", ".w-dyn-item"];
    selectors.forEach((selector) => {
      element.querySelectorAll(selector).forEach((el) => {
        const children = Array.from(el.childNodes);
        children.forEach((child) => el.parentNode.insertBefore(child, el));
        el.remove();
      });
    });
  }

  function getSwiperConfig(element) {
    const styles = getComputedStyle(element);
    const getVar = (name, fallback) => parseFloat(styles.getPropertyValue(name).trim()) || fallback;
    
    const config = {
      breakpoints: {
        0:   { slidesPerView: getVar("--xs", 1), spaceBetween: getVar("--gap", 24) },
        480: { slidesPerView: getVar("--sm", 1), spaceBetween: getVar("--gap", 24) },
        768: { slidesPerView: getVar("--md", 2), spaceBetween: getVar("--gap", 24) },
        992: { slidesPerView: getVar("--lg", 3), spaceBetween: getVar("--gap", 24) },
      },
      watchSlidesProgress: true,
      keyboard: { enabled: true, onlyInViewport: true },
      a11y: { enabled: true },
      watchOverflow: true,
      loop: element.dataset.loop === "true"
    };

    if (element.dataset.grabCursor !== "false") config.grabCursor = true;

    const component = element.closest('[data-slider="component"]');
    const nextEl = component.querySelector('[data-slider="next"]');
    const prevEl = component.querySelector('[data-slider="previous"]');
    if (nextEl && prevEl) config.navigation = { nextEl, prevEl };

    const paginationEl = component.querySelector('[data-slider="pagination"]');
    if (paginationEl) {
      config.pagination = {
        el: paginationEl,
        clickable: true,
        bulletElement: "button",
        bulletClass: "slider-pagination_button",
        bulletActiveClass: "cc-active",
      };
    }

    if (element.dataset.autoplay && element.dataset.autoplay !== "false") {
      config.autoplay = {
        delay: parseInt(element.dataset.autoplay),
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      };
    }
    
    if (element.dataset.centered === "true") {
      config.centeredSlides = true;
      config.centeredSlidesBounds = true;
    }

    if (element.dataset.effect === "fade") {
      config.effect = "fade";
      config.fadeEffect = { crossFade: true };
    }
    
    if (element.dataset.speed) config.speed = parseInt(element.dataset.speed);

    return config;
  }

  window.AttributesSwiper = {
    reinitialize: function () {
      if (typeof Swiper === "undefined") return;
      document.querySelectorAll('[data-slider="slider"]').forEach((el) => {
        if (el.swiperInstance) el.swiperInstance.destroy(true, true);
      });
      setTimeout(initializeSwipers, 50);
    },
    getInstance: (i) => {
      const els = document.querySelectorAll('[data-slider="slider"]');
      return els[i] ? els[i].swiperInstance : null;
    },
  };
})();

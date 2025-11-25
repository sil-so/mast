(function () {
  "use strict";

  if (typeof Swiper === "undefined") return;

  // -----------------------------------------------------------
  // Initialization
  // -----------------------------------------------------------

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

  // -----------------------------------------------------------
  // Resize Handling
  // -----------------------------------------------------------

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

  // -----------------------------------------------------------
  // Core Logic
  // -----------------------------------------------------------

  function initializeSwiper(element, index) {
    try {
      processWebflowCMSLists(element);

      // 1. Get Config & Init Swiper
      const config = getSwiperConfig(element);
      const swiper = new Swiper(element, config);
      element.swiperInstance = swiper;

      // 2. Setup Features
      setupHeightCalculation(element, swiper);
      setupLiveCounter(element, swiper);
      
      // 3. Setup GLightbox (Pass swiper instance to sync index)
      setupScopedGLightbox(element, swiper);

    } catch (error) {
      console.error("Swiper initialization failed:", error);
    }
  }

  function setupScopedGLightbox(element, swiper) {
    // 1. Find the wrapper to locate the specific trigger for this slider
    const componentWrapper = element.closest('[data-slider="component"]');
    if (!componentWrapper) return;

    const triggerBtn = componentWrapper.querySelector('[data-slider="lightbox-trigger"]');
    
    // 2. Build the Gallery Data from Slides
    // We select only non-duplicate slides to get the clean list of images
    const slides = element.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)');
    const galleryElements = [];

    slides.forEach((slide) => {
      const img = slide.querySelector('img');
      if (img) {
        galleryElements.push({
          href: img.src || img.currentSrc, // Uses current visible source
          type: 'image',
          alt: img.getAttribute('alt') || '',
          title: img.getAttribute('alt') || '', // Shows alt text as caption
        });
      }
    });

    if (galleryElements.length === 0) return;

    // 3. Initialize GLightbox with the virtual elements list
    const lightbox = GLightbox({
      elements: galleryElements,
      touchNavigation: true,
      loop: true,
      zoomable: true,
      openEffect: 'zoom',
      closeEffect: 'zoom'
    });

    // 4. Bind Click Event
    // If trigger exists, open lightbox at the current Swiper index
    if (triggerBtn) {
      triggerBtn.style.cursor = 'pointer';
      triggerBtn.setAttribute('aria-label', 'Open image gallery');
      
      triggerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // swiper.realIndex handles loop mode correctly (0-based index of content)
        lightbox.openAt(swiper.realIndex);
      });
    }
  }

  function setupLiveCounter(element, swiper) {
    const component = element.closest('[data-slider="component"]');
    if (!component) return;

    const counterEl = component.querySelector('[data-slider="counter"]');
    if (!counterEl) return;

    const updateCounter = () => {
      // Calculate total unique slides (excluding loop duplicates)
      const slides = element.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)');
      const total = slides.length;
      
      // realIndex is 0-based
      const current = swiper.realIndex + 1;

      counterEl.textContent = `${current}/${total}`;
    };

    updateCounter();
    
    // Update on any change
    swiper.on('slideChange', updateCounter);
    swiper.on('slideChangeTransitionEnd', updateCounter);
  }

  function setupHeightCalculation(element, swiper) {
    function updateSliderHeight() {
      const slides = element.querySelectorAll('.swiper-slide');
      if (slides.length === 0) return;
      
      element.style.height = '';
      let maxHeight = 0;
      
      slides.forEach(slide => {
        slide.style.height = 'auto';
        const slideHeight = slide.offsetHeight;
        if (slideHeight > maxHeight) maxHeight = slideHeight;
      });
      
      if (maxHeight > 0) element.style.height = maxHeight + 'px';
      if (swiper) swiper.update();
    }
    
    updateSliderHeight();
    swiper.on('slideChange', updateSliderHeight);
    swiper.on('slideChangeTransitionEnd', updateSliderHeight);
    swiper.on('resize', updateSliderHeight);
  }

  function processWebflowCMSLists(element) {
    const webflowSelectors = [".w-dyn-list", ".w-dyn-items", ".w-dyn-item"];
    webflowSelectors.forEach((selector) => {
      const webflowElements = element.querySelectorAll(selector);
      webflowElements.forEach((webflowElement) => {
        const children = Array.from(webflowElement.childNodes);
        children.forEach((child) => {
          webflowElement.parentNode.insertBefore(child, webflowElement);
        });
        webflowElement.remove();
      });
    });
  }

  function getSwiperConfig(element) {
    const computedStyle = getComputedStyle(element);
    const xs = parseFloat(computedStyle.getPropertyValue("--xs").trim()) || 1;
    const sm = parseFloat(computedStyle.getPropertyValue("--sm").trim()) || 1;
    const md = parseFloat(computedStyle.getPropertyValue("--md").trim()) || 2;
    const lg = parseFloat(computedStyle.getPropertyValue("--lg").trim()) || 3;
    const gap = parseInt(computedStyle.getPropertyValue("--gap").trim()) || 24;

    const config = {
      breakpoints: {
        0: { slidesPerView: xs, spaceBetween: gap },
        480: { slidesPerView: sm, spaceBetween: gap },
        768: { slidesPerView: md, spaceBetween: gap },
        992: { slidesPerView: lg, spaceBetween: gap },
      },
      watchSlidesProgress: true,
      keyboard: { enabled: true, onlyInViewport: true },
      a11y: { enabled: true },
      watchOverflow: true,
      // Loop config
      loop: element.dataset.loop === "true"
    };

    if (element.dataset.grabCursor !== "false") config.grabCursor = true;

    // Navigation & Pagination
    const componentWrapper = element.closest('[data-slider="component"]');
    const nextEl = componentWrapper.querySelector('[data-slider="next"]');
    const prevEl = componentWrapper.querySelector('[data-slider="previous"]');
    if (nextEl && prevEl) config.navigation = { nextEl, prevEl };

    const paginationEl = componentWrapper.querySelector('[data-slider="pagination"]');
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

  // External Control Interface
  window.AttributesSwiper = {
    reinitialize: function () {
      if (typeof Swiper === "undefined") return;
      const swiperElements = document.querySelectorAll('[data-slider="slider"]');
      swiperElements.forEach((element) => {
        if (element.swiperInstance) element.swiperInstance.destroy(true, true);
      });
      setTimeout(() => {
        initializeSwipers();
      }, 50);
    },
    getInstance: (index) => {
      const els = document.querySelectorAll('[data-slider="slider"]');
      return els[index] ? els[index].swiperInstance : null;
    },
  };
})();

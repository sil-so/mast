(function () {
  "use strict";

  // Configuration
  const SELECTORS = {
    wrapper: '[data-stack="wrapper"]',
    item: '[data-stack="item"]',
    img: 'img'
  };

  function initializeStacks() {
    const stacks = document.querySelectorAll(SELECTORS.wrapper);
    if (stacks.length === 0) return;

    stacks.forEach((stack) => {
      // Find all images within this stack (handles nested Webflow divs)
      const images = stack.querySelectorAll(`${SELECTORS.item} ${SELECTORS.img}`);
      
      if (images.length === 0) return;

      images.forEach(img => {
          img.style.height = 'auto'; // Override inline styles
          img.parentElement.style.height = 'auto'; // Ensure parent div isn't locked
      });
      
      // 1. Build Gallery Data
      const galleryElements = Array.from(images).map((img) => {
        // Prefer currentSrc for responsive sizing, fallback to src
        const src = img.currentSrc || img.src;
        // Fix for lazy loaded images that might not have currentSrc yet
        const cleanSrc = src.startsWith('data:') ? img.dataset.src || img.src : src;
        
        return {
          href: cleanSrc,
          type: 'image',
          alt: img.getAttribute('alt') || 'Work'
        };
      });

      // 2. Inject Badge
      if (images.length > 1) {
        const badge = document.createElement('div');
        badge.classList.add('stack-badge');
        badge.textContent = `+${images.length - 1}`;
        stack.appendChild(badge);
      }

      // 3. Init Lightbox (Scoped to this stack)
      const lightbox = GLightbox({
        elements: galleryElements,
        touchNavigation: true,
        loop: true,
        openEffect: 'subtle-zoom',
        closeEffect: 'subtle-zoom',
        cssEfects: { 
           'subtle-zoom': { in: 'subtle-zoomIn', out: 'subtle-zoomOut' }
        }
      });

      // 4. Bind Click
      // We bind to the wrapper. Due to CSS pointer-events on overlays, 
      // the click will bubble up correctly.
      stack.addEventListener('click', (e) => {
        // Check if we clicked a button or link inside (safety check)
        if (e.target.closest('a, button')) return;
        
        e.preventDefault();
        e.stopPropagation();
        lightbox.open();
      });
    });
  }

  // Init
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeStacks);
  } else {
    initializeStacks();
  }
})();

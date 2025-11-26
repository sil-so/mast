(function () {
  "use strict";

  const SELECTORS = {
    wrapper: '[data-stack="wrapper"]',
    item: '[data-stack="item"]',
    img: 'img'
  };

  function initializeStacks() {
    const stacks = document.querySelectorAll(SELECTORS.wrapper);
    if (stacks.length === 0) return;

    stacks.forEach((stack) => {
      const images = stack.querySelectorAll(`${SELECTORS.item} ${SELECTORS.img}`);
      if (images.length === 0) return;

      images.forEach((img) => {
        img.style.height = 'auto';
        if (img.parentElement) {
          img.parentElement.style.height = 'auto';
        }
      });

      const galleryElements = Array.from(images).map((img) => {
        const src = img.currentSrc || img.src;
        const cleanSrc = src.startsWith('data:') ? img.dataset.src || img.src : src;
        return {
          href: cleanSrc,
          type: 'image',
          alt: img.getAttribute('alt') || 'Work'
        };
      });

      if (images.length > 1) {
        const badge = document.createElement('div');
        badge.classList.add('stack-badge');
        badge.textContent = `+${images.length - 1}`;
        stack.appendChild(badge);
      }

      const lightbox = GLightbox({
        elements: galleryElements,
        touchNavigation: true,
        loop: true,
        openEffect: 'subtle-zoom',
        closeEffect: 'subtle-zoom',
        cssEfects: {
          "subtle-zoom": { in: 'subtle-zoomIn', out: 'subtle-zoomOut' }
        }
      });

      stack.addEventListener('click', (e) => {
        if (e.target.closest('a, button')) return;
        e.preventDefault();
        e.stopPropagation();
        lightbox.open();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeStacks);
  } else {
    initializeStacks();
  }
})();

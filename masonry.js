window.addEventListener('load', function() {
  const masonryContainer = document.querySelector('.masonry-container');
  if (!masonryContainer) return;

  // --- 1. INITIALIZATION ---
  let iso;
  const imgLoad = imagesLoaded(masonryContainer);

  imgLoad.on('done', function() {
    iso = new Isotope(masonryContainer, {
      itemSelector: '.masonry-item',
      layoutMode: 'masonry',
      percentPosition: true,
      masonry: { columnWidth: '.grid-sizer' },
      visibleStyle: { opacity: 1 },
      hiddenStyle: { opacity: 0 },
      stagger: 30
    });
    masonryContainer.classList.add('is-loaded');
    window.isoInstance = iso; // Expose for external access
  });

  // --- 2. UNIFIED FILTER LOGIC ---
  const filterComponent = document.querySelector('.filter-component');
  const filterList = document.querySelector('.filter-list');
  const mobileToggle = document.querySelector('.filter-mobile-toggle');
  const toggleText = document.querySelector('.toggle-text');
  const filterButtons = document.querySelectorAll('.cc-filter');

  if (filterComponent) {
    // A. Mobile Toggle Interaction
    if (mobileToggle) {
      mobileToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = filterList.classList.toggle('is-open');
        mobileToggle.setAttribute('aria-expanded', isOpen);
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!filterComponent.contains(e.target)) {
          filterList.classList.remove('is-open');
          mobileToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // B. Filter Button Interaction (Works for Desktop & Mobile)
    filterButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();

        // Visual Updates
        filterButtons.forEach(btn => btn.classList.remove('cc-active'));
        this.classList.add('cc-active');

        // Update Mobile Label text
        const labelName = this.getAttribute('data-filter-name') || this.textContent.trim();
        if (toggleText) toggleText.textContent = labelName;

        // Auto-close mobile menu
        if (filterList) filterList.classList.remove('is-open');

        // Isotope Filtering
        if (iso) {
          const rawFilter = this.getAttribute('data-filter');
          // If '*', show all. Otherwise, match data-category attribute.
          const formattedFilter = rawFilter === '*' ? '*' : `[data-category~="${rawFilter}"]`;
          iso.arrange({ filter: formattedFilter });
        }
      });
    });
  }

  // --- 3. VIEW SWITCHERS (COLUMNS) ---
  const viewSwitchers = document.querySelectorAll('[data-columns]');
  const colClasses = ['cols-1', 'cols-2', 'cols-3', 'cols-4'];

  viewSwitchers.forEach(button => {
    button.addEventListener('click', function() {
      if (!iso) return;
      const targetCols = this.getAttribute('data-columns');
      
      // Active State
      viewSwitchers.forEach(btn => btn.classList.remove('cc-view-active'));
      this.classList.add('cc-view-active');

      // Update Container Class
      masonryContainer.classList.remove(...colClasses);
      masonryContainer.classList.add(`cols-${targetCols}`);

      // Resize internal sliders (if any)
      masonryContainer.querySelectorAll('[data-slider="slider"]').forEach(swiperEl => {
        if (swiperEl.swiperInstance) swiperEl.swiperInstance.emit('resize');
      });

      iso.layout();
    });
  });

  // --- 4. WINDOW RESIZE (DEBOUNCED) ---
  let resizeTimer;
  window.addEventListener('resize', function() {
    if (!iso) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      iso.layout(); 
      // Note: We deliberately do NOT force sync active buttons here 
      // to preserve user manual selection.
    }, 250);
  });

  // --- 5. MUTATION OBSERVER (DYNAMIC CONTENT) ---
  // Detects size changes inside items (e.g., accordions/read-more)
  document.addEventListener('click', function(e) {
    const readMoreBtn = e.target.closest('.testimonial-toggle');
    if (readMoreBtn) {
      const wrapper = readMoreBtn.closest('.masonry-item')?.querySelector('.testimonial-wrapper');
      if (!wrapper) return;

      const observer = new MutationObserver(() => {
         if (window.isoInstance) window.isoInstance.layout();
      });
      
      observer.observe(wrapper, { attributes: true, attributeFilter: ['style'] });
      // Disconnect after transition (550ms) to save resources
      setTimeout(() => observer.disconnect(), 550);
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  // Guard: Ensure libraries exist
  if (typeof Isotope === 'undefined' || typeof imagesLoaded === 'undefined') {
    console.error('Isotope or imagesLoaded library not found.');
    return;
  }

  const masonryContainer = document.querySelector('.masonry-container');
  if (!masonryContainer) return;

  // Configuration
  const CLASSES = {
    activeFilter: 'cc-filter-active',
    activeView: 'cc-view-active',
    loaded: 'is-loaded'
  };
  
  const colClasses = ['cols-1', 'cols-2', 'cols-3', 'cols-4'];
  let iso;

  // --- Helper Functions ---

  const getCurrentDefaultCols = () => {
    const w = window.innerWidth;
    if (w >= 1200) return '4';
    if (w >= 992) return '3';
    if (w >= 768) return '2';
    return '1';
  };

  const updateActiveViewButton = (columns) => {
    document.querySelectorAll('[data-columns]').forEach(btn => {
      const isActive = btn.getAttribute('data-columns') === columns;
      btn.classList.toggle(CLASSES.activeView, isActive);
    });
  };

  // --- Initialization ---

  const imgLoad = imagesLoaded(masonryContainer);

  imgLoad.on('done', () => {
    iso = new Isotope(masonryContainer, {
      itemSelector: '.masonry-item',
      layoutMode: 'masonry',
      percentPosition: true,
      masonry: { columnWidth: '.grid-sizer' },
      visibleStyle: { opacity: 1 },
      hiddenStyle: { opacity: 0 },
      stagger: 50
    });

    masonryContainer.classList.add(CLASSES.loaded);
    window.isoInstance = iso;

    // Set initial view state
    updateActiveViewButton(getCurrentDefaultCols());
  });

  // --- View Switchers ---
  
  document.querySelectorAll('[data-columns]').forEach(button => {
    button.addEventListener('click', function() {
      if (!iso) return;
      
      const targetCols = this.getAttribute('data-columns');
      updateActiveViewButton(targetCols);

      // Reset container classes
      masonryContainer.classList.remove(...colClasses);
      masonryContainer.classList.add(`cols-${targetCols}`);

      // Trigger Swiper updates if present
      masonryContainer.querySelectorAll('[data-slider="slider"]').forEach(s => {
        if (s.swiperInstance) s.swiperInstance.emit('resize');
      });

      iso.layout();
    });
  });

  // --- Filtering Logic ---

  const filterComponent = document.querySelector('.filter-component');
  const filterButtons = document.querySelectorAll('[data-filter]');

  if (filterComponent && filterButtons.length > 0) {
    const filterList = filterComponent.querySelector('.filter-list');
    const mobileToggle = filterComponent.querySelector('.filter-mobile-toggle');
    const toggleText = filterComponent.querySelector('.toggle-text');

    // Mobile Toggle
    if (mobileToggle && filterList) {
      mobileToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = filterList.classList.toggle('is-open');
        mobileToggle.setAttribute('aria-expanded', isOpen);
      });

      document.addEventListener('click', (e) => {
        if (!filterComponent.contains(e.target)) {
          filterList.classList.remove('is-open');
          mobileToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Filter Clicks
    filterButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        if (!iso) return;

        // Visual State
        filterButtons.forEach(btn => btn.classList.remove(CLASSES.activeFilter));
        this.classList.add(CLASSES.activeFilter);

        // UI Text Update
        const labelName = this.getAttribute('data-filter-name') || this.textContent.trim();
        if (toggleText) toggleText.textContent = labelName;
        if (filterList) filterList.classList.remove('is-open');

        // Isotope Filtering
        const raw = this.getAttribute('data-filter');
        const finalFilter = raw === '*' ? '*' : `[data-category~="${raw}"]`;
        iso.arrange({ filter: finalFilter });
      });
    });
  }

  // --- Resize Handling (Debounced) ---

  let resizeTimer;
  window.addEventListener('resize', () => {
    if (!iso) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      iso.layout();
      
      // Re-sync buttons only if no manual override class exists
      const hasManualOverride = colClasses.some(c => masonryContainer.classList.contains(c));
      if (!hasManualOverride) {
         updateActiveViewButton(getCurrentDefaultCols());
      }
    }, 250);
  });

  // --- Dynamic Content Observer ---
  
  document.addEventListener('click', (e) => {
    const readMoreBtn = e.target.closest('.testimonial-toggle');
    if (!readMoreBtn) return;

    const wrapper = readMoreBtn.closest('.masonry-item')?.querySelector('.testimonial-wrapper');
    if (!wrapper) return;

    // Prevent multiple observers stacking up
    if (wrapper._isoObserver) wrapper._isoObserver.disconnect();

    const observer = new MutationObserver(() => {
      if (window.isoInstance) window.isoInstance.layout();
    });
    
    observer.observe(wrapper, { attributes: true, attributeFilter: ['style'] });
    wrapper._isoObserver = observer; // Store reference on element

    // Cleanup after transition
    setTimeout(() => {
      observer.disconnect();
      delete wrapper._isoObserver;
    }, 600);
  });
});

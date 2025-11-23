window.addEventListener('load', function() {
  const masonryContainer = document.querySelector('.masonry-container');
  if (!masonryContainer) return;

  let iso;
  const viewSwitchers = document.querySelectorAll('[data-columns]');
  const colClasses = ['cols-1', 'cols-2', 'cols-3', 'cols-4'];
  
  // Determine current default columns based on CSS breakpoints
  function getCurrentDefaultCols() {
    const w = window.innerWidth;
    if (w >= 1200) return '4';
    if (w >= 992) return '3';
    if (w >= 768) return '2';
    return '1';
  }

  function updateActiveViewButton(columns) {
    viewSwitchers.forEach(btn => {
      if (btn.getAttribute('data-columns') === columns) {
        btn.classList.add('cc-view-active');
      } else {
        btn.classList.remove('cc-view-active');
      }
    });
  }

  // Initialize Isotope after images load
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
    window.isoInstance = iso;

    // Set initial button state based on breakpoint
    const startCols = getCurrentDefaultCols();
    updateActiveViewButton(startCols);
  });

  // View Switchers - Change column count
  viewSwitchers.forEach(button => {
    button.addEventListener('click', function() {
      if (!iso) return;
      const targetCols = this.getAttribute('data-columns');
      
      updateActiveViewButton(targetCols);

      // Force container class override
      masonryContainer.classList.remove(...colClasses);
      masonryContainer.classList.add(`cols-${targetCols}`);

      // Trigger internal swiper resize
      const swipers = masonryContainer.querySelectorAll('[data-slider="slider"]');
      swipers.forEach(s => s.swiperInstance?.emit('resize'));

      iso.layout();
    });
  });

  // Unified Filter Logic
  const filterComponent = document.querySelector('.filter-component');
  const filterList = document.querySelector('.filter-list');
  const mobileToggle = document.querySelector('.filter-mobile-toggle');
  const toggleText = document.querySelector('.toggle-text');
  const filterButtons = document.querySelectorAll('.cc-filter');

  if (filterComponent) {
    if (mobileToggle) {
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

    filterButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        filterButtons.forEach(btn => btn.classList.remove('cc-active'));
        this.classList.add('cc-active');

        const labelName = this.getAttribute('data-filter-name') || this.textContent.trim();
        if (toggleText) toggleText.textContent = labelName;
        if (filterList) filterList.classList.remove('is-open');

        if (iso) {
          const raw = this.getAttribute('data-filter');
          const finalFilter = raw === '*' ? '*' : `[data-category~="${raw}"]`;
          iso.arrange({ filter: finalFilter });
        }
      });
    });
  }

  // Debounced resize handler
  let resizeTimer;
  window.addEventListener('resize', function() {
    if (!iso) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      iso.layout();
      
      // Update button if no manual column override exists
      const hasManualOverride = colClasses.some(c => masonryContainer.classList.contains(c));
      if (!hasManualOverride) {
         updateActiveViewButton(getCurrentDefaultCols());
      }
    }, 250);
  });

  // Read More - Observe height changes and trigger layout
  document.addEventListener('click', function(e) {
    const readMoreBtn = e.target.closest('.testimonial-toggle');
    if (readMoreBtn) {
      const wrapper = readMoreBtn.closest('.masonry-item')?.querySelector('.testimonial-wrapper');
      if (!wrapper) return;
      const observer = new MutationObserver(() => window.isoInstance?.layout());
      observer.observe(wrapper, { attributes: true, attributeFilter: ['style'] });
      setTimeout(() => observer.disconnect(), 550);
    }
  });
});

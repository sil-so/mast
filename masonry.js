window.addEventListener('load', function() {
  const masonryContainer = document.querySelector('.masonry-container');
  if (!masonryContainer) return;

  // Initialize Isotope after images load
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
    window.isoInstance = iso;
  });

  // Unified Filter Handler - Syncs both desktop and mobile filter buttons
  const filterButtons = document.querySelectorAll('.cc-filter'); 
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      const filterValue = this.getAttribute('data-filter');
      
      // Sync all buttons with matching filter value
      filterButtons.forEach(btn => {
        if(btn.getAttribute('data-filter') === filterValue) {
          btn.classList.add('cc-filter-checked');
          btn.classList.add('cc-active');
          btn.setAttribute('aria-selected', 'true');
        } else {
          btn.classList.remove('cc-filter-checked', 'cc-active');
          btn.setAttribute('aria-selected', 'false');
        }
      });

      // Update mobile dropdown label
      const mobileLabel = document.querySelector('.filters-menu_dropdown-text');
      if (mobileLabel) {
        mobileLabel.textContent = this.getAttribute('data-filter-name') || this.textContent.trim();
      }

      // Apply Isotope filter
      if (iso) {
        const formattedFilter = filterValue === '*' 
          ? '*' 
          : `[data-category~="${filterValue}"]`;
        iso.arrange({ filter: formattedFilter });
      }
    });
  });

  // View Switchers - Change column count
  const viewSwitchers = document.querySelectorAll('.button[data-columns]');
  const colClasses = ['cols-1', 'cols-2', 'cols-3', 'cols-4'];
  
  viewSwitchers.forEach(button => {
    button.addEventListener('click', function() {
      if (!iso) return;
      const targetCols = this.getAttribute('data-columns');
      
      viewSwitchers.forEach(btn => btn.classList.remove('cc-view-active'));
      this.classList.add('cc-view-active');
      
      masonryContainer.classList.remove(...colClasses);
      masonryContainer.classList.add(`cols-${targetCols}`);
      
      // Trigger internal swiper resize
      const swipers = masonryContainer.querySelectorAll('[data-slider="slider"]');
      swipers.forEach(s => s.swiperInstance?.emit('resize'));
      
      iso.layout();
    });
  });

  // Debounced resize handler
  let resizeTimer;
  window.addEventListener('resize', function() {
    if (!iso) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      iso.layout();
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

// Mobile Dropdown Toggle - Visual interactions only
(function () {
  'use strict';
  const menus = document.querySelectorAll('.filters-menu[data-filter-mobile-dropdown="true"]');
  if (!menus.length) return;

  menus.forEach(menu => {
    const toggle = menu.querySelector('.filters-menu_dropdown-toggle');
    const dropdown = menu.querySelector('.filters-menu_dropdown-menu');
    if (!toggle || !dropdown) return;

    const close = () => {
      dropdown.classList.remove('cc-open');
      toggle.classList.remove('cc-open');
      toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const isOpen = dropdown.classList.toggle('cc-open');
      toggle.classList.toggle('cc-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    dropdown.addEventListener('click', (e) => {
      if (e.target.closest('.cc-filter')) close();
    });

    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && dropdown.classList.contains('cc-open')) close();
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dropdown.classList.contains('cc-open')) close();
    });
  });
})();

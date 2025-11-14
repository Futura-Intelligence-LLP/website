document.addEventListener("DOMContentLoaded", () => {
    // --- Responsive Navigation Dropdown ---
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  const navLinks = document.querySelectorAll('.nav-link');

  navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    nav.classList.toggle('nav--visible');
    document.body.classList.toggle('nav-open');
  });

  // Close nav when clicking on a link
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('nav--visible');
      document.body.classList.remove('nav-open');
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    nav.classList.remove('nav--visible');
    document.body.classList.remove('nav-open');
  });

  // --- Mobile Roadmap Modal (popup) ---
  const timelineTriggers = document.querySelectorAll('.timeline-trigger');
  const backdrop = document.querySelector('.phase-backdrop');

  const closeAllModals = () => {
    document.querySelectorAll('.timeline-item.is-active').forEach(item => {
      item.classList.remove('is-active');
      const t = item.querySelector('.timeline-trigger');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
    document.body.classList.remove('modal-open');
    if (backdrop) backdrop.classList.remove('is-visible');
  };

  timelineTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const parentItem = trigger.parentElement;
      
      // Check if mobile view
      if (window.innerWidth < 768) {
        // Close any open modals before opening a new one
        closeAllModals();
        // Open the new one
        parentItem.classList.add('is-active');
        trigger.setAttribute('aria-expanded', 'true');
        document.body.classList.add('modal-open');
        if (backdrop) backdrop.classList.add('is-visible');
      } else {
        // Desktop: just toggle inline accordion (though not visible on desktop)
        parentItem.classList.toggle('is-active');
        trigger.setAttribute('aria-expanded', 
          trigger.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
      }
    });
  });

  // Close card when clicking close button
  const closeButtons = document.querySelectorAll('.phase-close-btn');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  // Close modal when clicking the backdrop
  if (backdrop) {
    backdrop.addEventListener('click', closeAllModals);
  }

  // --- Debounced Resize Handler ---
  // This prevents the resize logic from firing too frequently
  const debounce = (func, delay) => {
    let debounceTimer;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
  };

  let isDesktop = window.innerWidth >= 768;
  const handleResize = () => {
    const currentlyDesktop = window.innerWidth >= 768;
    if (isDesktop !== currentlyDesktop) {
      isDesktop = currentlyDesktop;
      // Disable transitions BEFORE layout changes
      nav.classList.add('no-transition');
      document.body.style.transition = 'none';
      
      // Close any open modals and reset nav state
      closeAllModals();
      nav.classList.remove('nav--visible');
      document.body.classList.remove('nav-open');
      
      // Force reflow to apply no-transition class
      void nav.offsetHeight;
      
      // Re-enable transitions after resize
      setTimeout(() => {
        nav.classList.remove('no-transition');
        document.body.style.transition = '';
      }, 100);
    }
  };
  window.addEventListener('resize', debounce(handleResize, 200));
  
    // --- Archived Missions Accordion ---
  const archivedItems = document.querySelectorAll(".archived-mission-item");

  archivedItems.forEach((item) => {
    const button = item.querySelector(".archived-mission-button");
    const content = item.querySelector(".archived-mission-content");

    button.addEventListener("click", () => {
      const isExpanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", !isExpanded);
      content.style.display = isExpanded ? "none" : "block";
    });
  });

  // --- Roadmap Visibility Toggle ---
  const allRoadmapSections = document.querySelectorAll('.roadmap-section');
  const roadmapLinks = document.querySelectorAll('.roadmap-link-btn');

  // Hide all roadmaps by default
  allRoadmapSections.forEach(section => {
    section.style.display = "none";
  });

  roadmapLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault(); // Prevent default anchor jump
      const targetId = link.getAttribute('href').substring(1); // Get 'roadmap' from '#roadmap'
      const targetRoadmap = document.getElementById(targetId);

      if (targetRoadmap) {
        // First, hide all other roadmap sections to ensure only one is visible
        allRoadmapSections.forEach(section => {
          section.style.display = "none";
        });

        targetRoadmap.style.display = "block"; // Show the correct roadmap
        targetRoadmap.scrollIntoView({ behavior: 'smooth' }); // Scroll to it
      }
    });
  });

  // --- Active Missions Carousel ---
  const carouselTrack = document.querySelector('.active-missions-carousel .carousel-track');
  const carouselItems = document.querySelectorAll('.active-missions-carousel .carousel-item');
  const prevBtn = document.querySelector('.active-missions-carousel .prev-btn');
  const nextBtn = document.querySelector('.active-missions-carousel .next-btn');

  if (carouselTrack && carouselItems.length > 0) {
    let currentIndex = 0;

    const updateCarousel = () => {
      const itemWidth = carouselItems[0].offsetWidth;
      carouselTrack.style.transform = `translateX(-${currentIndex * itemWidth}px)`;

      // Disable/enable buttons at ends
      prevBtn.disabled = currentIndex === 0;
      nextBtn.disabled = currentIndex === carouselItems.length - 1;
    };

    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
      }
    });

    nextBtn.addEventListener('click', () => {
      if (currentIndex < carouselItems.length - 1) {
        currentIndex++;
        updateCarousel();
      }
    });

    // Initial update
    updateCarousel();
    // Recalculate on resize
    window.addEventListener('resize', updateCarousel);
  }
});
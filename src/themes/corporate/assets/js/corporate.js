/**
 * Corporate Theme JavaScript
 * Handles theme toggling, aurora effects, scroll reveals, and mobile menu
 */

(function() {
  'use strict';

  // Theme Management
  const THEME_COOKIE_NAME = "lexcms-corporate-theme";
  const modeToggle = document.getElementById("modeToggle");
  const modeIcon = document.getElementById("modeIcon");

  const setModeIcon = (isLight) => {
    if (!modeIcon) return;
    modeIcon.innerHTML = isLight
      ? '<path d="M12 3a1 1 0 0 1 1 1v1.26a7 7 0 0 1 6.74 6.74H21a1 1 0 1 1 0 2h-1.26a7 7 0 0 1-6.74 6.74V21a1 1 0 1 1-2 0v-1.26a7 7 0 0 1-6.74-6.74H3a1 1 0 1 1 0-2h1.26a7 7 0 0 1 6.74-6.74V4a1 1 0 0 1 1-1Z" stroke="none" fill="currentColor"/>'
      : '<path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79Z" stroke="none" fill="currentColor"/>';
  };

  const readThemeFromCookie = () => {
    const match = document.cookie.match(/(?:^|;\s*)lexcms-corporate-theme=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  };

  const persistTheme = (theme) => {
    if (!theme || theme === "light") {
      document.cookie = `${THEME_COOKIE_NAME}=; path=/; max-age=0`;
    } else {
      document.cookie = `${THEME_COOKIE_NAME}=${encodeURIComponent(theme)}; path=/; max-age=31536000`;
    }
  };

  const applyTheme = (theme) => {
    const isLight = theme !== "dark";
    document.body.classList.toggle("light-mode", isLight);
    setModeIcon(isLight);
  };

  // Initialize theme
  applyTheme(readThemeFromCookie());

  // Theme toggle button
  if (modeToggle) {
    modeToggle.addEventListener("click", () => {
      const isLight = document.body.classList.toggle("light-mode");
      if (isLight) {
        persistTheme(null);
      } else {
        persistTheme("dark");
      }
      setModeIcon(isLight);
    });
  }

  // Aurora Gradient Animation (pointer interaction)
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const auroraGradient = document.getElementById("aurora-gradient");

  if (!prefersReducedMotion.matches && auroraGradient) {
    let pointerX = 0.5;
    let pointerY = 0.5;
    let frameRequested = false;

    const animateAurora = () => {
      frameRequested = false;
      const translateX = (pointerX - 0.5) * 12;
      const translateY = (pointerY - 0.5) * 10;
      auroraGradient.style.transform = `translate3d(${translateX}%, ${translateY}%, 0) rotate(12deg)`;
    };

    window.addEventListener("pointermove", (event) => {
      const { clientX, clientY } = event;
      pointerX = clientX / window.innerWidth;
      pointerY = clientY / window.innerHeight;
      if (!frameRequested) {
        frameRequested = true;
        window.requestAnimationFrame(animateAurora);
      }
    });
  }

  // Scroll Reveal Animations
  const revealElements = document.querySelectorAll(".scroll-reveal");
  if (revealElements.length) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    revealElements.forEach((element) => revealObserver.observe(element));
  }

  // Active Navigation Indicator
  const sections = Array.from(document.querySelectorAll("section[id]"));
  const navLinks = Array.from(document.querySelectorAll("a.nav-indicator[href^='#']"));

  if (sections.length && navLinks.length) {
    const navMap = new Map();
    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const id = href.substring(1);
        navMap.set(id, link);
      }
    });

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id;
          const link = navMap.get(id);
          if (link) {
            if (entry.isIntersecting) {
              link.dataset.active = "true";
            } else {
              link.dataset.active = "false";
            }
          }
        });
      },
      { threshold: 0.45 }
    );

    sections.forEach((section) => sectionObserver.observe(section));
  }

  // Mobile Menu Toggle
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileMenuIcons = mobileMenuToggle
    ? {
        open: mobileMenuToggle.querySelector('[data-icon="menu"]'),
        close: mobileMenuToggle.querySelector('[data-icon="close"]'),
        label: mobileMenuToggle.querySelector('.sr-only'),
      }
    : null;

  const toggleMobileMenu = (forceState) => {
    if (!mobileMenu || !mobileMenuToggle) return;
    const isOpening = typeof forceState === 'boolean' ? forceState : mobileMenu.classList.contains('hidden');
    mobileMenu.classList.toggle('hidden', !isOpening);
    mobileMenuToggle.setAttribute('aria-expanded', String(isOpening));
    document.body.classList.toggle('overflow-hidden', isOpening);

    if (mobileMenuIcons) {
      if (mobileMenuIcons.open) {
        mobileMenuIcons.open.classList.toggle('hidden', isOpening);
      }
      if (mobileMenuIcons.close) {
        mobileMenuIcons.close.classList.toggle('hidden', !isOpening);
      }
      if (mobileMenuIcons.label) {
        mobileMenuIcons.label.textContent = isOpening ? 'Cerrar menú' : 'Abrir menú';
      }
    }
  };

  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener('click', () => toggleMobileMenu());

    // Close mobile menu on link click
    const mobileMenuLinks = Array.from(mobileMenu.querySelectorAll('a'));
    mobileMenuLinks.forEach((link) => {
      link.addEventListener('click', () => toggleMobileMenu(false));
    });

    // Close mobile menu on escape key
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
        toggleMobileMenu(false);
      }
    });

    // Close mobile menu on resize to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768 && !mobileMenu.classList.contains('hidden')) {
        toggleMobileMenu(false);
      }
    });
  }

  // Smooth Scroll for Anchor Links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

        // Update URL without jumping
        if (history.pushState) {
          history.pushState(null, null, href);
        }
      }
    });
  });

  // Lazy Loading for Images
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  // Form Submission (basic handling)
  const forms = document.querySelectorAll('form[action="#contacto"], form[action="#agenda"]');
  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);

      // Show loading state
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Enviando...';
        submitButton.disabled = true;

        // Simulate submission (replace with actual API call)
        setTimeout(() => {
          alert('¡Gracias por tu mensaje! Te contactaremos pronto.');
          form.reset();
          submitButton.textContent = originalText;
          submitButton.disabled = false;
        }, 1500);
      }
    });
  });

  console.log('🏢 Corporate Theme loaded');
})();

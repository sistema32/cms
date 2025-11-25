/**
 * Legal Premium Theme - JavaScript
 */

(function () {
    'use strict';

    // Theme toggle
    const initThemeToggle = () => {
        const toggle = document.getElementById('themeToggle');
        const body = document.body;
        const THEME_KEY = 'legal-theme';

        // Load saved theme
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme === 'dark') {
            body.classList.add('dark-mode');
        }

        if (toggle) {
            toggle.addEventListener('click', () => {
                body.classList.toggle('dark-mode');
                const isDark = body.classList.contains('dark-mode');
                localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
            });
        }
    };

    // Smooth scroll for anchor links
    const initSmoothScroll = () => {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href === '#') return;

                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    };

    // Navbar scroll effect
    const initNavbarScroll = () => {
        const navbar = document.querySelector('.navbar-premium');
        if (!navbar) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    };

    // Scroll reveal animations
    const initScrollReveal = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        document.querySelectorAll('.reveal-on-scroll').forEach(el => {
            observer.observe(el);
        });
    };

    // Form validation
    const initFormValidation = () => {
        const forms = document.querySelectorAll('.needs-validation');

        Array.from(forms).forEach(form => {
            form.addEventListener('submit', event => {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated');
            }, false);
        });
    };

    // Mobile menu
    const initMobileMenu = () => {
        const navbarToggler = document.querySelector('.navbar-toggler');
        const navbarCollapse = document.querySelector('.navbar-collapse');

        if (navbarToggler && navbarCollapse) {
            // Close menu when clicking on a link
            navbarCollapse.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    if (navbarCollapse.classList.contains('show')) {
                        navbarToggler.click();
                    }
                });
            });
        }
    };

    // Update current year in footer
    const updateYear = () => {
        const yearElement = document.getElementById('currentYear');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
    };

    // Initialize all features
    const init = () => {
        initThemeToggle();
        initSmoothScroll();
        initNavbarScroll();
        initScrollReveal();
        initFormValidation();
        initMobileMenu();
        updateYear();
    };

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

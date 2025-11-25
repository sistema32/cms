/**
 * LexSlider Frontend JavaScript
 * Handles slider functionality, navigation, and animations
 */

class LexSlider {
    constructor(element) {
        this.element = element;
        this.slides = Array.from(element.querySelectorAll('.lexslider-slide'));
        this.currentIndex = 0;
        this.autoplayInterval = null;

        // Settings from data attributes
        this.settings = {
            autoplay: element.dataset.autoplay === 'true',
            autoplayDelay: parseInt(element.dataset.autoplayDelay) || 5000,
            loop: element.dataset.loop === 'true',
            effect: element.dataset.effect || 'slide'
        };

        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupPagination();
        this.setupTouch();
        this.setupKeyboard();
        this.setupAnimations();

        if (this.settings.autoplay) {
            this.startAutoplay();
        }

        // Pause autoplay on hover
        this.element.addEventListener('mouseenter', () => this.stopAutoplay());
        this.element.addEventListener('mouseleave', () => {
            if (this.settings.autoplay) this.startAutoplay();
        });
    }

    setupNavigation() {
        const prevBtn = this.element.querySelector('.lexslider-button-prev');
        const nextBtn = this.element.querySelector('.lexslider-button-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prev());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.next());
        }
    }

    setupPagination() {
        const bullets = this.element.querySelectorAll('.lexslider-pagination-bullet');

        bullets.forEach((bullet, index) => {
            bullet.addEventListener('click', () => this.goTo(index));
        });
    }

    setupTouch() {
        let touchStartX = 0;
        let touchEndX = 0;

        this.element.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        this.element.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        }, { passive: true });
    }

    handleSwipe(startX, endX) {
        const diff = startX - endX;
        const threshold = 50;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                this.next();
            } else {
                this.prev();
            }
        }
    }

    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (!this.isInViewport()) return;

            if (e.key === 'ArrowLeft') {
                this.prev();
            } else if (e.key === 'ArrowRight') {
                this.next();
            }
        });
    }

    setupAnimations() {
        // Apply animation delays to layers
        this.slides.forEach(slide => {
            const layers = slide.querySelectorAll('.lexslider-layer[data-animation]');
            layers.forEach(layer => {
                const duration = layer.dataset.animationDuration || 600;
                const delay = layer.dataset.animationDelay || 0;
                layer.style.setProperty('--animation-duration', `${duration}ms`);
                layer.style.setProperty('--animation-delay', `${delay}ms`);
            });
        });
    }

    isInViewport() {
        const rect = this.element.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
    }

    goTo(index) {
        if (index < 0 || index >= this.slides.length) return;
        if (index === this.currentIndex) return;

        // Remove active class from current slide
        this.slides[this.currentIndex].classList.remove('active');

        // Update pagination
        const bullets = this.element.querySelectorAll('.lexslider-pagination-bullet');
        if (bullets.length > 0) {
            bullets[this.currentIndex].classList.remove('active');
            bullets[index].classList.add('active');
        }

        // Update index
        this.currentIndex = index;

        // Add active class to new slide
        this.slides[this.currentIndex].classList.add('active');

        // Reset autoplay timer
        if (this.settings.autoplay) {
            this.stopAutoplay();
            this.startAutoplay();
        }
    }

    next() {
        let nextIndex = this.currentIndex + 1;

        if (nextIndex >= this.slides.length) {
            nextIndex = this.settings.loop ? 0 : this.currentIndex;
        }

        this.goTo(nextIndex);
    }

    prev() {
        let prevIndex = this.currentIndex - 1;

        if (prevIndex < 0) {
            prevIndex = this.settings.loop ? this.slides.length - 1 : this.currentIndex;
        }

        this.goTo(prevIndex);
    }

    startAutoplay() {
        this.autoplayInterval = setInterval(() => {
            this.next();
        }, this.settings.autoplayDelay);
    }

    stopAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        }
    }

    destroy() {
        this.stopAutoplay();
        // Remove event listeners if needed
    }
}

// Initialize all sliders on page load
document.addEventListener('DOMContentLoaded', () => {
    const sliders = document.querySelectorAll('.lexslider');
    sliders.forEach(slider => {
        new LexSlider(slider);
    });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LexSlider;
}

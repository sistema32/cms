/**
 * ParticleEffects.js - Animated particle backgrounds
 * Creates particles: snow, stars, bubbles, confetti, fireflies
 */

export const PARTICLE_PRESETS = {
    none: { label: 'None', particles: 0 },
    snow: {
        label: 'Snow',
        particles: 50,
        color: '#ffffff',
        size: { min: 2, max: 6 },
        speed: { min: 1, max: 3 },
        direction: 'down',
        opacity: { min: 0.5, max: 1 },
        wobble: true
    },
    stars: {
        label: 'Stars',
        particles: 80,
        color: '#ffffff',
        size: { min: 1, max: 3 },
        speed: { min: 0, max: 0 },
        direction: 'none',
        opacity: { min: 0.3, max: 1 },
        twinkle: true
    },
    bubbles: {
        label: 'Bubbles',
        particles: 30,
        color: 'rgba(255,255,255,0.3)',
        size: { min: 10, max: 40 },
        speed: { min: 0.5, max: 2 },
        direction: 'up',
        opacity: { min: 0.2, max: 0.5 },
        border: true
    },
    confetti: {
        label: 'Confetti',
        particles: 100,
        colors: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181'],
        size: { min: 5, max: 12 },
        speed: { min: 2, max: 5 },
        direction: 'down',
        rotate: true
    },
    fireflies: {
        label: 'Fireflies',
        particles: 25,
        color: '#ffeb3b',
        size: { min: 3, max: 6 },
        speed: { min: 0.2, max: 0.8 },
        direction: 'random',
        glow: true,
        blur: 3
    },
    rain: {
        label: 'Rain',
        particles: 100,
        color: 'rgba(174,194,224,0.5)',
        size: { width: 1, height: 15 },
        speed: { min: 10, max: 15 },
        direction: 'down',
        shape: 'line'
    },
    leaves: {
        label: 'Leaves',
        particles: 20,
        colors: ['#8B4513', '#D2691E', '#CD853F', '#DEB887'],
        size: { min: 10, max: 20 },
        speed: { min: 1, max: 2 },
        direction: 'down',
        rotate: true,
        wobble: true
    },
    dust: {
        label: 'Dust',
        particles: 40,
        color: 'rgba(255,255,255,0.3)',
        size: { min: 1, max: 3 },
        speed: { min: 0.1, max: 0.5 },
        direction: 'random',
        opacity: { min: 0.1, max: 0.4 }
    }
};

class Particle {
    constructor(canvas, preset) {
        this.canvas = canvas;
        this.preset = preset;
        this.reset();
    }

    reset() {
        const { size, colors, color, opacity } = this.preset;

        this.x = Math.random() * this.canvas.width;
        this.y = Math.random() * this.canvas.height;

        if (this.preset.direction === 'down') {
            this.y = -10;
        } else if (this.preset.direction === 'up') {
            this.y = this.canvas.height + 10;
        }

        this.size = size.min + Math.random() * (size.max - size.min);
        this.color = colors ? colors[Math.floor(Math.random() * colors.length)] : color;
        this.opacity = opacity ? opacity.min + Math.random() * (opacity.max - opacity.min) : 1;
        this.speed = this.preset.speed.min + Math.random() * (this.preset.speed.max - this.preset.speed.min);
        this.angle = Math.random() * Math.PI * 2;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        this.wobbleOffset = Math.random() * Math.PI * 2;
    }

    update(time) {
        const { direction, wobble, rotate } = this.preset;

        switch (direction) {
            case 'down':
                this.y += this.speed;
                if (wobble) {
                    this.x += Math.sin(time * 0.001 + this.wobbleOffset) * 0.5;
                }
                if (this.y > this.canvas.height + 10) this.reset();
                break;
            case 'up':
                this.y -= this.speed;
                if (this.y < -10) this.reset();
                break;
            case 'random':
                this.x += Math.sin(this.angle) * this.speed;
                this.y += Math.cos(this.angle) * this.speed;
                this.angle += (Math.random() - 0.5) * 0.1;

                if (this.x < 0 || this.x > this.canvas.width ||
                    this.y < 0 || this.y > this.canvas.height) {
                    this.reset();
                }
                break;
        }

        if (rotate) {
            this.rotation += this.rotationSpeed;
        }
    }

    draw(ctx, time) {
        ctx.save();
        ctx.globalAlpha = this.opacity;

        if (this.preset.twinkle) {
            ctx.globalAlpha *= 0.5 + Math.sin(time * 0.005 + this.wobbleOffset) * 0.5;
        }

        ctx.translate(this.x, this.y);

        if (this.rotation) {
            ctx.rotate(this.rotation);
        }

        if (this.preset.glow) {
            ctx.shadowBlur = this.preset.blur || 5;
            ctx.shadowColor = this.color;
        }

        ctx.fillStyle = this.color;

        if (this.preset.shape === 'line') {
            ctx.fillRect(-0.5, -this.preset.size.height / 2, 1, this.preset.size.height);
        } else if (this.preset.border) {
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

export class ParticleSystem {
    constructor(container, presetName = 'snow') {
        this.container = container;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.animationId = null;
        this.preset = PARTICLE_PRESETS[presetName] || PARTICLE_PRESETS.snow;

        this.setupCanvas();
        this.createParticles();
    }

    setupCanvas() {
        this.canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 5;
        `;
        this.container.appendChild(this.canvas);
        this.resize();

        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.preset.particles; i++) {
            this.particles.push(new Particle(this.canvas, this.preset));
        }
    }

    setPreset(presetName) {
        this.preset = PARTICLE_PRESETS[presetName] || PARTICLE_PRESETS.snow;
        this.createParticles();
    }

    start() {
        if (this.animationId) return;

        const animate = (time) => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.particles.forEach(p => {
                p.update(time);
                p.draw(this.ctx, time);
            });

            this.animationId = requestAnimationFrame(animate);
        };

        this.animationId = requestAnimationFrame(animate);
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    destroy() {
        this.stop();
        this.canvas.remove();
    }
}

/**
 * Generate particle effect for frontend
 */
export function generateParticleScript(sliderId, presetName) {
    if (presetName === 'none') return '';

    const preset = PARTICLE_PRESETS[presetName];
    if (!preset) return '';

    return `
        (function() {
            const container = document.querySelector('[data-lexslider="${sliderId}"]');
            if (!container) return;
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            let particles = [];
            
            canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:5;';
            container.appendChild(canvas);
            
            function resize() {
                canvas.width = container.offsetWidth;
                canvas.height = container.offsetHeight;
            }
            resize();
            window.addEventListener('resize', resize);
            
            // Create particles
            const preset = ${JSON.stringify(preset)};
            for (let i = 0; i < preset.particles; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: preset.size.min + Math.random() * (preset.size.max - preset.size.min),
                    speed: preset.speed.min + Math.random() * (preset.speed.max - preset.speed.min),
                    opacity: preset.opacity ? preset.opacity.min + Math.random() * (preset.opacity.max - preset.opacity.min) : 1,
                    wobble: Math.random() * Math.PI * 2
                });
            }
            
            function animate(time) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                particles.forEach(p => {
                    if (preset.direction === 'down') {
                        p.y += p.speed;
                        if (preset.wobble) p.x += Math.sin(time * 0.001 + p.wobble) * 0.5;
                        if (p.y > canvas.height + 10) { p.y = -10; p.x = Math.random() * canvas.width; }
                    } else if (preset.direction === 'up') {
                        p.y -= p.speed;
                        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
                    }
                    
                    ctx.globalAlpha = p.opacity;
                    if (preset.twinkle) ctx.globalAlpha *= 0.5 + Math.sin(time * 0.005 + p.wobble) * 0.5;
                    
                    ctx.fillStyle = preset.color || '#fff';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                });
                
                requestAnimationFrame(animate);
            }
            
            requestAnimationFrame(animate);
        })();
    `;
}

export function getParticleOptions() {
    return Object.entries(PARTICLE_PRESETS).map(([key, preset]) => ({
        value: key,
        label: preset.label
    }));
}

export default {
    PARTICLE_PRESETS,
    ParticleSystem,
    generateParticleScript,
    getParticleOptions
};

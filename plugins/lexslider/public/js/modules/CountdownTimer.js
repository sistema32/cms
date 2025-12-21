/**
 * CountdownTimer.js - Countdown timer layer
 * Promotional countdown timers for sliders
 */

// Timer presets
export const COUNTDOWN_STYLES = {
    minimal: {
        label: 'Minimal',
        separator: ':',
        showLabels: false,
        digitStyle: 'inline'
    },
    boxes: {
        label: 'Boxes',
        separator: '',
        showLabels: true,
        digitStyle: 'box'
    },
    circles: {
        label: 'Circles',
        separator: '',
        showLabels: true,
        digitStyle: 'circle'
    },
    flip: {
        label: 'Flip Clock',
        separator: '',
        showLabels: true,
        digitStyle: 'flip'
    },
    neon: {
        label: 'Neon',
        separator: ':',
        showLabels: false,
        digitStyle: 'neon'
    }
};

// Default configuration
const DEFAULT_CONFIG = {
    targetDate: null,           // Target date/time
    duration: null,             // Or duration in seconds
    style: 'boxes',
    showDays: true,
    showHours: true,
    showMinutes: true,
    showSeconds: true,
    labels: {
        days: 'Days',
        hours: 'Hours',
        minutes: 'Minutes',
        seconds: 'Seconds'
    },
    onComplete: null,           // Callback when timer ends
    hideOnComplete: false,
    showCompletedMessage: true,
    completedMessage: 'Time\'s up!',
    timezone: 'local'           // 'local' or 'UTC'
};

/**
 * Calculate remaining time
 */
export function calculateRemaining(targetDate, timezone = 'local') {
    const now = timezone === 'UTC' ? new Date().getTime() : Date.now();
    const target = new Date(targetDate).getTime();
    const diff = target - now;

    if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, completed: true };
    }

    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        total: diff,
        completed: false
    };
}

/**
 * Format number with leading zero
 */
function pad(num) {
    return String(num).padStart(2, '0');
}

/**
 * Create countdown layer
 */
export function createCountdownLayer(config = {}) {
    const settings = { ...DEFAULT_CONFIG, ...config };

    return {
        type: 'countdown',
        id: `countdown_${Date.now()}`,
        config: settings,
        style: {
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
        }
    };
}

/**
 * Generate countdown HTML
 */
export function generateCountdownHTML(config = {}) {
    const settings = { ...DEFAULT_CONFIG, ...config };
    const style = COUNTDOWN_STYLES[settings.style] || COUNTDOWN_STYLES.boxes;

    const units = [];
    if (settings.showDays) units.push({ key: 'days', label: settings.labels.days });
    if (settings.showHours) units.push({ key: 'hours', label: settings.labels.hours });
    if (settings.showMinutes) units.push({ key: 'minutes', label: settings.labels.minutes });
    if (settings.showSeconds) units.push({ key: 'seconds', label: settings.labels.seconds });

    const unitsHTML = units.map((unit, i) => `
        <div class="countdown-unit" data-unit="${unit.key}">
            <div class="countdown-value">
                <span class="countdown-digit" data-digit="0">0</span>
                <span class="countdown-digit" data-digit="1">0</span>
            </div>
            ${style.showLabels ? `<div class="countdown-label">${unit.label}</div>` : ''}
        </div>
        ${i < units.length - 1 && style.separator ? `<div class="countdown-separator">${style.separator}</div>` : ''}
    `).join('');

    return `
        <div class="ss3-countdown ss3-countdown-${settings.style}" 
             data-target="${settings.targetDate || ''}"
             data-duration="${settings.duration || ''}"
             data-timezone="${settings.timezone}">
            <div class="countdown-inner">
                ${unitsHTML}
            </div>
            <div class="countdown-completed" style="display: none;">
                ${settings.completedMessage}
            </div>
        </div>
    `;
}

/**
 * Generate countdown CSS
 */
export function generateCountdownCSS() {
    return `
        .ss3-countdown {
            display: inline-block;
            font-family: 'Inter', sans-serif;
        }
        
        .countdown-inner {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .countdown-unit {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .countdown-value {
            display: flex;
            gap: 2px;
        }
        
        .countdown-digit {
            font-size: 48px;
            font-weight: 700;
            font-variant-numeric: tabular-nums;
        }
        
        .countdown-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            opacity: 0.7;
            margin-top: 5px;
        }
        
        .countdown-separator {
            font-size: 48px;
            font-weight: 300;
            opacity: 0.5;
        }
        
        .countdown-completed {
            font-size: 24px;
            font-weight: 600;
        }
        
        /* Boxes style */
        .ss3-countdown-boxes .countdown-digit {
            background: rgba(255,255,255,0.1);
            padding: 15px 20px;
            border-radius: 8px;
            min-width: 60px;
            text-align: center;
        }
        
        /* Circles style */
        .ss3-countdown-circles .countdown-unit {
            position: relative;
        }
        
        .ss3-countdown-circles .countdown-value {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: rgba(255,255,255,0.1);
            border: 3px solid rgba(132,112,255,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .ss3-countdown-circles .countdown-digit {
            font-size: 28px;
        }
        
        /* Flip style */
        .ss3-countdown-flip .countdown-digit {
            background: linear-gradient(180deg, #222 50%, #1a1a1a 50%);
            padding: 20px 15px;
            border-radius: 6px;
            min-width: 50px;
            text-align: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            position: relative;
        }
        
        .ss3-countdown-flip .countdown-digit::after {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            top: 50%;
            height: 1px;
            background: rgba(0,0,0,0.3);
        }
        
        /* Neon style */
        .ss3-countdown-neon .countdown-digit {
            color: #0ff;
            text-shadow: 0 0 10px #0ff, 0 0 20px #0ff, 0 0 40px #0ff;
        }
        
        .ss3-countdown-neon .countdown-separator {
            color: #f0f;
            text-shadow: 0 0 10px #f0f, 0 0 20px #f0f;
        }
    `;
}

/**
 * Generate countdown script
 */
export function generateCountdownScript() {
    return `
        (function() {
            const countdowns = document.querySelectorAll('.ss3-countdown');
            
            countdowns.forEach(function(countdown) {
                const targetStr = countdown.dataset.target;
                const durationStr = countdown.dataset.duration;
                const timezone = countdown.dataset.timezone || 'local';
                
                let targetDate;
                if (targetStr) {
                    targetDate = new Date(targetStr).getTime();
                } else if (durationStr) {
                    targetDate = Date.now() + parseInt(durationStr) * 1000;
                } else {
                    return;
                }
                
                function update() {
                    const now = timezone === 'UTC' ? new Date().getTime() : Date.now();
                    const diff = targetDate - now;
                    
                    if (diff <= 0) {
                        countdown.querySelector('.countdown-inner').style.display = 'none';
                        countdown.querySelector('.countdown-completed').style.display = 'block';
                        countdown.dispatchEvent(new CustomEvent('countdown:complete'));
                        return;
                    }
                    
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                    
                    const values = { days, hours, minutes, seconds };
                    
                    Object.keys(values).forEach(function(key) {
                        const unit = countdown.querySelector('[data-unit="' + key + '"]');
                        if (unit) {
                            const digits = unit.querySelectorAll('.countdown-digit');
                            const val = String(values[key]).padStart(2, '0');
                            if (digits[0]) digits[0].textContent = val[0];
                            if (digits[1]) digits[1].textContent = val[1];
                        }
                    });
                    
                    requestAnimationFrame(update);
                }
                
                update();
            });
        })();
    `;
}

export default {
    COUNTDOWN_STYLES,
    calculateRemaining,
    createCountdownLayer,
    generateCountdownHTML,
    generateCountdownCSS,
    generateCountdownScript
};

/**
 * TypingEffect.js - Typewriter text animation
 * Animated typing effect for text layers
 */

// Typing presets
export const TYPING_PRESETS = {
    typewriter: {
        label: 'Typewriter',
        typingSpeed: 50,
        deleteSpeed: 30,
        cursor: '|',
        cursorBlink: true
    },
    terminal: {
        label: 'Terminal',
        typingSpeed: 30,
        deleteSpeed: 20,
        cursor: '█',
        cursorBlink: true,
        prefix: '> '
    },
    slow: {
        label: 'Slow & Dramatic',
        typingSpeed: 150,
        deleteSpeed: 50,
        cursor: '_',
        cursorBlink: true
    },
    instant: {
        label: 'Word by Word',
        typingSpeed: 0,
        deleteSpeed: 0,
        wordByWord: true,
        wordDelay: 200
    },
    glitch: {
        label: 'Glitch',
        typingSpeed: 20,
        glitch: true,
        glitchChars: '!@#$%^&*'
    }
};

// Default configuration
const DEFAULT_CONFIG = {
    text: '',
    texts: [],                  // Array for multiple texts (loop through)
    preset: 'typewriter',
    typingSpeed: 50,            // ms per character
    deleteSpeed: 30,            // ms per character when deleting
    startDelay: 500,            // Delay before starting
    pauseAfterTyping: 2000,     // Pause after typing complete
    loop: true,                 // Loop through texts
    cursor: '|',
    cursorBlink: true,
    cursorBlinkSpeed: 500,
    showCursor: true,
    deleteOnLoop: true,         // Delete text before next
    wordByWord: false,          // Type word by word instead of char
    wordDelay: 200,
    onComplete: null
};

/**
 * TypingEffect class
 */
export class TypingEffect {
    constructor(element, config = {}) {
        this.element = element;
        this.config = { ...DEFAULT_CONFIG, ...config };

        // Apply preset
        if (this.config.preset && TYPING_PRESETS[this.config.preset]) {
            this.config = { ...this.config, ...TYPING_PRESETS[this.config.preset] };
        }

        this.texts = this.config.texts.length > 0 ? this.config.texts : [this.config.text];
        this.currentTextIndex = 0;
        this.currentCharIndex = 0;
        this.isDeleting = false;
        this.isRunning = false;

        this.init();
    }

    init() {
        // Create structure
        this.textEl = document.createElement('span');
        this.textEl.className = 'typing-text';

        this.cursorEl = document.createElement('span');
        this.cursorEl.className = 'typing-cursor';
        this.cursorEl.textContent = this.config.cursor;

        if (this.config.cursorBlink) {
            this.cursorEl.classList.add('blink');
            this.cursorEl.style.animationDuration = `${this.config.cursorBlinkSpeed}ms`;
        }

        this.element.innerHTML = '';
        if (this.config.prefix) {
            const prefix = document.createElement('span');
            prefix.className = 'typing-prefix';
            prefix.textContent = this.config.prefix;
            this.element.appendChild(prefix);
        }
        this.element.appendChild(this.textEl);
        if (this.config.showCursor) {
            this.element.appendChild(this.cursorEl);
        }
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;

        setTimeout(() => this.type(), this.config.startDelay);
    }

    stop() {
        this.isRunning = false;
    }

    type() {
        if (!this.isRunning) return;

        const currentText = this.texts[this.currentTextIndex];

        if (this.config.wordByWord) {
            this.typeWordByWord(currentText);
        } else {
            this.typeCharByChar(currentText);
        }
    }

    typeCharByChar(text) {
        if (!this.isRunning) return;

        if (this.isDeleting) {
            // Deleting
            this.currentCharIndex--;
            this.textEl.textContent = text.substring(0, this.currentCharIndex);

            if (this.currentCharIndex === 0) {
                this.isDeleting = false;
                this.currentTextIndex = (this.currentTextIndex + 1) % this.texts.length;
                setTimeout(() => this.type(), this.config.startDelay);
            } else {
                setTimeout(() => this.type(), this.config.deleteSpeed);
            }
        } else {
            // Typing
            this.currentCharIndex++;

            if (this.config.glitch) {
                // Show random char first, then correct
                const randomChar = this.config.glitchChars[Math.floor(Math.random() * this.config.glitchChars.length)];
                this.textEl.textContent = text.substring(0, this.currentCharIndex - 1) + randomChar;
                setTimeout(() => {
                    this.textEl.textContent = text.substring(0, this.currentCharIndex);
                }, this.config.typingSpeed / 2);
            } else {
                this.textEl.textContent = text.substring(0, this.currentCharIndex);
            }

            if (this.currentCharIndex === text.length) {
                // Finished typing
                if (this.config.loop && this.texts.length > 1) {
                    setTimeout(() => {
                        if (this.config.deleteOnLoop) {
                            this.isDeleting = true;
                            this.type();
                        } else {
                            this.currentCharIndex = 0;
                            this.currentTextIndex = (this.currentTextIndex + 1) % this.texts.length;
                            this.textEl.textContent = '';
                            this.type();
                        }
                    }, this.config.pauseAfterTyping);
                } else if (this.config.onComplete) {
                    this.config.onComplete();
                }
            } else {
                setTimeout(() => this.type(), this.config.typingSpeed);
            }
        }
    }

    typeWordByWord(text) {
        if (!this.isRunning) return;

        const words = text.split(' ');

        if (this.currentCharIndex < words.length) {
            this.textEl.textContent = words.slice(0, this.currentCharIndex + 1).join(' ');
            this.currentCharIndex++;
            setTimeout(() => this.type(), this.config.wordDelay);
        } else {
            // Finished
            if (this.config.loop && this.texts.length > 1) {
                setTimeout(() => {
                    this.currentCharIndex = 0;
                    this.currentTextIndex = (this.currentTextIndex + 1) % this.texts.length;
                    this.textEl.textContent = '';
                    this.type();
                }, this.config.pauseAfterTyping);
            }
        }
    }

    reset() {
        this.currentTextIndex = 0;
        this.currentCharIndex = 0;
        this.isDeleting = false;
        this.textEl.textContent = '';
    }
}

/**
 * Create typing layer
 */
export function createTypingLayer(config = {}) {
    return {
        type: 'typing',
        id: `typing_${Date.now()}`,
        config: { ...DEFAULT_CONFIG, ...config }
    };
}

/**
 * Generate typing HTML
 */
export function generateTypingHTML(config = {}) {
    const settings = { ...DEFAULT_CONFIG, ...config };

    return `
        <div class="ss3-typing" 
             data-texts='${JSON.stringify(settings.texts.length > 0 ? settings.texts : [settings.text])}'
             data-preset="${settings.preset}"
             data-loop="${settings.loop}"
             data-cursor="${settings.cursor}"
             data-typing-speed="${settings.typingSpeed}"
             data-delete-speed="${settings.deleteSpeed}">
        </div>
    `;
}

/**
 * Generate typing CSS
 */
export function generateTypingCSS() {
    return `
        .ss3-typing {
            display: inline-block;
            font-family: inherit;
        }
        
        .typing-text {
            display: inline;
        }
        
        .typing-prefix {
            opacity: 0.7;
        }
        
        .typing-cursor {
            display: inline-block;
            margin-left: 2px;
        }
        
        .typing-cursor.blink {
            animation: cursorBlink 1s step-end infinite;
        }
        
        @keyframes cursorBlink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }
        
        /* Terminal style */
        .ss3-typing[data-preset="terminal"] {
            font-family: 'Courier New', monospace;
            background: #1a1a1a;
            padding: 10px 15px;
            border-radius: 6px;
            color: #0f0;
        }
        
        /* Glitch style */
        .ss3-typing[data-preset="glitch"] .typing-text {
            text-shadow: 2px 0 #f0f, -2px 0 #0ff;
        }
    `;
}

/**
 * Generate typing script
 */
export function generateTypingScript() {
    return `
        (function() {
            const presets = ${JSON.stringify(TYPING_PRESETS)};
            
            document.querySelectorAll('.ss3-typing').forEach(function(el) {
                const texts = JSON.parse(el.dataset.texts || '[]');
                const preset = el.dataset.preset || 'typewriter';
                const config = Object.assign({}, presets[preset] || {}, {
                    texts: texts,
                    loop: el.dataset.loop !== 'false',
                    cursor: el.dataset.cursor || '|',
                    typingSpeed: parseInt(el.dataset.typingSpeed) || 50,
                    deleteSpeed: parseInt(el.dataset.deleteSpeed) || 30
                });
                
                // Create elements
                const textEl = document.createElement('span');
                textEl.className = 'typing-text';
                
                const cursorEl = document.createElement('span');
                cursorEl.className = 'typing-cursor blink';
                cursorEl.textContent = config.cursor;
                
                el.innerHTML = '';
                if (config.prefix) {
                    const prefix = document.createElement('span');
                    prefix.className = 'typing-prefix';
                    prefix.textContent = config.prefix;
                    el.appendChild(prefix);
                }
                el.appendChild(textEl);
                el.appendChild(cursorEl);
                
                // Type logic
                let textIndex = 0;
                let charIndex = 0;
                let isDeleting = false;
                
                function type() {
                    const currentText = texts[textIndex] || '';
                    
                    if (isDeleting) {
                        charIndex--;
                        textEl.textContent = currentText.substring(0, charIndex);
                        
                        if (charIndex === 0) {
                            isDeleting = false;
                            textIndex = (textIndex + 1) % texts.length;
                            setTimeout(type, 500);
                        } else {
                            setTimeout(type, config.deleteSpeed);
                        }
                    } else {
                        charIndex++;
                        textEl.textContent = currentText.substring(0, charIndex);
                        
                        if (charIndex === currentText.length) {
                            if (config.loop && texts.length > 1) {
                                setTimeout(function() {
                                    isDeleting = true;
                                    type();
                                }, 2000);
                            }
                        } else {
                            setTimeout(type, config.typingSpeed);
                        }
                    }
                }
                
                // Start after delay
                setTimeout(type, 500);
            });
        })();
    `;
}

export default {
    TYPING_PRESETS,
    TypingEffect,
    createTypingLayer,
    generateTypingHTML,
    generateTypingCSS,
    generateTypingScript
};

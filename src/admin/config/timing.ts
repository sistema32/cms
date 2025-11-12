/**
 * Admin Panel Timing Constants
 * Centralized timing values for animations, polling, and delays
 */

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATION_DURATION = {
  FAST: 150,        // Quick transitions (hover effects, etc.)
  DEFAULT: 300,     // Standard animations
  SLOW: 500,        // Slower animations
  TOAST_SLIDE: 300, // Toast notification slide animation
} as const;

/**
 * Toast notification settings
 */
export const TOAST_TIMING = {
  DEFAULT_DURATION: 5000,  // 5 seconds
  ERROR_DURATION: 7000,    // 7 seconds for errors
  SUCCESS_DURATION: 3000,  // 3 seconds for success
  NO_AUTO_DISMISS: 0,      // Don't auto-dismiss
} as const;

/**
 * Polling intervals (in milliseconds)
 */
export const POLLING_INTERVAL = {
  FAST: 5000,       // 5 seconds (real-time updates)
  DEFAULT: 30000,   // 30 seconds (notifications, etc.)
  SLOW: 60000,      // 1 minute (background jobs)
  VERY_SLOW: 300000, // 5 minutes (analytics, etc.)
} as const;

/**
 * Debounce delays (in milliseconds)
 */
export const DEBOUNCE_DELAY = {
  SEARCH: 300,      // Search input debounce
  INPUT: 500,       // General input debounce
  RESIZE: 200,      // Window resize debounce
} as const;

/**
 * Timeout values (in milliseconds)
 */
export const TIMEOUT = {
  API_REQUEST: 30000,      // 30 seconds for API requests
  FILE_UPLOAD: 120000,     // 2 minutes for file uploads
  LONG_OPERATION: 300000,  // 5 minutes for long operations
} as const;

/**
 * Auto-save settings
 */
export const AUTO_SAVE = {
  INTERVAL: 30000,         // Auto-save every 30 seconds
  DEBOUNCE: 2000,          // Wait 2 seconds after last keystroke
} as const;

/**
 * Session timeout
 */
export const SESSION = {
  IDLE_WARNING: 1740000,   // 29 minutes (warn before timeout)
  IDLE_TIMEOUT: 1800000,   // 30 minutes (auto-logout)
  KEEP_ALIVE: 300000,      // 5 minutes (keep-alive ping)
} as const;

/**
 * Loading states
 */
export const LOADING = {
  SKELETON_MIN: 500,       // Minimum time to show skeleton (avoid flash)
  SPINNER_DELAY: 200,      // Delay before showing spinner (avoid flash)
} as const;

/**
 * Validation delays
 */
export const VALIDATION = {
  TWO_FA_CODE_LENGTH: 6,   // 2FA code length
  PASSWORD_MIN_LENGTH: 8,  // Minimum password length
  SLUG_DEBOUNCE: 500,      // Slug generation debounce
} as const;

export default {
  ANIMATION_DURATION,
  TOAST_TIMING,
  POLLING_INTERVAL,
  DEBOUNCE_DELAY,
  TIMEOUT,
  AUTO_SAVE,
  SESSION,
  LOADING,
  VALIDATION,
} as const;

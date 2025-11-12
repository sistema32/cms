/**
 * Admin Panel Color Configuration
 * Centralized color palette for consistent theming
 */

/**
 * Mosaic Design System - Primary Colors
 * Violet/Purple palette used throughout the admin panel
 */
export const MOSAIC_COLORS = {
  violet: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8470ff',  // Primary brand color
    600: '#755ff8',  // Primary brand dark
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },
} as const;

/**
 * XOYA Design System - Alternative Palette
 * Coral and Navy colors for XOYA-themed components
 */
export const XOYA_COLORS = {
  coral: {
    50: '#FFF5F3',
    100: '#FFE5E0',
    500: '#FF7F5C',
    600: '#FF6347',
  },
  navy: {
    500: '#2D3561',
    600: '#1F2847',
  },
  background: '#FFF8F5',
} as const;

/**
 * Primary color aliases for easy reference
 */
export const PRIMARY_COLORS = {
  light: MOSAIC_COLORS.violet[500],
  dark: MOSAIC_COLORS.violet[600],
  hover: MOSAIC_COLORS.violet[700],
} as const;

/**
 * CSS Variable mappings
 * Use these to inject into :root or component styles
 */
export const CSS_VARIABLES = {
  '--violet-500': MOSAIC_COLORS.violet[500],
  '--violet-600': MOSAIC_COLORS.violet[600],
  '--coral-500': XOYA_COLORS.coral[500],
  '--coral-600': XOYA_COLORS.coral[600],
  '--navy-500': XOYA_COLORS.navy[500],
  '--navy-600': XOYA_COLORS.navy[600],
} as const;

/**
 * Tailwind color class mappings
 * For use in className attributes
 */
export const TAILWIND_CLASSES = {
  primary: {
    bg: 'bg-violet-500',
    bgHover: 'hover:bg-violet-700',
    text: 'text-violet-500',
    border: 'border-violet-500',
  },
  coral: {
    bg: 'bg-coral-500',
    text: 'text-coral-500',
    border: 'border-coral-500',
  },
} as const;

export default MOSAIC_COLORS;

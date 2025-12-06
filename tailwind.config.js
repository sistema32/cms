/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/themes/**/*.{tsx,ts,html}",
    "./src/routes/frontend.ts",
    "./src/admin/**/*.{js,tsx,ts,html}",
    "./src/routes/admin.ts",
    "./plugins/lexslider/**/*.{js,ts,html,css}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
        // Mosaic violet colors
        violet: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8470ff', // Primary Mosaic color
          600: '#755ff8',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
      },
      boxShadow: {
        'xs': '0 0 0 1px rgba(0, 0, 0, 0.05)',
        'outline-purple': '0 0 0 3px rgba(147, 51, 234, 0.5)',
        'outline-gray': '0 0 0 3px rgba(107, 114, 128, 0.5)',
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
  // DaisyUI config
  daisyui: {
    themes: [
      {
        light: {
          primary: '#8470ff', // Mosaic violet
          'primary-focus': '#755ff8',
          'primary-content': '#ffffff',
        },
        dark: {
          primary: '#8470ff',
          'primary-focus': '#755ff8',
          'primary-content': '#ffffff',
        },
      },
    ],
    darkTheme: 'dark',
    base: true,
    styled: true,
    utils: true,
    logs: false,
  },
}

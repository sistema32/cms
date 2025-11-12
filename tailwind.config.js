/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/themes/**/*.{tsx,ts,html}",
    "./src/routes/frontend.ts",
    "./src/admin/**/*.{tsx,ts,html}",
    "./src/routes/admin.ts",
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
      },
      boxShadow: {
        'xs': '0 0 0 1px rgba(0, 0, 0, 0.05)',
        'outline-purple': '0 0 0 3px rgba(147, 51, 234, 0.5)',
        'outline-gray': '0 0 0 3px rgba(107, 114, 128, 0.5)',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ["light", "dark", "cupcake"],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
  },
}

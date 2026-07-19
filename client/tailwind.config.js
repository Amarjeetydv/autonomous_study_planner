/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#dbe3ff',
          300: '#bfcbff',
          400: '#9ba9ff',
          500: '#6d7bff',
          600: '#545eff',
          700: '#3f47e6',
          800: '#343aba',
          900: '#2b3096',
        }
      }
    },
  },
  plugins: [],
}

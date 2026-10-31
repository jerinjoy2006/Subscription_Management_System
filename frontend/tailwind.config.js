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
          50: '#f0f5ff',
          100: '#e0ebff',
          200: '#c7d9fe',
          300: '#a3c0fd',
          400: '#799dfb',
          500: '#4f75f6',
          600: '#3855ea',
          700: '#2c40cf',
          800: '#2836a7',
          900: '#253184',
        }
      }
    },
  },
  plugins: [],
}


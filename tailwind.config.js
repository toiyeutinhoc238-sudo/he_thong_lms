/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hcmue: {
          50: '#f0f7fc',
          100: '#e1eef9',
          200: '#c2ddf3',
          300: '#92c3eb',
          400: '#5ca2e0',
          500: '#3482d3',
          600: '#2165b7',
          700: '#1b5195',
          800: '#004080',
          900: '#002b59',
          950: '#001c3d',
        },
        brand: {
          red: '#c92a2a',
          gold: '#f59f00',
          green: '#2b8a3e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}


/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          500: '#2563eb',
          600: '#1d4ed8'
        }
      }
    },
  },
  plugins: [],
}


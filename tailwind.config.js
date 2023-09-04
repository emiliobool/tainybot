// tailwind.config.js
const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  purge: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  content: [
    "./index.html",
    "./src/**/*.{.vue,js,ts,jsx,tsx}",
  ],
  // darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        primary: '#48bb78', // A cool green color for a technological feel
        secondary: '#f6e05e', // A bright yellow color for a playful touch
        tertiary: '#1a202c', // A dark blue color for a modern and sleek feel
        background: '#f2f2f2', // A light gray color for a neat and clean background
        text: '#4a5568', // A medium gray color for text that is easy to read
        row1: '#2C3E50',
        row1name: '#E0E0E0',
        row1text: '#E0E0E0',
        row2: '#27AE60',
        row2name: '#E0E0E0',
        row2text: '#FFF',
      },
      fontFamily: {
        sans: ['Inter var', ...defaultTheme.fontFamily.sans],
      }
    }
  },
  variants: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
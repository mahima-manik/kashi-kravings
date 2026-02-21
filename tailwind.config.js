/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          olive: '#8B7D3C',
          gold: '#A69A5B',
          cream: '#F5E6C8',
          ivory: '#FAF3E6',
        },
        surface: {
          primary: 'var(--surface-primary)',
          card: 'var(--surface-card)',
          'card-hover': 'var(--surface-card-hover)',
          border: 'var(--surface-border)',
          'border-light': 'var(--surface-border-light)',
        },
        chocolate: {
          50: '#faf5f2',
          100: '#f3e8e0',
          200: '#e6cfc0',
          300: '#d6ae97',
          400: '#c4886c',
          500: '#b86d4f',
          600: '#aa5b42',
          700: '#8e4838',
          800: '#743c32',
          900: '#5f332b',
          950: '#331915',
        },
      },
    },
  },
  plugins: [],
};

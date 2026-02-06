/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf4f3',
          100: '#fce7e4',
          200: '#fad3cd',
          300: '#f5b3aa',
          400: '#ed8678',
          500: '#e15f4e',
          600: '#cd4331',
          700: '#ac3526',
          800: '#8e2f23',
          900: '#762c23',
          950: '#40130e',
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
}

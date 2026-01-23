/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          900: '#020617',
          800: '#02081f',
          700: '#0b1220',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}


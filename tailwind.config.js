/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      colors: {
        bio: {
          deep: '#05100dff',   // Deep Forest Green (Background Principal)
          purple: '#7B8DFF', // Digital Lavender (Destaque Secundário)
          teal: '#00D68F',   // Vibrant Teal (Ações / Blocos Informativos)
          lime: '#D4FF33',   // Acid Lime (Highlights / Ícones)
          white: '#F5F7F2',  // Off-white para textos em fundos escuros
        },
      },
      backgroundImage: {
        'cross-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20h-4v-4h4v4zm0 0h4v-4h-4v4zm0 0h-4v4h4v-4zm0 0h4v4h-4v-4z' fill='%23D4FF33' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E\")",
      },
      letterSpacing: {
        'geometric': '0.1em',
        'wide': '0.05em',
      },
      lineHeight: {
        'relaxed-geo': '1.75',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}


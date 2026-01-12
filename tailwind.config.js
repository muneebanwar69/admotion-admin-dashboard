/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'system-ui', 'ui-sans-serif', 'Arial'],
      },
      colors: {
        brand: {
          900: '#0B1452', /* sidebar/header deep navy */
          800: '#111b68',
          700: '#152071',
          600: '#1b2b8b',
        },
        card: '#1c2373',
        accent: {
          blue: '#3b82f6',
          orange: '#f59e0b',
          purple: '#8b5cf6',
          teal: '#14b8a6'
        }
      },
      boxShadow: {
        kpi: '0 6px 18px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        xl2: '1rem',
      }
    }
  },
  plugins: [],
}

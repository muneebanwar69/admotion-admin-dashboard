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
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in-left': 'fadeInLeft 0.6s ease-out forwards',
        'fade-in-right': 'fadeInRight 0.6s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
        'gradient': 'gradient-shift 3s ease infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      }
    }
  },
  plugins: [],
}

export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'soft-lg': '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        'soft-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      colors: {
        brand: {
          50: '#FDF7F2',
          100: '#FBECE1',
          200: '#F6D9C3',
          300: '#F1C5A5',
          400: '#ECB287',
          500: '#D4A373', // Main Brownish Orange
          600: '#C08D5B',
          700: '#8E6743',
          800: '#5E442D',
          900: '#2F2216',
          950: '#17110B',
        },
        wood: {
          100: '#E6DCCF',
          200: '#CDBCA1',
          300: '#B49E73',
          400: '#9B8144',
          500: '#7F6B38',
          600: '#65542C',
          700: '#4E4022',
          800: '#392E19',
          900: '#261F12',
          950: '#141009',
        },
        accent: {
          gold: '#D4A373'
        },
        surface: {
          100: '#F4F4F5', // Secondary background
          200: '#E4E4E7', // Borders
          300: '#D4D4D8',
          400: '#A1A1AA', // Muted text
          500: '#71717A',
          600: '#52525B', // Secondary text
          700: '#3F3F46',
          800: '#27272A',
          900: '#18181B', // Primary text
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
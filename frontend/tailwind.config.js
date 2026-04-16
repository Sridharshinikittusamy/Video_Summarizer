export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50: '#FDF8F3',
          100: '#FBECE1',
          200: '#F6D9C0',
          300: '#F0C29F',
          400: '#EAB07E',
          500: '#D4A373', // Primary brand color (Brownish Orange)
          600: '#B88B5D',
          700: '#9B7348',
          800: '#7E5A35',
          900: '#614324',
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
          50: '#FAFAFA', // Primary background
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
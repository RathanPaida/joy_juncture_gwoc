/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          500: '#ff8c00', // JoyJuncture orange
          600: '#e67e00',
          700: '#cc7000',
        },
        gray: {
          900: '#0f0f0f',
          800: '#1a1a1a',
          700: '#2d2d2d',
        }
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
        'gradient-orange': 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 140, 0, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 140, 0, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
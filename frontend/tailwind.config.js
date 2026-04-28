/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Outfit"', '"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae2fd',
          300: '#7cc8fb',
          400: '#38a9f8',
          500: '#0e8ceb',
          600: '#026ec5',
          700: '#0358a0',
          800: '#074a83',
          900: '#0c3f6d',
          950: '#082849',
        },
        slate: {
          900: '#0f172a',
          950: '#020617',
        },
        void: '#020617', // Alias for bg-void support
        // Premium accents
        accent: {
          cyan: '#22d3ee',
          blue: '#3b82f6',
          purple: '#a855f7',
          pink: '#ec4899',
          green: '#10b981',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-gradient': 'radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.15) 0, transparent 50%), radial-gradient(at 50% 0%, rgba(168, 85, 247, 0.15) 0, transparent 50%), radial-gradient(at 100% 0%, rgba(34, 211, 238, 0.15) 0, transparent 50%)',
      },
      animation: {
        'slow-drift': 'drift 20s ease-in-out infinite',
        'slow-spin': 'spin 30s linear infinite',
        'pulse-subtle': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(40px, -60px) scale(1.1)' },
          '66%': { transform: 'translate(-30px, 40px) scale(0.95)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      },
      boxShadow: {
        'premium': '0 0 50px -12px rgba(0, 0, 0, 0.5)',
        'glow-blue': '0 0 20px -5px rgba(59, 130, 246, 0.5)',
        'glow-cyan': '0 0 20px -5px rgba(34, 211, 238, 0.5)',
      }
    },
  },
  plugins: [],
}
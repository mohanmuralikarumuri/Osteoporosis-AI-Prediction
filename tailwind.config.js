/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        surface: {
          DEFAULT: '#0f0f1a',
          card:    '#16162a',
          border:  '#2a2a4a',
          hover:   '#1e1e38',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'ui-monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow':  'spin 8s linear infinite',
        'ping-slow':  'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'scan':       'scan 2s ease-in-out infinite',
        'glow':       'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(0%)',   opacity: '1' },
          '50%':      { transform: 'translateY(100%)', opacity: '0.4' },
        },
        glow: {
          from: { boxShadow: '0 0 5px #6366f1, 0 0 10px #6366f1' },
          to:   { boxShadow: '0 0 20px #6366f1, 0 0 40px #6366f1' },
        },
      },
      boxShadow: {
        'glow-sm':  '0 0 8px rgba(99,102,241,0.4)',
        'glow-md':  '0 0 20px rgba(99,102,241,0.5)',
        'glow-lg':  '0 0 40px rgba(99,102,241,0.6)',
        'glow-red': '0 0 20px rgba(239,68,68,0.5)',
      },
    },
  },
  plugins: [],
}

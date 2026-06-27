/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        white: 'var(--color-white)',
        slate: {
          100: 'var(--color-slate-100)',
          200: 'var(--color-slate-200)',
          300: 'var(--color-slate-300)',
          400: 'var(--color-slate-400)',
          500: 'var(--color-slate-500)',
          600: 'var(--color-slate-600)',
        },
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#38aaf7',
          500: '#0e8fe5',
          600: '#0270be',
          700: '#035a9a',
          800: '#074c80',
          900: '#0c406b',
          950: '#082949',
        },
        kiosk: {
          dark: 'var(--color-kiosk-dark)',
          navy: 'var(--color-kiosk-navy)',
          accent: 'var(--color-kiosk-accent)',
          teal: 'var(--color-kiosk-teal)',
          mint: 'var(--color-kiosk-mint)',
          gold: 'var(--color-kiosk-gold)',
          crimson: 'var(--color-kiosk-crimson)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'kiosk-depth': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        'kiosk-glow': '0 0 20px rgba(13, 245, 227, 0.35)',
      },
    },
  },
  plugins: [],
}

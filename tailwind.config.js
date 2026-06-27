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
          dark: '#0a0f1d',
          navy: '#151e36',
          accent: '#233256',
          teal: '#0df5e3',
          mint: '#10b981',
          gold: '#eab308',
          crimson: '#ef4444',
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

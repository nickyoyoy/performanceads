/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        scentplus: {
          navy: '#0B192C',
          slate: '#1E3E62',
          orange: '#FF6500',
          dark: '#000000',
          primary: '#1E40AF', // Enterprise navy-blue
          primaryHover: '#1D4ED8',
          surface: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}


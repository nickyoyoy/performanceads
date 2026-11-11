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
          forest: '#133326',
          forestDark: '#0D261B',
          forestLight: '#1E4A38',
          mint: '#A7E97F',
          mintHover: '#95DF69',
          mintSoft: '#E5F8D8',
          sageBg: '#ECF2EB',
          canvas: '#F6F9F5',
          sageHeader: '#EAF2E8',
          sageBorder: '#E2EBE0',
          navy: '#133326',
          slate: '#1E4A38',
          orange: '#FF6500',
          dark: '#0D1F17',
          primary: '#133326',
          primaryHover: '#1E4A38',
          surface: '#F6F9F5',
          card: '#FFFFFF',
          border: '#E2EBE0',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Courier New', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        '3xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(19, 51, 38, 0.04)',
        'card': '0 4px 20px -2px rgba(19, 51, 38, 0.05), 0 1px 3px 0 rgba(19, 51, 38, 0.03)',
        'card-hover': '0 10px 25px -4px rgba(19, 51, 38, 0.08), 0 2px 6px -1px rgba(19, 51, 38, 0.04)',
      }
    },
  },
  plugins: [],
}

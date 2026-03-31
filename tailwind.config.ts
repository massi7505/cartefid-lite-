import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // New dark theme
        'app-bg':      '#0D0D0D',
        'app-card':    '#141414',
        'app-card2':   '#1C1C1C',
        'app-sidebar': '#111111',
        // Lime accent
        lime:          '#CCFF00',
        'lime-dim':    '#A8D400',
        'lime-muted':  'rgba(204,255,0,0.12)',
        'lime-border': 'rgba(204,255,0,0.25)',
        // Purple for rewards
        'violet':      '#7B2FBE',
        'violet-muted':'rgba(123,47,190,0.2)',
        // Legacy (kept for admin)
        primary:       { DEFAULT: '#111827', light: '#374151' },
        accent: { DEFAULT: '#6366f1', dark: '#4f46e5' },
        'dark-bg':     '#0D0D0D',
        'dark-card':   '#141414',
        'dark-card2':  '#1C1C1C',
        'accent-green':'#CCFF00',
        'accent-green-dark': '#A8D400',
      },
      animation: {
        'stamp-pop':  'stampPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
        'slide-up':   'slideUp 0.35s ease-out both',
        'confetti':   'confettiBounce 0.6s ease-out forwards',
        'fade-in':    'fadeIn 0.3s ease-out both',
      },
      keyframes: {
        stampPop: {
          '0%':   { transform: 'scale(0)', opacity: '0' },
          '70%':  { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        confettiBounce: {
          '0%, 100%': { transform: 'scale(1) rotate(0deg)' },
          '25%':      { transform: 'scale(1.2) rotate(-5deg)' },
          '75%':      { transform: 'scale(1.2) rotate(5deg)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config

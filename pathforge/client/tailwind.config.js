/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],

  // Class-based dark mode so we can toggle it programmatically
  darkMode: 'class',

  theme: {
    extend: {
      /**
       * PathForge Design System Colors (from Section 3)
       * 
       * Purple = brand voice
       * White/primary-50 = canvas
       * Gold = ONLY for gamification (XP, streaks, badges) — feels like a reward
       * Teal = success/complete states
       * Rose = errors and warnings ONLY
       */
      colors: {
        primary: {
          50: '#F5F3FF',   // Page background, subtle sections
          100: '#EDE9FE',  // Hover states, light chips
          300: '#C4B5FD',  // Borders, disabled states
          500: '#8B5CF6',  // Secondary buttons, links
          600: '#7C3AED',  // Primary buttons, active nav, brand accent
          700: '#6D28D9',  // Button hover/pressed states
          900: '#3B0764',  // Headings, dark mode surface
        },
        accent: {
          gold: '#F5B301',  // XP, streaks, badges — gamification only
          teal: '#14B8A6',  // Success, completed checkmarks
          rose: '#F43F5E',  // Errors, destructive actions
        },
        surface: {
          white: '#FFFFFF',
          dark: '#1E1B2E',   // slate-900 equivalent
          muted: '#6B7280',  // slate-500 equivalent
        },
      },

      /**
       * Typography
       * Sora for headings (distinctive), Inter for everything else (readable)
       */
      fontFamily: {
        heading: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },

      /**
       * Type scale: 1.25 ratio (Major Third)
       * Base: 1rem (16px)
       */
      fontSize: {
        xs: ['0.8rem', { lineHeight: '1.2rem' }],
        sm: ['0.875rem', { lineHeight: '1.35rem' }],
        base: ['1rem', { lineHeight: '1.6rem' }],
        lg: ['1.25rem', { lineHeight: '1.85rem' }],
        xl: ['1.563rem', { lineHeight: '2.1rem' }],
        '2xl': ['1.953rem', { lineHeight: '2.4rem' }],
        '3xl': ['2.441rem', { lineHeight: '2.9rem' }],
        '4xl': ['3.052rem', { lineHeight: '3.5rem' }],
      },

      /**
       * Consistent border-radius presets
       */
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
      },

      /**
       * Soft shadows — never heavy drop shadows
       */
      boxShadow: {
        soft: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        glow: '0 0 20px rgba(139, 92, 246, 0.15)',
      },

      /**
       * Animation for gamification micro-interactions
       */
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-left': 'slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245, 179, 1, 0)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(245, 179, 1, 0.3)' },
        },
      },
    },
  },

  plugins: [
    require('@tailwindcss/forms'),
  ],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Near-black neutrals with a cool cast. 950 is the page, 900 the surface.
        ink: {
          50: '#f4f5f7',
          100: '#e3e5ea',
          200: '#c3c7d1',
          300: '#9298a7',
          400: '#646b7d',
          500: '#454b5a',
          600: '#2f3441',
          700: '#22262f',
          800: '#171a21',
          900: '#101217',
          950: '#0a0b0f',
        },
        // Single signal colour: acid lime. Used for the active state and nothing else.
        signal: {
          200: '#e8ffb0',
          300: '#d6fb6e',
          400: '#c3f53c',
          500: '#a8e01f',
          600: '#85b514',
          700: '#628512',
        },
        heat: '#ff7a45',
        cool: '#4cc8ff',
      },
      fontFamily: {
        sans: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Fluid display sizes so headings scale without breakpoint jumps.
        display: ['clamp(1.75rem, 1.2rem + 2.2vw, 2.75rem)', { lineHeight: '1.04', letterSpacing: '-0.03em' }],
        title: ['clamp(1.25rem, 1.05rem + 0.8vw, 1.6rem)', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        readout: ['clamp(2rem, 1.3rem + 3vw, 3.5rem)', { lineHeight: '0.95', letterSpacing: '-0.04em' }],
      },
      borderRadius: {
        card: '18px',
      },
      boxShadow: {
        lift: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 18px 40px -24px rgba(0,0,0,0.9)',
        glow: '0 0 0 1px rgba(195,245,60,0.35), 0 10px 40px -12px rgba(195,245,60,0.25)',
      },
      backgroundImage: {
        grain:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};

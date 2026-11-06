/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Warm charcoal neutrals — think rubber gym floor and chalk, not a
        // blue-black IDE. 50 is bone-white text, 950 the page.
        ink: {
          50: '#f4efe6',
          100: '#e6dfd2',
          200: '#c9bfae',
          300: '#a19584',
          400: '#7c7163',
          500: '#5a5146',
          600: '#3e372f',
          700: '#2c2722',
          800: '#201c18',
          900: '#181512',
          950: '#110f0d',
        },
        // Single signal colour: persimmon / ember. Active state and primary action only.
        signal: {
          200: '#ffd9c4',
          300: '#ffb38c',
          400: '#f4824f',
          500: '#e2653a',
          600: '#b94c26',
          700: '#8c391d',
        },
        heat: '#e8b04b',
        cool: '#9bb89a',
      },
      fontFamily: {
        sans: ['Archivo', 'system-ui', 'sans-serif'],
        display: ['Archivo', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
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
        glow: '0 0 0 1px rgba(244,130,79,0.4), 0 10px 40px -12px rgba(244,130,79,0.35)',
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
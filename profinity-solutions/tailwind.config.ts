import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette (dark theme only)
        base: '#050914',
        surface: { DEFAULT: '#0a1226', 2: '#0e1a33' },
        navy: { 900: '#0b1f4d', 800: '#123166', 600: '#2159c9' },
        brand: {
          blue: '#3b82f6',
          light: '#7dd3fc',
          light2: '#a8e2fd',
          glow: '#38bdf8',
        },
        // shadcn-style tokens (used by the 21st.dev components).
        // Text tokens use channel triplets + <alpha-value> so `/opacity`
        // utilities (text-foreground/85, text-muted-foreground/70) stay valid.
        background: 'var(--background)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        border: 'var(--border)',
        input: 'var(--input)',
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        primary: { DEFAULT: 'var(--primary)', foreground: 'var(--primary-foreground)' },
        accent: { DEFAULT: 'var(--accent)', foreground: 'var(--accent-foreground)' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'var(--font-inter)', 'sans-serif'],
      },
      maxWidth: { content: '1180px' },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #a8e2fd 0%, #3b82f6 50%, #0b1f4d 100%)',
        'brand-text': 'linear-gradient(135deg, #a8e2fd 0%, #7dd3fc 40%, #3b82f6 100%)',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        wave: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        'gradient-x': 'gradient-x 6s ease infinite',
        float: 'float 6s ease-in-out infinite',
        'spin-slow': 'spin-slow 14s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;

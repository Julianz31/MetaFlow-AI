/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        bg: { DEFAULT: '#0a0b0e', 2: '#111318', 3: '#181b22' },
        border: { DEFAULT: 'rgba(255,255,255,0.07)', strong: 'rgba(255,255,255,0.12)' },
        green: { DEFAULT: '#00d4aa', dark: '#00a885' },
        red: { DEFAULT: '#ff4d6a' },
        amber: { DEFAULT: '#f5a623' },
        blue: { DEFAULT: '#4a9eff' },
        purple: { DEFAULT: '#9b6dff' },
        gold: { DEFAULT: '#c9a84c' },
        text: { DEFAULT: '#f0f2f5', muted: '#8a8f9e', hint: '#555b6a' },
      },
    },
  },
  plugins: [],
}

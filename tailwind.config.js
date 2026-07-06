/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cinema: {
          bg: '#0d0d0d',
          card: '#1a1a1a',
          surface: '#111111',
          accent: '#e94560',
          gold: '#e50914',
          goldText: '#ff5b64',
          muted: '#9ca3af',
        },
      },
    },
  },
  plugins: [],
};

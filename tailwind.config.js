/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cinema: {
          bg: '#0d0d0d',
          card: '#1a1a2e',
          surface: '#16213e',
          accent: '#e94560',
          gold: '#e50914',
          muted: '#8892a4',
        },
      },
    },
  },
  plugins: [],
};

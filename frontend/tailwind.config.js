/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        convo: {
          primary: '#2563eb',    // CONVO blue
          secondary: '#1e40af',
          accent: '#3b82f6',
          dark: '#0f172a',
        },
      },
    },
  },
  plugins: [],
};

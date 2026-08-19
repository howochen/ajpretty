/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#c9a86c',
        secondary: '#f5f0e8',
        accent: '#8b7355',
      },
    },
  },
  plugins: [],
}

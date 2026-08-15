/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#12141a",
        paper: "#f4f1ea",
        copper: "#e8893a",
        gold: "#c4a35a",
      },
      fontFamily: {
        sans: ["Inter", "IBM Plex Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 8px 28px rgba(232, 137, 58, 0.28)",
      },
    },
  },
  plugins: [],
};

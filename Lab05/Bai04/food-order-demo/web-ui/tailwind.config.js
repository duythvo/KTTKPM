/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f8ff",
          100: "#ddeeff",
          500: "#1677ff",
          600: "#0f5ed0",
          700: "#0d4ea8",
        },
        ink: "#102235",
        moss: "#0f766e",
        coral: "#dc2626",
        amber: "#d97706",
      },
      fontFamily: {
        display: ["Segoe UI", "Tahoma", "sans-serif"],
        body: ["Verdana", "Geneva", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 35px rgba(16, 34, 53, 0.12)",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0f16",
        panel: "#111827",
        line: "rgba(255,255,255,0.08)",
        accent: "#22c55e",
        accent2: "#60a5fa"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.08), 0 10px 40px rgba(0,0,0,0.45)"
      }
    }
  },
  plugins: []
};


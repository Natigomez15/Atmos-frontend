/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:   "#1B4F8A",
        secondary: "#2ABFBF",
        surface:   "#FFFFFF",
        danger:    "#EF4444",
        warning:   "#F59E0B",
        success:   "#10B981",
        muted:     "#64748B",
        dark:      "#1E293B",
        background:"#FFFFFF",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}

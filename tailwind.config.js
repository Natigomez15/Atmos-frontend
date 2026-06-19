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
        sans:    ["Inter", "system-ui", "sans-serif"],
        heading: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "card":    "0 1px 4px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)",
        "card-md": "0 4px 16px -2px rgba(0,0,0,0.10), 0 2px 6px -2px rgba(0,0,0,0.06)",
        "card-lg": "0 8px 28px -4px rgba(0,0,0,0.12), 0 4px 10px -4px rgba(0,0,0,0.08)",
        "toast":   "0 8px 32px -4px rgba(0,0,0,0.14), 0 2px 8px -2px rgba(0,0,0,0.08)",
      },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
}

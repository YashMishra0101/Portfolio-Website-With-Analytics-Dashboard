/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "sans-serif"],
        display: ['"Outfit"', "sans-serif"],
        poppins: ['"Poppins"', "sans-serif"],
      },
      colors: {
        canvas: "var(--bg-canvas)",
        card: "var(--bg-card)",
        txt: "var(--text-main)",
        sub: "var(--text-sub)",
        accent: "var(--color-accent)",
        "accent-secondary": "var(--color-accent-secondary)",
        border: "var(--color-border)",

        // Icon backgrounds
        "icon-bg": "var(--bg-icon)",
        "icon-txt": "var(--text-icon)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: "#E6ECF5",
          100: "#C0CFE5",
          200: "#9AB1D4",
          300: "#7494C4",
          400: "#4E76B3",
          500: "#2859A3",
          600: "#1F4782",
          700: "#173562",
          800: "#0F2C59",
          900: "#0A1E3E",
          950: "#050F1F",
        },
        accent: {
          orange: "#FF6B35",
          cyan: "#00B4D8",
        },
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        dark: {
          DEFAULT: "#1F2937",
          light: "#374151",
        },
        neutral: {
          DEFAULT: "#4B5563",
          light: "#9CA3AF",
        },
        surface: {
          DEFAULT: "#F3F4F6",
          dark: "#111827",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 8s linear infinite",
        "number-scroll": "numberScroll 0.5s ease-out forwards",
      },
      keyframes: {
        numberScroll: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      boxShadow: {
        "card": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        "inner-glow": "inset 0 2px 4px 0 rgba(0, 180, 216, 0.1)",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #0F2C59 0%, #2859A3 100%)",
        "gradient-accent": "linear-gradient(135deg, #FF6B35 0%, #FF8C5A 100%)",
        "gradient-cyan": "linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)",
        "gradient-success": "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
        "gradient-warning": "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
        "gradient-danger": "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      colors: {
        brand: {
          50: "#EFF4FB",
          100: "#D9E5F4",
          200: "#AFC8E8",
          300: "#7FA4D4",
          400: "#4F7EBF",
          500: "#1E3A5F",
          600: "#182F4D",
          700: "#12243B",
          800: "#0C1A29",
          900: "#060F18",
        },
        accent: {
          50: "#FFF2EC",
          100: "#FFD9C7",
          200: "#FFB38F",
          300: "#FF8F57",
          400: "#FF6B35",
          500: "#E6511C",
          600: "#B33E14",
          700: "#802C0E",
          800: "#4D1A08",
          900: "#1A0903",
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
        slate: {
          850: "#111827",
          925: "#0B1220",
          950: "#080E1A",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["'Space Grotesk'", "Inter", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(30, 58, 95, 0.35)",
        "glow-accent": "0 0 20px rgba(255, 107, 53, 0.35)",
        card: "0 4px 20px rgba(0, 0, 0, 0.25)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(239, 68, 68, 0.4)" },
          "50%": { boxShadow: "0 0 20px rgba(239, 68, 68, 0.7)" },
        },
      },
      backgroundImage: {
        "grid-slate": "linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

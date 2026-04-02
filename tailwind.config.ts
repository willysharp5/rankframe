import type { Config } from "tailwindcss"

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        rankframe: {
          bgPrimary: "#1a1a1a",
          bgSecondary: "#222222",
          bgTertiary: "#2a2a2a",
          seo: "#3b82f6",
          geo: "#a855f7",
          success: "#22c55e",
          warning: "#eab308",
          danger: "#ef4444",
        },
      },
      fontFamily: {
        sans: ['-apple-system', "BlinkMacSystemFont", '"Segoe UI"', "Roboto", "sans-serif"],
      },
      boxShadow: {
        panel: "0 0 0 1px rgba(255,255,255,0.05), 0 12px 30px rgba(0,0,0,0.28)",
      },
    },
  },
} satisfies Config

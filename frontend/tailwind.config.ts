import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#059669",
          hover: "#047857",
          accent: "#10B981",
          glow: "rgba(16, 185, 129, 0.35)",
        },
        obsidian: {
          900: "#0B0F19",
          800: "#0F172A",
          700: "#1E293B",
          600: "#334155",
        },
      },
      fontFamily: {
        display: ["Outfit", "sans-serif"],
        body: ["Plus Jakarta Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [],
};
export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Giuseppe's brand red — from giuseppes.com.au (#CD212A)
        brand: {
          50: "#fff0f1",
          100: "#ffdde0",
          200: "#ffbbc0",
          300: "#ff8a92",
          400: "#f75563",
          500: "#e63040",
          600: "#CD212A",
          700: "#ab1b23",
          800: "#8d171d",
          900: "#731419",
        },
        // Giuseppe's surface palette — dark charcoal (#2F3235) & cream (#F8F5F2)
        giuseppe: {
          dark: "#2F3235",
          darker: "#25282b",
          card: "#383b3f",
          border: "#4a4d52",
          cream: "#F8F5F2",
          green: "#008C45",
        },
      },
      fontFamily: {
        sans: ["var(--font-lexend)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

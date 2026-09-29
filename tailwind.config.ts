import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: "#0F2C59",
          blue: "#185ADB",
          gold: "#D4AF37",
          light: "#F8F9FA",
          dark: "#1A1A1A",
          border: "#E2E8F0",
        },
      },
    },
  },
  plugins: [],
};
export default config;

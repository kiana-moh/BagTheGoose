import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          50: "#fbf8ef",
          100: "#f3ead0",
          200: "#e6d3a3",
          300: "#d4b96a",
          400: "#c49a34",
          500: "#ab7f1d",
          600: "#875f17",
          700: "#624313",
          800: "#3f2a0d",
          900: "#241706"
        },
        ink: {
          950: "#111215"
        }
      },
      boxShadow: {
        panel: "0 18px 48px rgba(15, 16, 20, 0.06)"
      },
      fontFamily: {
        sans: [
          '"Neue Haas Grotesk Text Pro"',
          '"Aptos"',
          '"Segoe UI Variable"',
          '"Inter Display"',
          '"Helvetica Neue"',
          'sans-serif'
        ],
        mono: ['"IBM Plex Mono"', '"SFMono-Regular"', 'ui-monospace', 'monospace']
      },
      backgroundImage: {
        "shell-gradient":
          "radial-gradient(circle at top left, rgba(241, 193, 47, 0.12), rgba(255,255,255,0) 26%), linear-gradient(180deg, #fdfcf8 0%, #f8f5ee 100%)"
      }
    }
  },
  plugins: []
};

export default config;

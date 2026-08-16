/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["Sora", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      colors: {
        ink: {
          950: "#0A0F1D",
          900: "#0F1626",
          800: "#151E33",
          700: "#1D2A46",
          600: "#2A3A5C",
        },
        paper: {
          DEFAULT: "#F5F7FB",
          card: "#FFFFFF",
          muted: "#EEF1F7",
        },
        accent: {
          DEFAULT: "#12B7A2",
          50: "#EAFBF8",
          100: "#CFF6EF",
          400: "#2CD4BC",
          500: "#12B7A2",
          600: "#0C9788",
          700: "#0A7A6E",
        },
        signal: {
          strong: "#12B7A2",
          potential: "#5B6EF5",
          review: "#F5A623",
          low: "#E5484D",
        },
        slate: {
          25: "#FBFCFE",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)",
        popover: "0 4px 6px -2px rgba(16,24,40,0.05), 0 12px 16px -4px rgba(16,24,40,0.10)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

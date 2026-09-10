/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F6F8F7",
        ink: "#15231F",
        teal: {
          DEFAULT: "#2C6E6B",
          dark: "#1E4E4C",
          light: "#DCEAE8",
        },
        sage: "#E4EBE7",
        clay: "#B8542F",
        hairline: "#D7E0DC",
      },
      fontFamily: {
        display: ["Newsreader", "serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "3px",
      },
    },
  },
  plugins: [],
};

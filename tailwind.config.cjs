/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        "bungee-outline": ["var(--font-bungee-outline)"],
      },
      colors: {
        anime: {
          ink: "var(--anime-ink)",
          panel: "var(--anime-panel)",
          paper: "var(--anime-paper)",
          paperDark: "var(--anime-paper-dark)",

          text: "var(--anime-text)",

          muted: "var(--anime-muted)",
          mutedStrong: "var(--anime-muted-strong)",
          mutedSubtle: "var(--anime-muted-subtle)",
          mutedWhisper: "var(--anime-muted-whisper)",

          line: "var(--anime-line)",
          lineStrong: "var(--anime-line-strong)",
          lineSubtle: "var(--anime-line-subtle)",

          red: "var(--anime-red)",
          cyan: "var(--anime-cyan)",
          lime: "var(--anime-lime)",
          neon: "var(--anime-neon)",

          redSoft: "var(--anime-red-soft)",
          cyanSoft: "var(--anime-cyan-soft)",
        },
      },
      textDecorationColor: {
        anime: {
          lime: "var(--anime-lime)",
          red: "var(--anime-red)",
          cyan: "var(--anime-cyan)",
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};

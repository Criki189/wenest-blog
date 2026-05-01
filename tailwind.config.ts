import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0E1B2C",
        body: "#3A4A5E",
        muted: "#6B7A8F",
        accent: {
          DEFAULT: "#1F8A70",
          soft: "#E8F4F0",
        },
        rule: "#E5E9EE",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      maxWidth: {
        reading: "680px",
      },
      lineHeight: {
        body: "1.7",
        heading: "1.2",
      },
      typography: () => ({
        wenest: {
          css: {
            "--tw-prose-body": "#3A4A5E",
            "--tw-prose-headings": "#0E1B2C",
            "--tw-prose-links": "#1F8A70",
            "--tw-prose-bold": "#0E1B2C",
            "--tw-prose-quotes": "#3A4A5E",
            "--tw-prose-quote-borders": "#1F8A70",
            "--tw-prose-bullets": "#1F8A70",
            "--tw-prose-counters": "#6B7A8F",
            "--tw-prose-hr": "#E5E9EE",
            maxWidth: "680px",
            lineHeight: "1.7",
            h2: { lineHeight: "1.2", marginTop: "2.5em" },
            h3: { lineHeight: "1.2" },
            a: { textDecoration: "underline", textUnderlineOffset: "3px" },
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
} satisfies Config;

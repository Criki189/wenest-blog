import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Aligned with wenest.com.au design system (warm beige + gold)
        background: "#F0F0EE",        // warm light grey
        ink: "#2D2926",               // charcoal (primary text)
        body: "#4A463F",              // warm dark body text
        muted: "#7A736A",              // warm muted
        card: "#FFFFFF",
        linen: "#E5DCC9",             // warm linen
        rule: "#DDD5C5",              // border warm beige
        gold: {
          DEFAULT: "#B5935B",         // brand gold
          soft: "#F0E8D7",            // gold tint
          dark: "#8E7244",
        },
        wax: "#541E1E",               // deep wax red
        // Aliases kept for compatibility with existing components
        accent: {
          DEFAULT: "#B5935B",
          soft: "#F0E8D7",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
      },
      maxWidth: {
        reading: "680px",
      },
      lineHeight: {
        body: "1.7",
        heading: "1.15",
      },
      boxShadow: {
        soft: "0 20px 50px -12px rgba(45, 41, 38, 0.08)",
        card: "0 30px 80px -20px rgba(45, 41, 38, 0.12)",
        elegant: "0 40px 100px -30px rgba(45, 41, 38, 0.18)",
      },
      typography: () => ({
        wenest: {
          css: {
            "--tw-prose-body": "#4A463F",
            "--tw-prose-headings": "#2D2926",
            "--tw-prose-links": "#B5935B",
            "--tw-prose-bold": "#2D2926",
            "--tw-prose-quotes": "#4A463F",
            "--tw-prose-quote-borders": "#B5935B",
            "--tw-prose-bullets": "#B5935B",
            "--tw-prose-counters": "#7A736A",
            "--tw-prose-hr": "#DDD5C5",
            maxWidth: "680px",
            lineHeight: "1.7",
            h2: {
              fontFamily: "Fraunces, ui-serif, Georgia, serif",
              fontWeight: "500",
              lineHeight: "1.2",
              letterSpacing: "-0.01em",
              marginTop: "2.5em",
            },
            h3: {
              fontFamily: "Fraunces, ui-serif, Georgia, serif",
              fontWeight: "500",
              lineHeight: "1.25",
            },
            a: { textDecoration: "underline", textUnderlineOffset: "3px" },
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
} satisfies Config;

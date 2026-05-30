import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["Outfit", "sans-serif"],
      },
      colors: {
        // eFit shadcnUI compatible dynamic variables
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        
        // Brand color tokens matching logo colors exactly
        efit: {
          blue: {
            light: "#6AE5F7",
            dark: "#54B7F0",
            DEFAULT: "#54B7F0",
            600: "#48a2d6",
            700: "#3d8dbb",
          },
          yellow: {
            light: "#F4BC41",
            dark: "#EF9035",
            DEFAULT: "#EF9035",
            600: "#d6812f",
            700: "#bd722a",
          },
          navy: {
            DEFAULT: "#0f172a",
            100: "#1e293b",
            400: "#0f172a",
            800: "#080c16",
            900: "#03050a",
          },
          gray: {
            text: "#64748b",
            muted: "#94a3b8",
          }
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "ocean-glow": "0 0 25px rgba(84, 183, 240, 0.2)",
        "yellow-glow": "0 0 25px rgba(239, 144, 53, 0.2)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

import plugin from "tailwindcss/plugin";

const columns = {};
for (let i = 1; i <= 24; i++) {
  const key = `${i}/24`;
  columns[key] = `${100 / 24} * i`;
}

export default {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        fadeIn: "fadeIn 0.3s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        border: "hsl(var(--border))",

        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
      
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        primary: {
          50: "hsl(var(--primary-50))",
          100: "hsl(var(--primary-100))",
          200: "hsl(var(--primary-200))",
          300: "hsl(var(--primary-300))",
          400: "hsl(var(--primary-400))",
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        landing: {
          border: "hsl(var(--border))",
          input: "hsl(var(--input))",
          ring: "hsl(var(--ring))",
          background: "hsl(var(--landing-background))",
          foreground: "hsl(var(--landing-foreground))",
          primary: {
            DEFAULT: "hsl(var(--landing-primary))",
            foreground: "hsl(var(--landing-primary-foreground))",
          },
          secondary: {
            DEFAULT: "hsl(var(--secondary))",
            foreground: "hsl(var(--secondary-foreground))",
          },
          destructive: {
            DEFAULT: "hsl(var(--destructive))",
            foreground: "hsl(var(--destructive-foreground))",
          },
          muted: {
            DEFAULT: "hsl(var(--muted))",
            foreground: "hsl(var(--muted-foreground))",
          },
          accent: {
            DEFAULT: "hsl(var(--accent))",
            foreground: "hsl(var(--accent-foreground))",
          },
          popover: {
            DEFAULT: "hsl(var(--popover))",
            foreground: "hsl(var(--popover-foreground))",
          },
          card: {
            DEFAULT: "hsl(var(--card))",
            foreground: "hsl(var(--card-foreground))",
          },
          sidebar: {
            DEFAULT: "hsl(var(--sidebar-background))",
            foreground: "hsl(var(--sidebar-foreground))",
            primary: "hsl(var(--sidebar-primary))",
            "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
            accent: "hsl(var(--sidebar-accent))",
            "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
            border: "hsl(var(--sidebar-border))",
            ring: "hsl(var(--sidebar-ring))",
          },
          brand: {
            blue: "hsl(var(--brand-blue))",
            "blue-light": "hsl(var(--brand-blue-light))",
            "blue-dark": "hsl(var(--brand-blue-dark))",
          },
          feature: {
            blue: "hsl(var(--feature-blue))",
            purple: "hsl(var(--feature-purple))",
            orange: "hsl(var(--feature-orange))",
            green: "hsl(var(--feature-green))",
            cyan: "hsl(var(--feature-cyan))",
            pink: "hsl(var(--feature-pink))",
            amber: "hsl(var(--feature-amber))",
            red: "hsl(var(--feature-red))",
          },
        }
      },
      
      gridTemplateColumns: {
        // 24 column grid
        "24": "repeat(24, minmax(0, 1fr))",
      },
      // width: columns, //
    },
    // screens: {
    //   'sm': '640px',
    //   'md': '768px',
    //   'lg': '1024px',
    //   'xl': '1280px',
    //   '2xl': '1536px',
    // },
    screens: {
      "sm": "480px",
      "md": "640px",
      "lg": "960px",
      "xl": "1280px",
      "2xl": "1536px",
    },
    container: {
      center: true,
      maxWidth: {
        "2xl": "700px",
      },
    },
    
  },
  plugins: [
    plugin(function ({ addBase, addComponents, theme }) {
      addBase({
        // 'h1': { fontSize: theme('fontSize.2xl') },
        // 'h2': { fontSize: theme('fontSize.xl') },
        // 'h3': { fontSize: theme('fontSize.lg') },
      });
      
      addComponents({
        ".container": {
          width: "100%",
          "@screen sm": { maxWidth: "420px" },
          "@screen md": { maxWidth: "456px" },
          "@screen lg": { maxWidth: "936px" },
          "@screen xl": { maxWidth: "1056px" },
          "@screen 2xl": { maxWidth: "1416px" },
        },
      });
      
    }),
  ],
  corePlugins: {
    preflight: false, // <== disable this!
  },
};

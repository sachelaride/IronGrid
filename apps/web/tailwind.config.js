/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    // Safelist: dynamic classes built via string interpolation in StatusCard,
    // StrategicCard, PriorityBadge, etc. Tailwind cannot detect these at purge time.
    safelist: [
        // bg-{color} / bg-{color}/{opacity}
        { pattern: /^bg-(primary|secondary-fixed|error|primary-fixed-dim|on-primary-container)(\/\d+)?$/ },
        // text-{color} / text-{color}/{opacity}
        { pattern: /^text-(primary|secondary-fixed|error|primary-fixed-dim|on-surface-variant)(\/\d+)?$/ },
        // border-{color} / border-{color}/{opacity}
        { pattern: /^border-(primary|secondary-fixed|error|primary-fixed-dim|outline-variant)(\/\d+)?$/ },
        // animate-pulse used conditionally
        'animate-pulse',
        // status glow helpers
        'status-glow-success',
        'status-glow-error',
    ],
    theme: {
        extend: {
            colors: {
                // Surface Colors
                "surface": "rgb(var(--surface) / <alpha-value>)",
                "surface-dim": "#10131a",
                "surface-bright": "#363940",
                "surface-container-lowest": "#0b0e14",
                "surface-container-low": "#191c22",
                "surface-container": "rgb(var(--surface-container) / <alpha-value>)",
                "surface-container-high": "#272a31",
                "surface-container-highest": "#32353c",
                
                // Content Colors
                "on-surface": "rgb(var(--on-surface) / <alpha-value>)",
                "on-surface-variant": "#bac9cc",
                "inverse-surface": "#e1e2eb",
                "inverse-on-surface": "#2e3037",
                
                // Accents & Actions
                "primary": "rgb(var(--primary) / <alpha-value>)",
                "on-primary": "#00363d",
                "primary-container": "#00e5ff",
                "on-primary-container": "#00626e",
                "inverse-primary": "#006875",
                "surface-tint": "#00daf3",
                
                "secondary": "rgb(var(--secondary) / <alpha-value>)",
                "on-secondary": "#003920",
                "secondary-container": "#00ffa3",
                "on-secondary-container": "#007146",
                
                "tertiary": "rgb(var(--tertiary) / <alpha-value>)",
                "on-tertiary": "#621100",
                "tertiary-container": "#ffc2b3",
                "on-tertiary-container": "#aa2600",
                
                "error": "rgb(var(--error) / <alpha-value>)",
                "on-error": "#690005",
                "error-container": "#93000a",
                "on-error-container": "#ffdad6",
                
                // Fixed Colors
                "primary-fixed": "#9cf0ff",
                "primary-fixed-dim": "#00daf3",
                "on-primary-fixed": "#001f24",
                "on-primary-fixed-variant": "#004f58",
                "secondary-fixed": "#52ffac",
                "secondary-fixed-dim": "#00e290",
                "on-secondary-fixed": "#002111",
                "on-secondary-fixed-variant": "#005231",
                "tertiary-fixed": "#ffdad2",
                "tertiary-fixed-dim": "#ffb4a2",
                "on-tertiary-fixed": "#3c0700",
                "on-tertiary-fixed-variant": "#8a1d00",
                
                // Utility
                "outline": "#849396",
                "outline-variant": "rgb(var(--outline-variant) / <alpha-value>)",
                "background": "#10131a",
                "on-background": "#e1e2eb",
            },
            borderRadius: {
                "DEFAULT": "0.125rem",
                "lg": "0.25rem",
                "xl": "0.5rem",
                "full": "0.75rem"
            },
            spacing: {
                "unit": "4px",
                "gutter": "16px",
                "margin": "24px",
                "container-padding": "32px",
            },
            fontFamily: {
                "headline-md": ["Space Grotesk", "sans-serif"],
                "label-caps": ["Inter", "sans-serif"],
                "display-lg": ["Space Grotesk", "sans-serif"],
                "body-md": ["Inter", "sans-serif"],
                "body-lg": ["Inter", "sans-serif"],
                "data-mono": ["Inter", "monospace"]
            },
            fontSize: {
                "headline-md": ["24px", { "lineHeight": "1.2", "letterSpacing": "0.02em", "fontWeight": "600" }],
                "label-caps": ["11px", { "lineHeight": "1", "letterSpacing": "0.1em", "fontWeight": "700" }],
                "display-lg": ["48px", { "lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                "body-md": ["14px", { "lineHeight": "1.5", "letterSpacing": "0", "fontWeight": "400" }],
                "body-lg": ["16px", { "lineHeight": "1.6", "letterSpacing": "0", "fontWeight": "400" }],
                "data-mono": ["13px", { "lineHeight": "1", "letterSpacing": "0.05em", "fontWeight": "500" }]
            }
        },
    },
    plugins: [],
}

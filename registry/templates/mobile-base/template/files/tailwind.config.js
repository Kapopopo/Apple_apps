const { hairlineWidth, platformSelect } = require('nativewind/theme');
const plugin = require('tailwindcss/plugin');
const theme = require('./src/config/theme.json');

const names = Object.keys(theme.colors.light);
const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(' ');
const variables = (palette) => Object.fromEntries(names.map((name) => [`--${name}`, channels(palette[name])]));
const color = (name) => `rgb(var(--${name}) / <alpha-value>)`;
const pair = (name) => ({ DEFAULT: color(name), foreground: color(`${name}-foreground`) });
const status = (name) => ({ DEFAULT: color(name), foreground: color(name), subtle: `rgb(var(--${name}) / 0.15)` });
const r = theme.radius;

// Une police embarquée = un fichier par graisse : les classes de graisse choisissent la famille.
const { fonts } = theme;
const weights = fonts
  ? {
      '.font-normal': { fontFamily: fonts.sans },
      '.font-medium': { fontFamily: fonts.medium },
      '.font-semibold': { fontFamily: fonts.bold },
      '.font-bold': { fontFamily: fonts.bold },
      '.font-extrabold': { fontFamily: fonts.bold },
      '.font-display': { fontFamily: fonts.display },
    }
  : { '.font-display': { fontWeight: '700' } };

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Le thème suit le téléphone (variables sous prefers-color-scheme). 'class' plutôt que 'media' : en 'media',
  // NativeWind 4 lève une exception au chargement sur le web.
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    fontFamily: { mono: platformSelect({ ios: 'Menlo', default: 'monospace' }), ...(fonts ? { sans: fonts.sans } : {}) },
    ...(fonts ? { fontWeight: {} } : {}),
    borderRadius: {
      none: '0px',
      sm: `${r * 0.5}px`,
      DEFAULT: `${r * 0.5}px`,
      md: `${r * 0.75}px`,
      lg: `${r}px`,
      xl: `${r * 1.25}px`,
      '2xl': `${r * 1.5}px`,
      '3xl': `${r * 2}px`,
      full: '9999px',
    },
    extend: {
      colors: {
        background: color('background'),
        foreground: color('foreground'),
        border: color('border'),
        input: color('input'),
        ring: color('ring'),
        card: pair('card'),
        popover: pair('popover'),
        primary: pair('primary'),
        secondary: pair('secondary'),
        muted: pair('muted'),
        accent: pair('accent'),
        destructive: { ...pair('destructive'), solid: { foreground: color('destructive-foreground') } },
        success: status('success'),
        warning: status('warning'),
        info: status('info'),
        // Noms utilisés par les composants PanelUI du registre.
        surface: { DEFAULT: color('card'), secondary: color('secondary'), tertiary: color('muted') },
        inset: color('muted'),
        skeleton: color('muted'),
      },
      spacing: Object.fromEntries(Object.entries(theme.spacing).map(([name, px]) => [name, `${px}px`])),
      borderWidth: { hairline: hairlineWidth() },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    plugin(({ addBase, addUtilities }) => {
      addBase({
        ':root': variables(theme.colors.light),
        '@media (prefers-color-scheme: dark)': { ':root': variables(theme.colors.dark) },
      });
      addUtilities(weights);
    }),
  ],
};

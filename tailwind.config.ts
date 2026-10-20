import type { Config } from 'tailwindcss';
import daisyui from 'daisyui';
import { THEMES } from './src/common/themes';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/frontend/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  plugins: [daisyui],
  daisyui: {
    // Single source of truth shared with the theme settings API and admin UI.
    themes: THEMES,
  },
};

export default config;

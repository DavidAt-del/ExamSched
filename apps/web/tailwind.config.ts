import type { Config } from 'tailwindcss';
import rtl from 'tailwindcss-rtl';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Heebo"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [rtl],
};

export default config;

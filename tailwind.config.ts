import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#08111f',
        panel: '#101f31',
        cyanbrand: '#20b8f5',
        tealbrand: '#21d4b4',
        violetbrand: '#7c72ff'
      },
      boxShadow: {
        soft: '0 18px 55px -38px rgba(0,0,0,.55)'
      }
    }
  },
  plugins: []
} satisfies Config;

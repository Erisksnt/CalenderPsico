import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 🎯 Cores do seu tema (do globals.css)
        cherry: {
          DEFAULT: '#C2183A',
          dark: '#a0162f',
        },
        ink: '#101010',
        muted: '#4d4d4d',
        surface: '#ffffff',
        soft: '#f7f6f5',
        // Manter primary/secondary se usados
        primary: '#C2183A',  // 🔥 Agora batata!
        secondary: '#a0162f',
      },
      boxShadow: {
        'soft': 'var(--shadow-soft)', // Se quiser manter consistência
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Fonte padrão do seu CSS
      },
    },
  },
  plugins: [],
};

export default config;
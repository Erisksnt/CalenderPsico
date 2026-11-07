import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 🍷 Paleta Oficial Marsala / Cereja Nobre (Thaís Almeida)
        marsala: {
          50: '#FDF5F6',
          100: '#F8ECED',
          200: '#F2D8DC',
          300: '#E4B3BC',
          400: '#CE7888',
          500: '#B0475B',
          600: '#942B41',
          700: '#7C1D30', // Cor dominante da identidade
          800: '#641626',
          900: '#531320',
          950: '#320710',
          DEFAULT: '#7C1D30',
        },
        // Fundos Acolhedores e Neutros (Estilo Isabella Orcioli)
        neutral: {
          cream: '#FAF7F2',
          offwhite: '#FDFCF9',
          sand: '#F4EFEA',
          linen: '#EBE3DA',
          blush: '#FAF0F2',
        },
        text: {
          charcoal: '#25181B',
          heading: '#2D1B20',
          body: '#604C51',
          muted: '#8B7378',
        },
        gold: {
          light: '#E6CFB8',
          DEFAULT: '#C8A27A',
          dark: '#A6825B',
        },
        // Compatibilidade legada
        cherry: {
          DEFAULT: '#7C1D30',
          dark: '#5C1020',
        },
        'rose-blush': '#E4B3BC',
        'dusty-mauve': '#9E7B7B',
        'cream': '#FAF7F2',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        elegant: '0 10px 40px -10px rgba(124, 29, 48, 0.08)',
        card: '0 4px 30px rgba(124, 29, 48, 0.05)',
        float: '0 20px 50px -12px rgba(124, 29, 48, 0.18)',
        hover: '0 14px 40px -6px rgba(124, 29, 48, 0.22)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
};

export default config;

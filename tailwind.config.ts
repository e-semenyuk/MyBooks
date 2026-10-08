import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

// Ink and brass: near-black ink for structure, warm greys for surfaces,
// one muted brass accent. Brass 500 is for fills and rules; use brass 600 or
// 700 for text so it keeps AA contrast on white and on stone 50.
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#F4F5F7',
          100: '#E4E7EB',
          200: '#C7CDD6',
          300: '#9AA3B0',
          400: '#6B7585',
          500: '#4A5565',
          600: '#364050',
          700: '#2B3441',
          800: '#1E2530',
          900: '#151A22',
          950: '#0E1116',
        },
        stone: {
          50: '#FAF9F7',
          100: '#F3F1ED',
          200: '#E7E4DE',
          300: '#D3CFC6',
          400: '#A8A398',
          500: '#6F6A60',
          600: '#5A564E',
          700: '#4A463F',
          800: '#2F2C27',
          900: '#1C1A17',
        },
        brass: {
          100: '#F1E9D6',
          300: '#CDB27A',
          500: '#9A7B3F',
          600: '#7F6430',
          700: '#6B5326',
        },
        success: { DEFAULT: '#2F6B4F', soft: '#E6F1EB' },
        warning: { DEFAULT: '#8A5A12', soft: '#F8EEDC' },
        danger: { DEFAULT: '#9B2C2C', soft: '#F8E6E6' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
        serif: ['var(--font-serif)', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      borderRadius: {
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
      },
      boxShadow: {
        float: '0 8px 24px -8px rgba(14, 17, 22, 0.18), 0 2px 6px rgba(14, 17, 22, 0.06)',
      },
      maxWidth: {
        page: '1200px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
    },
  },
  plugins: [],
}
export default config

import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

// Swiss cobalt: white page, true black structure, one saturated blue, sharp
// corners. Cobalt 500 is the only accent; status colors appear only in badges
// and messages.
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
          50: '#F5F5F6',
          100: '#E7E8EA',
          200: '#CDCFD4',
          300: '#A3A7B0',
          400: '#7C818C',
          500: '#5E636E',
          600: '#454952',
          700: '#32353C',
          800: '#1C1E23',
          900: '#101114',
          950: '#0A0A0B',
        },
        mist: {
          50: '#F6F7F9',
          100: '#EEF0F3',
          200: '#E1E4E9',
          300: '#C9CED6',
          400: '#8B909B',
          500: '#5E636E',
          600: '#454952',
          700: '#32353C',
          800: '#1C1E23',
          900: '#101114',
        },
        cobalt: {
          50: '#EEF1FF',
          100: '#E0E5FF',
          300: '#8FA0FF',
          500: '#1F3DFF',
          600: '#1530D6',
          700: '#0F24A8',
        },
        success: { DEFAULT: '#0B7A4B', soft: '#E4F4EC' },
        warning: { DEFAULT: '#8F5200', soft: '#FFF1D6' },
        danger: { DEFAULT: '#C8261E', soft: '#FDE8E6' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
        display: ['var(--font-display)', 'var(--font-sans)', ...defaultTheme.fontFamily.sans],
        mono: ['var(--font-mono)', ...defaultTheme.fontFamily.mono],
      },
      borderRadius: {
        none: '0',
        sm: '0',
        DEFAULT: '0',
        md: '0',
        lg: '0',
        xl: '0',
      },
      maxWidth: {
        page: '1280px',
      },
      animation: {
        'fade-in': 'fadeIn 0.12s ease-out',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
}
export default config

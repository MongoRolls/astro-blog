const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    fontFamily: {
      sans: ['"Inter"', '"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif', ...defaultTheme.fontFamily.sans],
      serif: ['"Newsreader"', '"Source Han Serif SC"', '"Noto Serif SC"', 'Georgia', 'serif', ...defaultTheme.fontFamily.serif],
      mono: ['"Fira Code"', '"JetBrains Mono"', ...defaultTheme.fontFamily.mono],
    },
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
      },
      textColor: {
        main: 'rgb(var(--color-text-main) / <alpha-value>)',
      },
      backgroundColor: {
        main: 'rgb(var(--color-bg-main))',
        muted: 'rgb(var(--color-bg-muted))',
      },
      borderColor: {
        main: 'rgb(var(--color-border-main) / <alpha-value>)',
      },
      typography: theme => ({
        DEFAULT: {
          css: {
            'a': {
              'color': 'rgb(var(--color-text-main) / 0.86)',
              'textDecoration': 'underline',
              'textDecorationThickness': '1.35px',
              'textDecorationColor': 'rgb(var(--color-text-main) / 0.28)',
              'textUnderlineOffset': '0.2em',
              'transition': 'color 0.2s ease, background-color 0.2s ease, text-decoration-color 0.2s ease',
              '&:hover': {
                color: 'rgb(var(--color-text-main) / 1)',
                backgroundColor: 'rgba(var(--color-bg-muted) / 0.5)',
                textDecorationColor: 'rgb(var(--color-text-main) / 0.5)',
              },
            },
            'p, li, span': {
              fontFamily: theme('fontFamily.sans'),
              color: 'rgb(var(--color-text-p) / var(--tw-text-opacity, 1))',
              fontWeight: 400,
              fontSize: '1.02rem',
              letterSpacing: '0.01rem',
              lineHeight: '1.5rem',
              marginBottom: '0.85em',
              marginTop: '0.85em',
            },
            'strong': {
              color: 'rgb(var(--color-text-main) / 0.95)',
              fontWeight: 700,
            },
            'em': {
              color: 'rgb(var(--color-text-main) / 0.9)',
            },
            'code:not(pre code)': {
              'fontFamily': theme('fontFamily.mono'),
              'fontSize': '0.92em',
              'fontWeight': 500,
              'backgroundColor': 'rgba(237, 237, 235, 0.9)',
              'color': '#111827',
              'borderRadius': '0.3rem',
              'padding': '0.08em 0.4em',
              'margin': '0 0.18em',
              'transition': 'color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
              'border': '1px solid rgba(0, 0, 0, 0.04)',
              'position': 'relative',
              '.dark &': {
                backgroundColor: 'rgba(31, 41, 55, 0.9)',
                color: theme('colors.blue.200'),
                borderColor: 'rgba(75, 85, 99, 0.35)',
              },
            },
            ':not(pre) > code': {
              '&::before, &::after': {
                content: 'none !important',
              },
            },
            'pre': {
              borderRadius: '0.6rem',
              padding: '1rem',
              boxShadow: 'none',
              margin: '1.4rem 0',
              overflow: 'auto',
              maxHeight: '75vh',
              border: '1px solid rgba(var(--color-border-main) / 0.12)',
              backgroundColor: 'rgba(var(--color-bg-muted) / 0.9)',
              lineHeight: '1.6',
            },
            'pre code': {
              fontSize: '0.95em',
              fontWeight: 500,
            },
            'h1, h2, h3': {
              display: 'block',
              fontFamily: theme('fontFamily.serif'),
              color: 'rgb(var(--color-text-main) / 0.95)',
              letterSpacing: '-0.02em',
              lineHeight: '1.25',
            },
            'h1': {
              fontWeight: 700,
              fontSize: '2.35rem',
              marginTop: '1.5em',
              marginBottom: '0.95em',
            },
            'h2': {
              fontWeight: 650,
              fontSize: '1.85rem',
              marginTop: '1.4em',
              marginBottom: '0.85em',
            },
            'h3': {
              fontWeight: 650,
              fontSize: '1.45rem',
              marginTop: '1.2em',
              marginBottom: '0.75em',
            },
            'summary': {
              'cursor': 'pointer',
              'color': theme('colors.blue.500'),
              'fontWeight': 500,
              'transition': 'color 0.2s ease',
              '&:hover': {
                color: theme('colors.purple.400'),
              },
            },
            'ul, ol': {
              paddingLeft: '1.2em',
              marginTop: '0.6em',
              marginBottom: '0.6em',
            },
            'li > ul, li > ol': {
              marginTop: '0.35em',
              marginBottom: '0.35em',
            },
            'table': {
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '1.2rem',
              marginBottom: '1.2rem',
              fontSize: '0.96em',
              lineHeight: '1.6',
              boxShadow: 'none',
              borderRadius: '0.4rem',
              overflow: 'hidden',
              border: '1px solid rgba(var(--color-border-main) / 0.16)',
            },
            'thead': {
              backgroundColor: 'rgba(var(--color-bg-muted) / 0.6)',
              borderBottom: '1px solid rgba(var(--color-border-main) / 0.2)',
            },
            'thead th': {
              'fontWeight': 700,
              'padding': '0.75rem 0.95rem',
              'textAlign': 'left',
              'color': 'rgb(var(--color-text-main) / 0.95)',
              'verticalAlign': 'middle',
              'fontSize': '0.98em',
              'letterSpacing': '0.02em',
              'borderRight': '1px solid rgba(var(--color-border-main) / 0.16)',
              '&:first-child': {
                paddingLeft: '1.05rem',
              },
              '&:last-child': {
                borderRight: 'none',
              },
            },
            'tbody tr': {
              'borderBottom': '1px solid rgba(var(--color-border-main) / 0.16)',
              '&:nth-child(even)': {
                backgroundColor: 'rgba(var(--color-bg-muted) / 0.18)',
              },
              '&:last-child': {
                borderBottom: 'none',
              },
              '&:hover': {
                backgroundColor: 'rgba(var(--color-bg-muted) / 0.22)',
              },
            },
            'tbody td': {
              'padding': '0.75rem 0.95rem',
              'verticalAlign': 'top',
              'color': 'rgb(var(--color-text-main) / 0.9)',
              'fontSize': '0.96em',
              'borderRight': '1px solid rgba(var(--color-border-main) / 0.16)',
              '&:first-child': {
                paddingLeft: '1.05rem',
                fontWeight: '520',
              },
              '&:last-child': {
                borderRight: 'none',
              },
            },
            'blockquote': {
              fontFamily: theme('fontFamily.serif'),
              fontStyle: 'italic',
              fontWeight: 500,
              color: 'rgb(var(--color-text-main) / 0.9)',
              borderLeft: '3px solid rgba(var(--color-border-main) / 0.35)',
              padding: '0.95rem 1.1rem',
              backgroundColor: 'rgba(var(--color-bg-muted) / 0.42)',
              margin: '1.2rem 0',
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
    darkMode: 'class',
    theme: {
        fontFamily: {
            sans: ['ui-sans-serif', 'system-ui', 'sans-serif', 'Apple Color Emoji', ...defaultTheme.fontFamily.sans]
            // serif: ['"Noto Serif SC"', ...defaultTheme.fontFamily.serif]
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
                    950: '#082f49'
                }
            },
            textColor: {
                main: 'rgb(var(--color-text-main) / <alpha-value>)'
            },
            backgroundColor: {
                main: 'rgb(var(--color-bg-main) / <alpha-value>)',
                muted: 'rgb(var(--color-bg-muted) / <alpha-value>)'
            },
            borderColor: {
                main: 'rgb(var(--color-border-main) / <alpha-value>)'
            },
            typography: (theme) => ({
                dante: {
                    css: {
                        '--tw-prose-body': theme('textColor.main / 100%'),
                        '--tw-prose-headings': theme('textColor.main / 100%'),
                        '--tw-prose-lead': theme('textColor.main / 100%'),
                        '--tw-prose-links': theme('textColor.main / 100%'),
                        '--tw-prose-bold': theme('textColor.main / 100%'),
                        '--tw-prose-counters': theme('textColor.main / 100%'),
                        '--tw-prose-bullets': theme('textColor.main / 100%'),
                        '--tw-prose-hr': theme('borderColor.main / 100%'),
                        '--tw-prose-quotes': theme('textColor.main / 100%'),
                        '--tw-prose-quote-borders': theme('borderColor.main / 100%'),
                        '--tw-prose-captions': theme('textColor.main / 100%'),
                        '--tw-prose-code': theme('textColor.main / 100%'),
                        '--tw-prose-pre-code': theme('colors.zinc.100'),
                        '--tw-prose-pre-bg': theme('colors.zinc.800'),
                        '--tw-prose-th-borders': theme('borderColor.main / 100%'),
                        '--tw-prose-td-borders': theme('borderColor.main / 100%')
                    }
                },
                DEFAULT: {
                    css: {
                        a: {
                            position: 'relative',
                            textDecoration: 'underline',
                            textDecorationStyle: 'dotted',
                            textDecorationThickness: '3px',
                            textDecorationColor: 'rgb(var(--color-text-main) / 0.4)',
                            textUnderlineOffset: '0.2em',
                            color: 'rgb(var(--color-text-main) / 0.8)',
                            transition: 'all 0.2s ease',
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                bottom: '-2px',
                                left: '0',
                                width: '100%',
                                height: '2px',
                                background: 'linear-gradient(90deg, #60a5fa, #e879f9)',
                                transformOrigin: 'right',
                                transform: 'scaleX(0)',
                                transition: 'transform 0.3s ease'
                            },
                            '&:hover': {
                                color: 'rgb(var(--color-text-main) / 1)',
                                textDecorationColor: 'transparent',
                                '&::after': {
                                    transformOrigin: 'left',
                                    transform: 'scaleX(1)'
                                }
                            }
                        },
                        'p, li, span': {
                            color: 'rgb(var(--color-text-p) / var(--tw-text-opacity, 1))',
                            fontWeight: 500,
                            fontSize: '1rem',
                            lineHeight: '1.55rem'
                        },
                        'h1,h2,h3': {
                            textDecoration: 'underline',
                            textDecorationColor: 'rgb(var(--color-text-main) / <alpha-value>)',
                            textUnderlineOffset: '10px',
                            textDecorationThickness: '3px'
                        },
                        'h1,h2,h3,h4,h5,h6': {
                            fontFamily: theme('fontFamily.serif'),
                            fontWeight: 700,
                            color: 'rgb(var(--color-text-main) / <alpha-value>)'
                        },
                        summary: {
                            cursor: 'pointer'
                        },
                        blockquote: {
                            border: 0,
                            fontFamily: theme('fontFamily.serif'),
                            fontSize: '1.3125em',
                            fontStyle: 'italic',
                            fontWeight: 'normal',
                            lineHeight: 1.4,
                            paddingLeft: 0,
                            '@media (min-width: theme("screens.sm"))': {
                                fontSize: '1.66667em',
                                lineHeight: 1.3
                            }
                        }
                    }
                },
                lg: {
                    css: {
                        blockquote: {
                            paddingLeft: 0
                        }
                    }
                }
            })
        }
    },
    plugins: [require('@tailwindcss/typography')]
};

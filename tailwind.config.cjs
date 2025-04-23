const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
    darkMode: 'class',
    theme: {
        fontFamily: {
            sans: ['ui-sans-serif', 'system-ui', 'sans-serif', 'Apple Color Emoji', ...defaultTheme.fontFamily.sans],
            serif: ['Merriweather', 'Georgia', ...defaultTheme.fontFamily.serif]
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
                mongorolls: {
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
                            fontWeight: 400,
                            fontSize: '1rem',
                            lineHeight: '1.55rem'
                        },
                        'code:not(pre code)': {
                            fontFamily: theme('fontFamily.mono'),
                            fontSize: '0.875em',
                            fontWeight: 500,
                            backgroundColor: 'rgba(237, 237, 235)',
                            color: theme('colors.rose.600'),
                            borderRadius: '0.25rem',
                            padding: '0.15em 0.4em',
                            margin: '0 0.2em',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            '.dark &': {
                                backgroundColor: 'rgba(31, 41, 55)',
                                color: theme('colors.pink.400'),
                                borderColor: 'rgba(75, 85, 99, 0.4)'
                            }
                        },
                        ':not(pre) > code': {
                            '&::before, &::after': {
                                content: 'none !important'
                            }
                        },
                        pre: {
                            borderRadius: '0.5rem',
                            padding: '1rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            margin: '1.5rem 0',
                            overflow: 'auto',
                            maxHeight: '80vh',
                            border: '1px solid rgba(var(--color-border-main), 0.1)'
                        },
                        'pre code': {
                            fontSize: '0.9em',
                            fontWeight: 400
                        },
                        'h1,h2': {
                            '&::before': {
                                background: 'rgb(23, 23, 23)',
                                content: '""',
                                display: 'block',
                                height: '2px',
                                marginBottom: '18px',
                                width: '60px'
                            }
                        },
                        'h1,h2,h3,h4,h5,h6': {
                            fontFamily: theme('fontFamily.serif'),
                            fontWeight: 700
                            // color: 'rgb(var(--color-text-main) / <alpha-value>)'
                        },
                        summary: {
                            cursor: 'pointer'
                        },
                        blockquote: {
                            border: 10,
                            fontFamily: theme('fontFamily.serif'),
                            fontStyle: 'italic',
                            fontWeight: 'normal',
                            lineHeight: 1.4,
                            p: {
                                fontSize: '1.3125em'
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

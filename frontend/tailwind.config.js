/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui'],
            },
            colors: {
                brand: {
                    50: '#f0f4ff',
                    100: '#e0eaff',
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                    900: '#1e1b4b',
                },
                surface: {
                    900: '#0f0f1a',
                    800: '#16162a',
                    700: '#1e1e35',
                    600: '#252540',
                },
            },
            animation: {
                'spin-slow': 'spin 3s linear infinite',
                'pulse-bar': 'pulse-bar 1.2s ease-in-out infinite',
            },
            keyframes: {
                'pulse-bar': {
                    '0%, 100%': { transform: 'scaleY(0.4)' },
                    '50%': { transform: 'scaleY(1)' },
                },
            },
        },
    },
    plugins: [],
}

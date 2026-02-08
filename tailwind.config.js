/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                sienna: '#2D1B1B',
                cream: '#FFF9F5',
                accent: '#FF5E7E',
                petal: '#FFE4E8',
            },
        },
    },
    plugins: [],
}

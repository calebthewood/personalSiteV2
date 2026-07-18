/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mustard: '#f5be49',
        ink: '#272727',
      },
      fontFamily: {
        display: ['OSS-Bold', 'Verdana', 'Tahoma', 'sans-serif'],
        semi: ['OSS-SemiBold', 'Arial', 'Helvetica', 'sans-serif'],
      },
      boxShadow: {
        // hard offset shadows, no blur — the neo-brutalist signature
        'nb': '9px 9px 0 0 #272727',
        'nb-btn': '8px 8px 0 0 #272727',
        'nb-sm': '2px 2px 0 0 #272727',
        'nb-active': '-1px -1px 0 0 #272727',
        // sunken look: the box's lip casts a hard shadow onto the tile's
        // top-left, the far lip catches a thin highlight; inset shadows
        // follow the border radius so the corners read correctly
        'nb-recess': 'inset 4px 4px 0 0 #c8c8c8, inset -2px -2px 0 0 #ffffff',
      },
    },
  },
  plugins: [],
}

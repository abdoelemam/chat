import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: ["night", "winter", "synthwave", "retro", "cyberpunk", "valentine", "aqua", "dracula", "business", "coffee", "forest", "luxury", "lemonade", "nord"],
  },
};

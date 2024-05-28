import { type Config } from "tailwindcss";
import daisyui from "daisyui";

export default {
  content: ["{routes,islands,components}/**/*.{ts,tsx}"],
  plugins: [daisyui],
  daisyui: {
    logs: false,
    themes: ["cupcake"],
  },
} satisfies Config;

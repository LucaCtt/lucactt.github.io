import { defineConfig } from "astro/config";
import icon from "astro-icon";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  integrations: [icon()],
  site: "https://lucactt.github.io",

  vite: {
    plugins: [tailwindcss()],
  },
});
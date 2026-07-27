import { defineConfig, envField, fontProviders } from "astro/config";
import icon from "astro-icon";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  integrations: [icon()],
  site: "https://lucactt.github.io",

  vite: {
    plugins: [tailwindcss()],
  },

  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Courier Prime",
      cssVariable: "--font-courier-prime",
    },
  ],

  env: {
    schema: {
      EMAIL: envField.string({ context: "client", access: "public" }),
      LINKEDIN: envField.string({ context: "client", access: "public" }),
      GITHUB: envField.string({ context: "client", access: "public" }),
      ORCID: envField.string({ context: "client", access: "public" }),
      GOOGLE_VERIFICATION: envField.string({
        context: "client",
        access: "public",
      }),
    },
  },
});

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  base: "/civilizacao-de-bolso/",
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: [
        "icon.svg",
        "icon-192.png",
        "icon-512.png",
        "THIRD_PARTY_NOTICES.txt",
      ],
      manifest: {
        name: "Civilização de Bolso",
        short_name: "Civilização",
        lang: "pt-BR",
        description: "Uma pequena sociedade, uma história extraordinária.",
        theme_color: "#152e28",
        background_color: "#f4f0e7",
        display: "standalone",
        start_url: "./",
        scope: "./",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  test: { include: ["src/**/*.test.ts"] },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
  },
  server: {
    proxy: {
      "/prozorro-search": {
        target: "https://prozorro.gov.ua",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/prozorro-search/, ""),
      },
      "/prozorro": {
        target: "https://public-api.prozorro.gov.ua",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/prozorro/, ""),
      },
    },
  },
});

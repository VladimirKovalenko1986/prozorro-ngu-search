import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
  },
  server: {
    proxy: {
      "/prozorro": {
        target: "https://public-api.prozorro.gov.ua",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/prozorro/, ""),
      },
    },
  },
});

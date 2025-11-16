import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/server": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/server/, ""),
      },
    },
  },
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});

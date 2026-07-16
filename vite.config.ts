import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { metaImagesPlugin } from "./vite-plugin-meta-images";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    tailwindcss(),
    metaImagesPlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
   server: {
     host: "0.0.0.0",
     allowedHosts: true,
     fs: {
       strict: true,
       deny: ["**/.*"],
     },
      proxy: {
        "/api": {
          // proxy API requests to the backend. Use PORT if provided, otherwise
          // default to 5000 (matches server/index.ts default). Previously the
          // fallback was 3001 which could cause ECONNREFUSED when the server
          // listens on 5000.
          target: `http://${process.env.BACKEND_HOST || "127.0.0.1"}:${process.env.PORT || 5000}`,
          changeOrigin: true,
          secure: false,
        },
      },
   },
});

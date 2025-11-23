import path from "path";
import { fileURLToPath } from "url";

import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "icons/*.png", "screenshots/*.png"],
      manifest: {
        name: "CoordiFit",
        short_name: "CoordiFit",
        description: "AI 기반 코디 추천 및 가상 피팅 플랫폼",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        orientation: "portrait",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        // ✅ 모바일 스크린샷 추가
        screenshots: [
          {
            src: "/screenshots/coordifit-mobile.png",
            sizes: "360x800",
            type: "image/png",
            form_factor: "narrow",
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            // API 캐시
            urlPattern: /^https:\/\/coordifit\.com\/api\/.*$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 3600,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // 이미지 캐시
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "image-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7일
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@page": path.resolve(__dirname, "./src/pages"),
      "@images": path.resolve(__dirname, "./src/assets/images/clothes"),
      "@calendar": path.resolve(__dirname, "./src/pages/Calendar"),
      "@store": path.resolve(__dirname, "./src/store"),
    },
  },
  server: {
    proxy: {
      "/s3": {
        target: "https://memory-forest-test.s3.ap-northeast-2.amazonaws.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/s3/, ""),
      },
    },
  },
});

// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    server: {
      // Dev proxy: /api/* → Flask backend (avoids CORS issues in dev)
      proxy: {
        "/api": {
          target: "http://localhost:5000",
          changeOrigin: true,
          // Strip the /api prefix before forwarding to Flask
          rewrite: (path) => path.replace(/^\/api/, ""),
          // Forward cookies (required for httpOnly refresh_token)
          configure: (proxy) => {
            proxy.on("proxyReq", (_proxyReq, req) => {
              if (req.headers.cookie) {
                _proxyReq.setHeader("cookie", req.headers.cookie);
              }
            });
          },
        },
      },
    },
  },
});

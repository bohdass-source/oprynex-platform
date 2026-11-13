import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Self-hosted build: TanStack Start + React + Tailwind, deployed by nitro as a Cloudflare Worker ("bun run cf:deploy").
export default defineConfig(({ command }) => ({
  css: { transformer: "lightningcss" },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  optimizeDeps: { include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"] },
  server: { host: "::", port: 8080 },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      // Server-only modules must never end up in the browser bundle.
      importProtection: { behavior: "error", client: { files: ["**/server/**"], specifiers: ["server-only"] } },
      // SSR error wrapper in src/server.ts.
      server: { entry: "server" },
    }),
    ...(command === "build" ? [nitro({ preset: "cloudflare-module", cloudflare: { nodeCompat: true, deployConfig: true, wrangler: { preview_urls: false, workers_dev: true, send_email: [{ name: "EMAIL" }], routes: [{ pattern: "oprynex.de", custom_domain: true }, { pattern: "www.oprynex.de", custom_domain: true }] } } })] : []),
    viteReact(),
  ],
}));

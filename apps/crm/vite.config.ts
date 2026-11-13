import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Oprynex App (CRM): TanStack Start + React + Tailwind, deployed by nitro as the Cloudflare Worker "app" ("bun run cf:deploy").
export default defineConfig(({ command }) => ({
  css: { transformer: "lightningcss" },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  optimizeDeps: { include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"] },
  server: { host: "::", port: 8090 },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      importProtection: { behavior: "error", client: { files: ["**/server/**"], specifiers: ["server-only"] } },
      server: { entry: "server" },
    }),
    ...(command === "build" ? [nitro({ preset: "cloudflare-module", cloudflare: { nodeCompat: true, deployConfig: true, wrangler: {
      preview_urls: false,
      workers_dev: true,
      routes: [{ pattern: "app.oprynex.de", custom_domain: true }],
      // Direct links to the site and the bot engine for the admin status checks: a Worker cannot fetch another Worker on workers.dev.
      services: [{ binding: "SITE", service: "site" }, { binding: "BOT", service: "bot" }],
    } } })] : []),
    viteReact(),
  ],
}));

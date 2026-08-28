// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Set STATIC_BUILD=1 (and optionally VITE_BASE_PATH) to emit a fully static
// SPA shell for static-only hosts such as GitHub Pages. The normal build keeps
// SSR with the custom server entry below.
const isStaticBuild = process.env["STATIC_BUILD"] === "1";

export default defineConfig({
  vite: {
    // Base path for static hosting (e.g. GitHub Pages project sites served
    // from /<repo-name>/). Defaults to "/" for local dev and Lovable preview.
    base: process.env["VITE_BASE_PATH"] ?? "/",
    plugins: isStaticBuild
      ? [
          {
            name: "static-build-server-alias",
            apply: "build" as const,
            closeBundle() {
              // The prerender step imports dist/server/server.js and calls
              // .fetch(req) on its default export, but the nitro build emits
              // index.mjs whose fetch expects Cloudflare (env, ctx) arguments.
              // Emit an alias that stubs those bindings so the SPA shell can
              // be prerendered in a plain Node context.
              const fs = require("node:fs");
              fs.writeFileSync(
                "dist/server/server.js",
                [
                  'import entry from "./index.mjs";',
                  "const env = { ASSETS: { fetch: () => new Response(null, { status: 404 }) } };",
                  "const ctx = { waitUntil() {}, passThroughOnException() {} };",
                  "// Clone the request: nitro's cloudflare entry mutates req.ip,",
                  "// which the prerenderer's Request subclass forbids.",
                  "export default { fetch: (req) => entry.fetch(new Request(req), env, ctx) };",
                  "",
                ].join("\n"),
              );
            },
          },
        ]
      : [],
  },
  tanstackStart: isStaticBuild
    ? {
        // Static SPA mode: prerender a static index.html shell; all app logic
        // runs client-side, so no server runtime is needed on GitHub Pages.
        spa: { enabled: true },
      }
    : {
        // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
        // nitro/vite builds from this
        server: { entry: "server" },
      },
});

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
  },
  // TanStack SPA mode uses its own Vite server environment at build time to
  // render the shell. GitHub Pages only receives dist/client, so the Nitro
  // deployment adapter is neither needed nor appropriate for this build.
  // Normal Lovable preview and production builds keep the default adapter.
  ...(isStaticBuild ? { nitro: false } : {}),
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

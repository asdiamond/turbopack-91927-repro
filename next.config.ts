import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The prod codebase had this set when the bug was firing under Turbopack.
  // Turbopack ignored it (the bug fired anyway), but it changes which path
  // these packages walk through Turbopack's pipeline, so include it here.
  transpilePackages: ['react-markdown', 'remark-math', 'rehype-katex'],
  experimental: {
    // Per Vercel Turbopack team: these expose readable names + module ids in
    // prod bundles, so we can inspect what the export-wiring actually emits.
    turbopackMinify: false,
    turbopackModuleIds: 'named',
    // Force Turbopack to route these through its barrel-optimization path.
    optimizePackageImports: ['react-markdown', 'rehype-katex']
  }
};

// `withSentryConfig` is what the prod codebase wraps its `next.config.ts`
// with. It mutates the Next config (adds source-map upload, instruments
// modules, hooks into the build pipeline) — exactly the kind of side
// effect we suspect interacts with Turbopack's re-export codegen.
export default withSentryConfig(nextConfig, {
  // Org/project are placeholders — the build-time pipeline still runs,
  // it just won't actually upload source maps. That's fine; we want the
  // module-wrapping / config-mutation side effects, not real reporting.
  org: 'example',
  project: 'turbopack-91927-repro',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  webpack: {
    treeshake: { removeDebugLogging: true },
    automaticVercelMonitors: true
  }
});

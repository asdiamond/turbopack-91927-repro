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

export default nextConfig;

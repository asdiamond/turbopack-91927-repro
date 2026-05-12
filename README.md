# Turbopack export-resolution probe (related to vercel/next.js#91927)

Minimal repro scaffold for a Turbopack export-wiring bug observed in
production at https://julius.ai on Next.js 16.2.4 (Turbopack). Pure-ESM
packages with both default and named exports (`react-markdown@10.1.0`,
`rehype-katex@7.0.1`) resolve to `undefined` at runtime in some prod
bundles, even when the package is in the chunk and the namespace object
exists.

> **Status of this scaffold:** the bug **does not reproduce locally** with
> the deps in this folder. We are publishing it as the starting point for
> a Vercel-side investigation, plus our prod evidence.

## What we saw in prod

`react-dom-client.production.js: createFiberFromTypeAndProps` throws
React #130 (`Element type is invalid: expected a string ... but got:
undefined`) on every chat page render. Sentry issue
[`JULIUS-CLIENT-G2W`](https://caesar-labs.sentry.io/issues/JULIUS-CLIENT-G2W):
- 22,000+ events, ~12,000 unique users across `vercel-production`
- `transaction: /chat`, `turbopack: True`
- `release: 6d5df6dc20cb7c9b5c6d8f1621ab0a6eaf7b3fc3` (Next 16.2.4)
- React `19.3.0-canary-3f0b9e61-20260317`

A `ChatErrorBoundary` we wrapped around the offending render reports the
following from inside the live prod bundle:

```js
// boundary context, captured from a real Sentry event
{
  reactMarkdownNamespaceType:               "object",
  reactMarkdownNamespaceDefaultType:        "undefined",  // ← bug
  markdownHooksType:                        "undefined",  // ← bug
  markdownAsyncType:                        "undefined",  // ← bug
  rehypeKatexNamespaceType:                 "object",
  rehypeKatexNamespaceDefaultType:          "undefined",  // ← bug
  remarkMathNamespaceDefaultType:           "function",   // works
}
```

So under the broken Turbopack bundle:
- `import X from 'react-markdown'` → `undefined`
- `import * as NS from 'react-markdown'; NS.default` → `undefined`
- `import * as NS from 'react-markdown'; NS.MarkdownHooks` → `undefined`
- `import * as NS from 'react-markdown'; NS.MarkdownAsync` → `undefined`
- The namespace object itself is present, but every export read off it is
  `undefined`.
- `remark-math` (pure ESM, only a default export) **works**.
- `react-markdown` and `rehype-katex` (both pure ESM with at least one
  named export alongside default) **break**.

Vercel deployment: `dpl_CaRoLaaiQy8sTUMgFbFoeQsDr7gs`.

## Workaround

`next build --webpack` (instead of the default Turbopack build) is a clean
fix. We mirrored Next's SVGR rule from `nextConfig.turbopack.rules` into
`nextConfig.webpack` (the `turbopack` block is silently ignored under
webpack and SVG imports otherwise resolve to URLs):

```ts
config.module.rules.push({ test: /\.svg$/, use: ['@svgr/webpack'] });
```

After redeploy on the webpack-built release `6f769ea6a115b88e5b3823a8f1074dc495efcdef`,
0 new `JULIUS-CLIENT-G2W` events. The same issue is now fully suppressed.

## What we tried that did **not** work

- `transpilePackages: ['react-markdown', 'remark-math', 'rehype-katex']`
  in `next.config.ts` — Turbopack appears to ignore it for this case.
- Namespace import with `.default` fallback (the namespace's `.default` is
  also `undefined`).
- Named import of `MarkdownHooks` (named exports are also `undefined` on
  the namespace).

## Reproducing this scaffold

```sh
bun install
bun run build      # Turbopack
bun run start
# open http://localhost:3000 — expected: every typeof = "function"
```

The page (`app/page.tsx`) prints `typeof` for each import shape and
renders a live `<ReactMarkdown>`. On the broken bundle, the typeofs come
back `"undefined"` and the live render throws React #130.

To try the webpack-built path:

```sh
bun run build:webpack
bun run start
```

## What's in here

- `app/page.tsx` — probes default + namespace + named imports of
  `react-markdown` and `rehype-katex` plus the same values re-pulled
  through the local `./markdown-reexport` file. Renders a live
  `<ReactMarkdown>` and each consumer below.
- `app/markdown-default-consumer.tsx`,
  `app/markdown-named-consumer.tsx`,
  `app/markdown-namespace-consumer.tsx`,
  `app/markdown-memoized.tsx`,
  `app/markdown-reexport-consumer.tsx` — adjacent consumers using
  default / named / namespace / `memo(default)` / re-exported import
  styles.
- `app/markdown-reexport.ts` — `export { default, MarkdownHooks,
  MarkdownAsync, defaultUrlTransform } from 'react-markdown'`, mirroring
  Turbopack's suspected re-export codegen path.
- `app/barrel.ts` — re-exports both `react-markdown` and several of the
  consumers above; `markdown-default-consumer.tsx` and
  `markdown-named-consumer.tsx` then import sibling exports *back* from
  this barrel, forming a chunk-graph cycle (the canonical shape #91927
  attributes to Turbopack's re-export codegen).
- `app/virtuoso-list.tsx` — a `Virtuoso` from `react-virtuoso` whose
  `itemContent` returns `<ReactMarkdown>`, mirroring the immediate parent
  in the original Sentry stack.
- `next.config.ts` — sets `transpilePackages: ['react-markdown',
  'remark-math', 'rehype-katex']` (matching the original codebase),
  `experimental.turbopackMinify: false`, `turbopackModuleIds: "named"`
  (suggested by the Vercel Turbopack team for inspecting the emitted
  bundle), and `optimizePackageImports` including these packages to
  force the barrel path.

## What we tried that did NOT trigger the bug locally

In order, on `next@16.2.4` + Turbopack, `node@20.18.3`, macOS:

1. Bare `import ReactMarkdown from 'react-markdown'` on one page.
2. + namespace + named imports of `react-markdown` and `rehype-katex`.
3. + 4 sibling consumers with mixed import styles.
4. + `experimental.optimizePackageImports: ['react-markdown', 'rehype-katex']`.
5. + `experimental.turbopackMinify: false`, `turbopackModuleIds: 'named'`.
6. + a local re-export file (`export { default, ... } from 'react-markdown'`)
   and a consumer that reaches `react-markdown` only through it.
7. + a barrel that re-exports BOTH `react-markdown` AND two sibling
   consumers; the consumers import a peer back from the barrel (chunk
   cycle).
8. + `transpilePackages: ['react-markdown', 'remark-math', 'rehype-katex']`.
9. + `react-virtuoso` wrapping `<ReactMarkdown>` as `itemContent`.

All nine build cleanly; every `typeof` returns `function`; every live
render is correct.

## What this scaffold is missing vs. the codebase that DOES trigger

- `@sentry/nextjs` instrumentation (`withSentryConfig` modifies the
  build and auto-wraps modules)
- `@auth0/auth0-react` provider wrapping the tree
- `@tanstack/react-query`, `framer-motion`, `@ark-ui/react`,
  `react-syntax-highlighter`, `@mescius/spread-sheets-react`, etc. —
  ~150 transitive deps in the prod app
- Multiple nested App Router route groups
- Vercel CI build environment (cache state, build parallelism)
- ~100 routes vs. our 1

So the bug requires conditions only present in the original much larger
app. **Strongly suspect this needs the Vercel CI environment, or a much
denser dep graph than we've added here, to reproduce.** Would appreciate
guidance on what additional shape to add to the scaffold to surface it
locally, or on whether deploying this scaffold to a Vercel preview would
let your build environment reproduce it directly.

## Notes

- Built locally with `next@16.2.4`, `react@19.3.0-canary-3f0b9e61-20260317`,
  `react-markdown@10.1.0`, `rehype-katex@7.0.1`, `bun@1.1.0`,
  `node v20.18.3` (prod observed under `node v20.20.2` on Vercel).
- Local Turbopack builds compile fine, BUILD_ID is written, every
  typeof comes back `function`, and the live render is correct. Output
  for an example chunk shows Turbopack's named module ids:
  ```
  react-markdown/index.js [app-client] (ecmascript)
  react-markdown/lib/index.js [app-client] (ecmascript) <export Markdown as default>
  ```
- The bug likely depends on a larger dep graph than this scaffold or on
  Vercel-specific build state. Suggested next step: deploy this scaffold
  to a Vercel preview with the same project settings, and/or extend it
  with progressively more dependencies until the export wiring breaks.

## References

- vercel/next.js#91927 (the closest open issue describing this class of
  bug — "mixing direct and barrel imports of the same module causes
  undefined component at runtime")
- vercel/next.js#86568 (Turbopack SWC scope-hoist variable collision in
  16.2.x)

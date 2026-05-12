'use client';

// Minimal Turbopack export-resolution probe.
// Under `next build` (Turbopack) on Next 16.2.x, `ReactMarkdown` is observed
// to resolve to `undefined` on Vercel prod bundles, even though the package
// is included and the namespace object is populated.
// Webpack (`next build --webpack`) is unaffected.
//
// See https://github.com/vercel/next.js/issues/91927

import ReactMarkdown from 'react-markdown';
import * as ReactMarkdownNS from 'react-markdown';
import RehypeKatex from 'rehype-katex';
import * as RehypeKatexNS from 'rehype-katex';

// Pull in adjacent consumers with mixed import styles to recreate the
// dep-graph shape from the original prod codebase. Per the upstream issue
// comments, the bug fires when the same module is reached via both a
// direct-default import and a barrel/named import.
// Sibling consumers — also reach `react-markdown` through `./barrel`, which
// re-exports both the package and these consumers. That barrel + the
// consumers' imports-back-from-barrel forms the cycle in the chunk graph.
import { DefaultConsumer, NamedConsumer, ReexportConsumer } from './barrel';
import { MemoizedMarkdown } from './markdown-memoized';
import { NamespaceConsumer } from './markdown-namespace-consumer';
import { VirtuosoMarkdownList } from './virtuoso-list';
// Pull the named exports back through the re-export file too, so that
// `react-markdown.MarkdownHooks` is reachable via BOTH `import * as` here AND
// the re-export — creating the multi-path shape #91927 calls out.
import {
  MarkdownAsync as ReExportedAsync,
  MarkdownHooks as ReExportedHooks,
  default as ReExportedDefault
} from './markdown-reexport';

export default function Page() {
  const probe = {
    // Direct imports from `react-markdown`
    reactMarkdownDefault: typeof ReactMarkdown,
    reactMarkdownNamespace: typeof ReactMarkdownNS,
    reactMarkdownNamespaceDefault: typeof (ReactMarkdownNS as { default?: unknown }).default,
    reactMarkdownNamespaceMarkdownHooks: typeof (ReactMarkdownNS as { MarkdownHooks?: unknown })
      .MarkdownHooks,
    reactMarkdownNamespaceMarkdownAsync: typeof (ReactMarkdownNS as { MarkdownAsync?: unknown })
      .MarkdownAsync,
    rehypeKatexDefault: typeof RehypeKatex,
    rehypeKatexNamespace: typeof RehypeKatexNS,
    rehypeKatexNamespaceDefault: typeof (RehypeKatexNS as { default?: unknown }).default,
    // Same exports, but pulled through the local `./markdown-reexport` file —
    // i.e. via Turbopack's re-export codegen path.
    reExportedDefault: typeof ReExportedDefault,
    reExportedHooks: typeof ReExportedHooks,
    reExportedAsync: typeof ReExportedAsync
  };

  return (
    <main style={{ padding: 24, fontFamily: 'ui-monospace, monospace', fontSize: 13 }}>
      <h1 style={{ fontSize: 18 }}>Turbopack #91927 probe</h1>
      <p>
        Every value below should be <code>function</code> for default-imports and{' '}
        <code>object</code> for namespace-imports. If any default is <code>undefined</code>{' '}
        the Turbopack export-wiring bug is present.
      </p>
      <pre style={{ background: '#f5f5f5', padding: 12 }}>
        {JSON.stringify(probe, null, 2)}
      </pre>
      <hr style={{ margin: '16px 0' }} />
      <h2 style={{ fontSize: 14 }}>Live render</h2>
      <p>
        If <code>ReactMarkdown</code> is <code>undefined</code> the render below will
        throw React #130 (&ldquo;Element type is invalid&hellip;&rdquo;).
      </p>
      <ReactMarkdown rehypePlugins={[RehypeKatex]}>
        {'**hello** _world_ from `react-markdown`'}
      </ReactMarkdown>

      <h2 style={{ fontSize: 14, marginTop: 16 }}>Adjacent consumers</h2>
      <DefaultConsumer text={'**default** consumer'} />
      <NamedConsumer text={'**named** consumer'} />
      <NamespaceConsumer text={'**namespace** consumer'} />
      <MemoizedMarkdown>{'**memoized** consumer'}</MemoizedMarkdown>

      <h2 style={{ fontSize: 14, marginTop: 16 }}>Through `./markdown-reexport`</h2>
      <ReexportConsumer text={'reexport child'} />
      <ReExportedDefault>{'**ReExportedDefault** rendered inline'}</ReExportedDefault>
      <ReExportedHooks>{'**ReExportedHooks** rendered inline'}</ReExportedHooks>

      <h2 style={{ fontSize: 14, marginTop: 16 }}>react-virtuoso wrapper</h2>
      <VirtuosoMarkdownList />
    </main>
  );
}

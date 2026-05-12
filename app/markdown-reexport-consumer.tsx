'use client';

// Reach `react-markdown` via the local re-export file rather than directly.
// Combined with the direct import in `page.tsx`, this creates two paths to
// the same module — the dep-graph shape #91927 calls out.
import ReactMarkdown, { MarkdownHooks } from './markdown-reexport';

export function ReexportConsumer({ text }: { text: string }) {
  return (
    <div>
      <ReactMarkdown>{`reexport-default: ${text}`}</ReactMarkdown>
      <MarkdownHooks>{`reexport-named: ${text}`}</MarkdownHooks>
    </div>
  );
}

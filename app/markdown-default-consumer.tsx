'use client';

import ReactMarkdown from 'react-markdown';

// Pull a sibling export back from the barrel — closes the cycle that
// `./barrel` opens by re-exporting both this file's `DefaultConsumer` and
// `react-markdown`.
import { MarkdownHooks } from './barrel';

export function DefaultConsumer({ text }: { text: string }) {
  return (
    <div>
      <ReactMarkdown>{`default ${text}`}</ReactMarkdown>
      <MarkdownHooks>{`hooks-via-barrel ${text}`}</MarkdownHooks>
    </div>
  );
}

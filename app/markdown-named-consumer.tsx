'use client';

import { MarkdownHooks } from 'react-markdown';

// Pull a sibling export back from the barrel too — same shape as
// `./markdown-default-consumer`, but starting from a named import.
import { DefaultConsumer } from './barrel';

export function NamedConsumer({ text }: { text: string }) {
  return (
    <div>
      <MarkdownHooks>{`hooks ${text}`}</MarkdownHooks>
      <DefaultConsumer text={`via-barrel ${text}`} />
    </div>
  );
}

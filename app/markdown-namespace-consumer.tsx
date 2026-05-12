'use client';

import * as ReactMarkdownNS from 'react-markdown';

const ReactMarkdown =
  ((ReactMarkdownNS as unknown) as { default?: unknown }).default ?? ReactMarkdownNS;

const RM = ReactMarkdown as React.ComponentType<{ children?: string }>;

export function NamespaceConsumer({ text }: { text: string }) {
  return <RM>{text}</RM>;
}

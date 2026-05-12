'use client';

// Mirror the prod render shape: react-virtuoso list whose item renderer
// returns a `<ReactMarkdown>`. The Sentry stack from the original bug
// showed react-virtuoso's `flushSync` immediately above the React #130,
// so the markdown render lives inside a virtuoso item.
import ReactMarkdown from 'react-markdown';
import { Virtuoso } from 'react-virtuoso';

const items = Array.from({ length: 5 }, (_, i) => `**virtuoso item ${i}** with _markdown_`);

export function VirtuosoMarkdownList() {
  return (
    <div style={{ height: 200, border: '1px solid #ccc' }}>
      <Virtuoso
        data={items}
        itemContent={(_index, item) => <ReactMarkdown>{item}</ReactMarkdown>}
      />
    </div>
  );
}

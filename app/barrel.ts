// Barrel that re-exports both the package and our local consumers.
// Combined with consumers that import from this barrel (rather than from
// individual files), this creates a chunk-graph cycle: barrel re-exports
// `react-markdown` and `./markdown-default-consumer`, and the consumer
// imports back from the barrel for a sibling type — the classic cycle
// shape that #91927 attributes to Turbopack's re-export codegen.
export { default as ReactMarkdown } from 'react-markdown';
export { MarkdownHooks, MarkdownAsync } from 'react-markdown';
export { DefaultConsumer } from './markdown-default-consumer';
export { NamedConsumer } from './markdown-named-consumer';
export { ReexportConsumer } from './markdown-reexport-consumer';

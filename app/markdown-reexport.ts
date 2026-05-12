// Re-export from react-markdown, creating a second reachability path from
// the page to the same module. Vercel pointed at Turbopack's re-export
// logic as the suspect codegen for #91927; this file is the minimal
// trigger shape for that.
export { default, MarkdownHooks, MarkdownAsync, defaultUrlTransform } from 'react-markdown';

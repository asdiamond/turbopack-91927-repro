// Mirrors the prod setup that does reproduce Turbopack #91927.
// DSN is intentionally a public placeholder — we want @sentry/nextjs's
// build-time effects (withSentryConfig mutates the Next config + adds
// source-map upload + auto-instruments modules), not actual event
// delivery. Sentry.init() with a non-deliverable DSN still runs the
// SDK's client-side wrapping/proxies, which is the chunk-graph
// disturbance we suspect contributes to #91927.
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn:
    process.env.NEXT_PUBLIC_SENTRY_DSN ||
    'https://examplePublicKey@o0.ingest.sentry.io/0',
  sendDefaultPii: true
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

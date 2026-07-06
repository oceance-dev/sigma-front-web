import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://8124cad7a87246015e7340311e444695@o4511672425840640.ingest.de.sentry.io/4511672428068944",

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,

  // Replay: 10% des sessions normales, 100% si erreur
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
  ],

  enableLogs: true,
});

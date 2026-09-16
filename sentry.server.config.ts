// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://8124cad7a87246015e7340311e444695@o4511672425840640.ingest.de.sentry.io/4511672428068944",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  dataCollection: {
    // Les corps de requête/réponse peuvent contenir un code 2FA ou un jeton de
    // step-up (ex. POST /auth/2fa/verify) — Sentry ne redacte que les clés
    // contenant "token", pas "code", donc on désactive la capture des bodies.
    httpBodies: [],
  },
});

import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development'

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: [
    "192.168.*.*", // réseaux domestiques typiques
    "10.*.*.*",    // réseaux d'entreprise / VPN
    "172.16.*.*",  // plages privées RFC 1918
    "172.17.*.*",
    "172.18.*.*",
    "172.19.*.*",
    "172.20.*.*",
    "172.21.*.*",
    "172.22.*.*",
    "172.23.*.*",
    "172.24.*.*",
    "172.25.*.*",
    "172.26.*.*",
    "172.27.*.*",
    "172.28.*.*",
    "172.29.*.*",
    "172.30.*.*",
    "172.31.*.*",
  ],
  async rewrites() {
    // API_URL est une var runtime (non-NEXT_PUBLIC_) : modifiable sans rebuild.
    // Fallback sur NEXT_PUBLIC_API_URL pour la compatibilité dev local.
    const apiBase = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? ''
    return [
      {
        source: '/api/sigma/:path*',
        destination: `${apiBase}/:path*`,
      },
    ]
  },
  async headers() {
    // NEXT_PUBLIC_API_HOST = domaine public (ex: https://sigma-saas.cloud)
    // utilisé uniquement pour le CSP côté browser.
    // Si absent, le browser n'a besoin que de 'self' car tout passe par /api/sigma/*
    const apiHost = process.env.NEXT_PUBLIC_API_HOST ?? ''
    const connectSrc = ['self', apiHost, 'https://geo.api.gouv.fr']
      .filter(Boolean)
      .map(v => v === 'self' ? "'self'" : v)
      .join(' ')

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          ...(!isDev ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }] : []),
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              `connect-src ${connectSrc}`,
              "font-src 'self'",
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "sigma-ke",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});

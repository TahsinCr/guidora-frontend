/**
 * Safe Default Configuration (Immutable Fallback)
 * If public/config.json is missing, corrupted, or unreachable during runtime,
 * this safe baseline keeps the application running smoothly without crashing.
 */

export const SAFE_CONFIG_DEFAULTS = Object.freeze({
  app: Object.freeze({
    siteName: 'Guidora',
    supportEmail: 'support@guidora.io',
    defaultLocale: 'tr',
    availableLocales: Object.freeze(['tr', 'en', 'ru']),
  }),
  backend: Object.freeze({
    healthCheckEndpoint: '/health/live',
    healthReadyEndpoint: '/health/ready',
    apiPrefix: '/api',
  }),
  network: Object.freeze({
    timeouts: Object.freeze({
      defaultMs: 8000,
      uploadMs: 25000,
      authMs: 6000,
      healthCheckMs: 3000,
    }),
    retry: Object.freeze({
      maxRetries: 2,
      backoffBaseMs: 1000,
      retryableStatusCodes: Object.freeze([408, 429, 500, 502, 503, 504]),
    }),
    rateLimiting: Object.freeze({
      respectRetryAfter: true,
      knownLimits: Object.freeze({
        loginPerMinute: 10,
        registerPerHour: 5,
        refreshPerMinute: 30,
      }),
    }),
  }),
  circuitBreaker: Object.freeze({
    enabled: true,
    failureThreshold: 3,
    recoveryTimeoutMs: 10000,
    probeIntervalMs: 5000,
  }),
  maintenance: Object.freeze({
    active: false,
    title: 'Planlı Bakım Çalışması',
    message: 'Sistemlerimizi sizlere daha iyi bir deneyim sunabilmek için güncelliyoruz.',
    estimatedEndTime: null,
    bypassRoles: Object.freeze(['admin', 'superadmin']),
  }),
  features: Object.freeze({
    toolSubmission: Object.freeze({
      enabled: true,
      requiresEmailVerification: false,
      allowGithubImport: true,
    }),
    communityReviews: Object.freeze({
      enabled: true,
      minAccountAgeDays: 7,
      requiresEmailVerification: true,
    }),
    communityVerificationVoting: Object.freeze({
      enabled: true,
      voteThreshold: 30,
      requiresEmailVerification: true,
    }),
    compareMode: true,
  }),
});

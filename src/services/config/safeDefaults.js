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
        loginPerMinute: 60,
        registerPerHour: 20,
        refreshPerMinute: 60,
      }),
      retryAfterFallbackSeconds: 15,
    }),
  }),
  circuitBreaker: Object.freeze({
    enabled: true,
    failureThreshold: 5,
    recoveryTimeoutMs: 20000,
    probeIntervalMs: 10000,
    healthEndpoint: '/health/live',
  }),
  toasts: Object.freeze({
    autoDismissMs: 3000,
    allowUserClose: true,
  }),
  ambientBar: Object.freeze({
    enabled: true,
    heightPx: 2.5,
  }),
  maintenance: Object.freeze({
    active: false,
    scheduled: false,
    title: 'Planlı Bakım Çalışması',
    activeDescription: 'Guidora platformunda planlı altyapı optimizasyonu ve güvenlik güncellemeleri yapılmaktadır. Çalışmaların en kısa sürede tamamlanarak tüm servislerin yeniden erişime açılması planlanmaktadır. Anlayışınız için teşekkür ederiz.',
    scheduledWarningDescription: 'Guidora platformu saat 20:00 itibarıyla planlı performans bakımına alınacaktır. Çalışmaların yaklaşık 45 dakika sürmesi öngörülmektedir. Lütfen işlemlerinizi tamamlayınız.',
    scheduledStart: null,
    scheduledCountdownSeconds: 3600,
    estimatedEndTime: null,
    bypassKeys: Object.freeze(['superadmin_preview', 'guidora_dev_2026']),
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

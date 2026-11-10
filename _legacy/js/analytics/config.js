/* Gelato Analytics — configurazione.
   Flag di ambiente: enabled. false spegne ogni invio, su sito pubblico e portale.
   Override di deploy, prima di questo file:
     window.GELATO_ANALYTICS_ENABLED = false;
   La chiave PostHog è una project key pubblica (phc_…). Vuota = solo archivio locale,
   la dashboard Lab legge comunque gli eventi. Host UE per tenere i dati in Europa. */
(function (window) {
  "use strict";

  var deploy = window.GELATO_ANALYTICS_ENABLED;

  var apiBase = window.GELATO_API_BASE_URL;
  if (typeof apiBase !== "string" || !apiBase) {
    apiBase = "http://127.0.0.1:8000/api/v1";
  }

  window.GELATO_ANALYTICS_CONFIG = {
    enabled: typeof deploy === "boolean" ? deploy : true,
    provider: "posthog",
    posthogKey: "",
    posthogHost: "https://eu.i.posthog.com",
    requireConsent: true,
    anonymous: true,
    wordsPerMinute: 200,
    readDepth: 75,
    scrollMarks: [25, 50, 75, 100],
    rageClicks: 3,
    rageWindowMs: 700,
    rageRadiusPx: 28,
    maxEvents: 2000,
    storageKey: "gelato.analytics.v1",
    consentKey: "gelato.analytics.consent",
    flagKey: "gelato.analytics.enabled",
    sessionKey: "gelato.analytics.sid",
    /* Remote ingest toward GelatoSocial (no secrets in browser). */
    remoteEnabled: window.GELATO_ANALYTICS_REMOTE !== false,
    apiBaseUrl: String(apiBase).replace(/\/$/, ""),
    remoteQueueKey: "gelato.analytics.remote.queue",
    remoteBatchSize: 20,
    remoteFlushMs: 4000,
    remoteMaxRetries: 5,
    siteId: "gelateria"
  };
})(window);

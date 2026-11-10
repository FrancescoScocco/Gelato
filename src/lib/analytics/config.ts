export type AnalyticsConfig = {
  enabled: boolean;
  requireConsent: boolean;
  anonymous: boolean;
  maxEvents: number;
  storageKey: string;
  consentKey: string;
  flagKey: string;
  remoteEnabled: boolean;
  apiBaseUrl: string;
  siteId: string;
  posthogKey: string;
};

export function getAnalyticsConfig(): AnalyticsConfig {
  const apiBase =
    window.GELATO_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api/v1";
  const remoteFlag =
    window.GELATO_ANALYTICS_REMOTE !== false &&
    import.meta.env.VITE_ANALYTICS_REMOTE !== "false";
  const enabled =
    typeof window.GELATO_ANALYTICS_ENABLED === "boolean"
      ? window.GELATO_ANALYTICS_ENABLED
      : true;

  return {
    enabled,
    requireConsent: true,
    anonymous: true,
    maxEvents: 2000,
    storageKey: "gelato.analytics.v1",
    consentKey: "gelato.analytics.consent",
    flagKey: "gelato.analytics.enabled",
    remoteEnabled: remoteFlag,
    apiBaseUrl: String(apiBase).replace(/\/$/, ""),
    siteId: "gelateria",
    posthogKey: "",
  };
}

import { getAnalyticsConfig } from "./config";

export type AnalyticsEvent = {
  name: string;
  ts: number;
  props?: Record<string, unknown>;
  path?: string;
  page_path?: string;
  session_id?: string;
  view_id?: string;
};

const SESSION_KEY = "gelato.analytics.sid";

export function ensureSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY) || "";
    if (!id) {
      id = `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s_${Date.now().toString(36)}`;
  }
}

export function readEvents(): AnalyticsEvent[] {
  const cfg = getAnalyticsConfig();
  try {
    const parsed = JSON.parse(localStorage.getItem(cfg.storageKey) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearEvents() {
  const cfg = getAnalyticsConfig();
  try {
    localStorage.removeItem(cfg.storageKey);
  } catch {
    /* ignore */
  }
}

export function capture(name: string, props: Record<string, unknown> = {}) {
  const cfg = getAnalyticsConfig();
  if (!cfg.enabled) return;
  try {
    const consent = localStorage.getItem(cfg.consentKey);
    if (cfg.requireConsent && consent !== "granted") return;
    if (localStorage.getItem(cfg.flagKey) === "0") return;
  } catch {
    return;
  }
  const pagePath = String(props.page_path || window.location.pathname + window.location.hash);
  const events = readEvents();
  events.push({
    name,
    ts: Date.now(),
    props,
    path: pagePath,
    page_path: pagePath,
    session_id: ensureSessionId(),
  });
  localStorage.setItem(cfg.storageKey, JSON.stringify(events.slice(-cfg.maxEvents)));
}

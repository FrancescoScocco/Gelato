/* Avvio unico: consenso, sessione anonima di scheda, reading, frustrazione, funnel. */
(function (window) {
  "use strict";

  var cfg = window.GELATO_ANALYTICS_CONFIG;
  var booted = false;

  function sessionId() {
    var existing = "";
    try { existing = window.sessionStorage.getItem(cfg.sessionKey) || ""; } catch (err) { existing = ""; }
    if (existing) return existing;
    var created = "s_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    try { window.sessionStorage.setItem(cfg.sessionKey, created); } catch (err) { /* sessione solo in memoria */ }
    return created;
  }

  function viewId() {
    return "v_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function syncPosthog(value) {
    var ph = window.posthog;
    if (!ph) return;
    try {
      if (value === "granted" && typeof ph.opt_in_capturing === "function") ph.opt_in_capturing();
      if (value !== "granted" && typeof ph.opt_out_capturing === "function") ph.opt_out_capturing();
    } catch (err) { /* il provider può non essere pronto */ }
  }

  function boot() {
    if (booted) return;
    if (window.GelatoAnalyticsConsent.get() !== "granted") return;
    if (!window.GelatoAnalyticsTransport.environmentOn()) return;
    booted = true;
    window.GelatoAnalyticsSession = { id: sessionId(), viewId: viewId() };
    if (cfg.provider === "posthog") window.GelatoAnalyticsTransport.loadPosthog();
    var reading = window.GelatoAnalyticsReading.measure();
    window.GelatoAnalyticsTransport.capture("page_view", {
      page_path: window.GelatoAnalyticsTransport.pagePath(),
      title: document.title,
      word_count: reading.word_count,
      expected_seconds: reading.expected_seconds
    });
    window.GelatoAnalyticsReading.start();
    window.GelatoAnalyticsFrustration.start();
    window.GelatoAnalyticsFunnel.start();
  }

  function start() {
    if (document.body && document.body.hasAttribute("data-analytics-admin")) {
      window.GelatoAnalytics.state = "admin";
      return;
    }
    window.GelatoAnalyticsConsent.mount();
    window.GelatoAnalyticsConsent.onChange(function (value) {
      syncPosthog(value);
      if (value === "granted") boot();
    });
    boot();
  }

  function status() {
    var reading = window.GelatoAnalyticsReading.status();
    return {
      environment: window.GelatoAnalyticsTransport.environmentOn(),
      paused: window.GelatoAnalyticsTransport.runtimePaused(),
      consent: window.GelatoAnalyticsConsent.get(),
      provider: cfg.posthogKey ? "posthog" : "local",
      anonymous: cfg.anonymous !== false,
      session_id: (window.GelatoAnalyticsSession && window.GelatoAnalyticsSession.id) || "",
      reading: reading
    };
  }

  window.GelatoAnalytics = {
    start: start,
    status: status,
    capture: function (name, props) {
      return window.GelatoAnalyticsTransport.capture(name, props);
    }
  };
})(window);

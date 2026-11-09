/* Fan-out: archivio locale + PostHog (solo dopo consenso, senza cookie, senza PII). */
(function (window) {
  "use strict";

  var cfg = window.GELATO_ANALYTICS_CONFIG;
  var pending = [];
  var posthogReady = false;
  var booted = false;

  function runtimePaused() {
    try {
      return window.localStorage.getItem(cfg.flagKey) === "0";
    } catch (err) {
      return false;
    }
  }

  function environmentOn() {
    if (window.GELATO_ANALYTICS_ENABLED === false) return false;
    if (!cfg || cfg.enabled === false) return false;
    return !runtimePaused();
  }

  function consentGranted() {
    var consent = window.GelatoAnalyticsConsent;
    if (!consent) return !cfg.requireConsent;
    return consent.get() === "granted";
  }

  function canSend() {
    return environmentOn() && consentGranted();
  }

  function pagePath() {
    var path = window.location.pathname || "/";
    path = path.replace(/index\.html$/, "");
    if (!path) path = "/";
    return path;
  }

  function strip(props) {
    var clean = {};
    var blockedKey = /^(email|e-mail|phone|telefone|tel|nome|name|message|mensagem|azienda|empresa|address|endereco|ip)$/i;
    Object.keys(props || {}).forEach(function (key) {
      if (blockedKey.test(key)) return;
      var value = props[key];
      if (value == null) return;
      if (typeof value === "string") {
        if (value.indexOf("@") !== -1) return;
        clean[key] = value.slice(0, 180);
        return;
      }
      if (typeof value === "number" && isFinite(value)) {
        clean[key] = value;
        return;
      }
      if (typeof value === "boolean") clean[key] = value;
    });
    return clean;
  }

  function session() {
    return window.GelatoAnalyticsSession || { id: "", viewId: "" };
  }

  function deliverPosthog(event) {
    if (!posthogReady || !window.posthog || typeof window.posthog.capture !== "function") {
      pending.push(event);
      return;
    }
    try {
      window.posthog.capture(event.name, strip(Object.assign({
        session_id: event.session_id,
        view_id: event.view_id
      }, event.props)));
    } catch (err) {
      /* La misura locale resta comunque registrata. */
    }
  }

  function flush() {
    if (!posthogReady) return;
    var queue = pending.splice(0, pending.length);
    queue.forEach(deliverPosthog);
  }

  function loadPosthog() {
    if (!cfg.posthogKey || booted) return;
    booted = true;

    var stub = window.posthog;
    if (!stub || !stub.__SV) {
      (function (t, e) {
        var o, n, p, r;
        if (e.__SV) return;
        window.posthog = e;
        e._i = [];
        e.init = function (i, s, a) {
          function g(target, method) {
            var parts = method.split(".");
            if (parts.length === 2) {
              target = target[parts[0]];
              method = parts[1];
            }
            target[method] = function () {
              target.push([method].concat(Array.prototype.slice.call(arguments, 0)));
            };
          }
          p = t.createElement("script");
          p.type = "text/javascript";
          p.crossOrigin = "anonymous";
          p.async = true;
          p.src = s.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") + "/static/array.js";
          r = t.getElementsByTagName("script")[0];
          r.parentNode.insertBefore(p, r);
          var u = e;
          if (a !== undefined) u = e[a] = [];
          else a = "posthog";
          u.people = u.people || [];
          o = "init capture register register_once unregister get_distinct_id get_session_id opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing".split(" ");
          for (n = 0; n < o.length; n++) g(u, o[n]);
          e._i.push([i, s, a]);
        };
        e.__SV = 1;
      })(document, window.posthog || []);
    }

    var options = {
      api_host: cfg.posthogHost,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      capture_performance: false,
      disable_session_recording: true,
      persistence: cfg.anonymous === false ? "localStorage" : "memory",
      person_profiles: "identified_only",
      respect_dnt: true,
      secure_cookie: true,
      loaded: function (ph) {
        posthogReady = true;
        try {
          if (typeof ph.opt_in_capturing === "function") ph.opt_in_capturing();
        } catch (err) { /* opzionale */ }
        flush();
      }
    };

    window.posthog.init(cfg.posthogKey, options);
  }

  function capture(name, props) {
    if (!canSend()) return null;
    var current = session();
    var event = {
      id: "e_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8),
      name: name,
      ts: Date.now(),
      session_id: current.id,
      view_id: current.viewId,
      page_path: (props && props.page_path) || pagePath(),
      props: strip(Object.assign({ page_path: (props && props.page_path) || pagePath() }, props || {}))
    };
    try {
      window.GelatoAnalyticsStore.append(event);
    } catch (err) { /* quota o storage disattivato */ }
    if (cfg.provider === "posthog" && cfg.posthogKey) deliverPosthog(event);
    return event;
  }

  window.GelatoAnalyticsTransport = {
    capture: capture,
    loadPosthog: loadPosthog,
    canSend: canSend,
    environmentOn: environmentOn,
    runtimePaused: runtimePaused,
    pagePath: pagePath
  };
})(window);

/* Consenso privacy. La scelta sta in localStorage (dato tecnico necessario).
   Il tracciamento parte solo dopo l'accettazione e resta senza cookie. */
(function (window) {
  "use strict";

  var cfg = window.GELATO_ANALYTICS_CONFIG;
  var listeners = [];
  var root = null;

  function browserOptOut() {
    var dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    if (dnt === "1" || dnt === "yes") return true;
    if (navigator.globalPrivacyControl === true) return true;
    return false;
  }

  function phrase(key, fallback) {
    if (window.GelatoI18n && typeof window.GelatoI18n.t === "function") {
      var value = window.GelatoI18n.t(key);
      if (value) return value;
    }
    return fallback;
  }

  function read() {
    try {
      var value = window.localStorage.getItem(cfg.consentKey);
      if (value === "granted" || value === "denied") return value;
    } catch (err) { /* storage assente */ }
    return "unknown";
  }

  function emit() {
    var value = read();
    listeners.forEach(function (fn) {
      try { fn(value); } catch (err) { /* un ascoltatore non blocca gli altri */ }
    });
  }

  function css() {
    if (document.getElementById("gelato-consent-css")) return;
    var style = document.createElement("style");
    style.id = "gelato-consent-css";
    style.textContent = [
      ".ga-banner{position:fixed;right:16px;bottom:16px;z-index:2000;width:min(420px,calc(100% - 32px));background:#3b040d;color:#f8e8e5;border:1px solid rgba(248,232,229,.2);border-radius:18px;padding:18px 18px 16px;box-shadow:0 18px 50px rgba(0,0,0,.35);font-family:Montserrat,Segoe UI,sans-serif}",
      ".ga-banner p{margin:0 0 14px;font-size:.82rem;line-height:1.55;color:#f2c5ce}",
      ".ga-banner strong{display:block;color:#fff;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px}",
      ".ga-banner .ga-actions{display:flex;gap:8px;flex-wrap:wrap}",
      ".ga-banner button{font-family:inherit;border-radius:999px;padding:10px 14px;font-size:.72rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase;cursor:pointer}",
      ".ga-banner .ga-accept{background:#e79aae;color:#3b040d;border:0}",
      ".ga-banner .ga-reject{background:transparent;color:#f8e8e5;border:1px solid rgba(248,232,229,.45)}",
      ".ga-privacy{display:inline-block;margin:8px 0 0;border:0;border-radius:999px;padding:8px 12px;background:#3b040d;color:#f8e8e5;font-family:Montserrat,Segoe UI,sans-serif;font-size:.68rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}"
    ].join("");
    document.head.appendChild(style);
  }

  function set(value) {
    try {
      window.localStorage.setItem(cfg.consentKey, value);
    } catch (err) { /* se non possiamo ricordare la scelta, non tracciamo */ }
    render();
    emit();
  }

  function render() {
    css();
    var value = read();
    if (!root) {
      root = document.createElement("div");
      root.setAttribute("data-analytics-ignore", "");
    }
    var host = document.querySelector("footer") || document.body;
    if (root.parentNode !== host) host.appendChild(root);
    root.innerHTML = "";

    if (value === "unknown") {
      var banner = document.createElement("div");
      banner.className = "ga-banner";
      banner.setAttribute("role", "dialog");
      banner.setAttribute("aria-label", phrase("consent.aria", "Medição anônima"));
      var copy = document.createElement("p");
      var title = document.createElement("strong");
      title.textContent = phrase("consent.title", "Medição anônima");
      copy.appendChild(title);
      var message = phrase("consent.body", "Medimos leitura, rolagem e cliques para melhorar textos e pedidos. Sem cookies de rastreamento e sem dados pessoais. Você pode recusar.");
      if (browserOptOut()) {
        message = phrase("consent.bodyOptOut", "Seu navegador pede para não ser rastreado. Nada é enviado até você aceitar. A medida é anônima, sem cookies e sem dados pessoais.");
      }
      copy.appendChild(document.createTextNode(message));
      var actions = document.createElement("div");
      actions.className = "ga-actions";
      var accept = document.createElement("button");
      accept.type = "button";
      accept.className = "ga-accept";
      accept.textContent = phrase("consent.accept", "Aceitar medições");
      accept.addEventListener("click", function () { set("granted"); });
      var reject = document.createElement("button");
      reject.type = "button";
      reject.className = "ga-reject";
      reject.textContent = phrase("consent.reject", "Recusar");
      reject.addEventListener("click", function () { set("denied"); });
      actions.appendChild(accept);
      actions.appendChild(reject);
      banner.appendChild(copy);
      banner.appendChild(actions);
      root.appendChild(banner);
      return;
    }

    var button = document.createElement("button");
    button.type = "button";
    button.className = "ga-privacy";
    button.textContent = value === "granted"
      ? phrase("consent.on", "Privacidade · ativa")
      : phrase("consent.off", "Privacidade · off");
    button.addEventListener("click", function () {
      try { window.localStorage.removeItem(cfg.consentKey); } catch (err) { /* ignore */ }
      render();
      emit();
    });
    root.appendChild(button);

  }

  document.addEventListener("gelato:lang", function () { render(); });

  function mount() {
    if (document.body) render();
    else document.addEventListener("DOMContentLoaded", render);
  }

  window.GelatoAnalyticsConsent = {
    get: read,
    set: set,
    mount: mount,
    browserOptOut: browserOptOut,
    onChange: function (fn) { listeners.push(fn); }
  };
})(window);

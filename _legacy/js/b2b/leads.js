/* Lead HoReCa: backup locale + invio remoto a GelatoSocial. */
(function (window) {
  "use strict";

  var KEY = "gelato.b2b.leads";
  var LAST = "gelato.b2b.last";
  var LAST_REMOTE = "gelato.b2b.last.remote";

  function apiBase() {
    var cfg = window.GELATO_ANALYTICS_CONFIG || {};
    var base = window.GELATO_API_BASE_URL || cfg.apiBaseUrl || "http://127.0.0.1:8000/api/v1";
    return String(base).replace(/\/$/, "");
  }

  function read() {
    try {
      var parsed = JSON.parse(window.localStorage.getItem(KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function clip(value, max) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function numberOrEmpty(value) {
    if (value === null || value === undefined || value === "") return "";
    var n = Number(value);
    return Number.isFinite(n) ? n : "";
  }

  function buildLocal(input) {
    return {
      id: clip(input.id || ("b2b_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)), 80),
      status: "lead_b2b_nuovo",
      created_at: new Date().toISOString(),
      nome: clip(input.nome, 120),
      locale: clip(input.locale, 160),
      telefone: clip(input.telefone, 40),
      citta: clip(input.citta, 80),
      tipo: clip(input.tipo, 40),
      lang: clip(input.lang, 12),
      sim_preco: numberOrEmpty(input.sim_preco),
      sim_custo: numberOrEmpty(input.sim_custo),
      sim_margem: numberOrEmpty(input.sim_margem),
      remote_id: clip(input.remote_id || "", 80)
    };
  }

  function persistLocal(lead) {
    if (!lead.nome || !lead.locale || !lead.telefone || !lead.citta) {
      throw new Error("incomplete");
    }
    var list = read().filter(function (item) { return item && item.id !== lead.id; });
    list.push(lead);
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(-200)));
    try { window.sessionStorage.setItem(LAST, lead.id); } catch (err) { /* optional */ }
    if (lead.remote_id) {
      try {
        window.sessionStorage.setItem(LAST_REMOTE, JSON.stringify({
          id: lead.remote_id,
          external_request_id: lead.id,
          saved_at: Date.now()
        }));
      } catch (err) { /* optional */ }
    }
    return lead;
  }

  function save(input) {
    return persistLocal(buildLocal(input));
  }

  function latest() {
    var id = "";
    try { id = window.sessionStorage.getItem(LAST) || ""; } catch (err) { id = ""; }
    var list = read();
    for (var i = list.length - 1; i >= 0; i -= 1) {
      if (list[i] && list[i].id === id) return list[i];
    }
    return null;
  }

  function latestRemote() {
    try {
      var parsed = JSON.parse(window.sessionStorage.getItem(LAST_REMOTE) || "null");
      if (!parsed || typeof parsed !== "object" || !parsed.id) return null;
      if (parsed.saved_at && Date.now() - Number(parsed.saved_at) > 1000 * 60 * 60 * 6) return null;
      return parsed;
    } catch (err) {
      return null;
    }
  }

  function submitRemote(input) {
    var local = buildLocal(input);
    if (!local.nome || !local.locale || !local.telefone || !local.citta) {
      return Promise.reject(new Error("incomplete"));
    }
    var payload = {
      external_request_id: local.id,
      nome: local.nome,
      nome_attivita: local.locale,
      whatsapp: local.telefone,
      citta: local.citta,
      tipo_attivita: local.tipo,
      lingua: local.lang,
      prezzo_simulato: local.sim_preco === "" ? null : local.sim_preco,
      costo_simulato: local.sim_custo === "" ? null : local.sim_custo,
      margine_simulato: local.sim_margem === "" ? null : local.sim_margem
    };
    return fetch(apiBase() + "/public/b2b/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload),
      mode: "cors",
      credentials: "omit"
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (body) {
        if (!response.ok) {
          var detail = body && body.detail ? body.detail : ("HTTP " + response.status);
          throw new Error(String(detail));
        }
        if (!body || !body.id) throw new Error("missing_id");
        local.remote_id = body.id;
        persistLocal(local);
        return { local: local, remote: body };
      });
    });
  }

  window.GelatoB2BLeads = {
    read: read,
    save: save,
    latest: latest,
    latestRemote: latestRemote,
    submitRemote: submitRemote,
    apiBase: apiBase
  };
})(window);

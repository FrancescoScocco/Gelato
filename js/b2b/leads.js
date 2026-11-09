/* Archivio lead HoReCa di questo browser. Non è un CRM remoto. */
(function (window) {
  "use strict";

  var KEY = "gelato.b2b.leads";
  var LAST = "gelato.b2b.last";

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

  function save(input) {
    var lead = {
      id: "b2b_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
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
      sim_margem: numberOrEmpty(input.sim_margem)
    };
    if (!lead.nome || !lead.locale || !lead.telefone || !lead.citta) {
      throw new Error("incomplete");
    }
    var list = read();
    list.push(lead);
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(-200)));
    try { window.sessionStorage.setItem(LAST, lead.id); } catch (err) { /* la thank you userà il link generico */ }
    return lead;
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

  window.GelatoB2BLeads = {
    read: read,
    save: save,
    latest: latest
  };
})(window);

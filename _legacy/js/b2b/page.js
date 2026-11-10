/* Invio lead, simulatore, CTA mobile e messaggio WhatsApp della thank you page. */
(function (window, document) {
  "use strict";

  /* Imposta un numero reale (solo cifre, con prefisso paese) per attivare il CTA WhatsApp. */
  var WHATSAPP = "";
  var SIM_KEY = "gelato.b2b.sim";
  var trackedSim = false;

  function whatsappConfigured() {
    return /^\d{10,15}$/.test(String(WHATSAPP || ""));
  }

  function phrase(key, fallback) {
    var i18n = window.GelatoI18n;
    var value = i18n && i18n.t ? i18n.t(key) : "";
    return value || fallback;
  }

  function fill(template, lead) {
    return String(template)
      .replace(/\{nome\}/g, lead.nome || "")
      .replace(/\{locale\}/g, lead.locale || "")
      .replace(/\{citta\}/g, lead.citta || "")
      .replace(/\{telefone\}/g, lead.telefone || "");
  }

  function whatsappHref(text) {
    return "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(text);
  }

  function paintWhatsapp(link) {
    if (!whatsappConfigured()) {
      link.hidden = true;
      link.removeAttribute("href");
      return;
    }
    var lead = window.GelatoB2BLeads && window.GelatoB2BLeads.latest ? window.GelatoB2BLeads.latest() : null;
    var text = lead
      ? fill(phrase("b2b.wa.lead", "Olá, sou {nome} do {locale} em {citta}. Quero agendar a degustação gratuita FranciBello. WhatsApp: {telefone}"), lead)
      : phrase("b2b.wa.plain", "Olá, quero agendar a degustação gratuita FranciBello.");
    link.hidden = false;
    link.href = whatsappHref(text);
  }

  function destination() {
    var path = window.location.pathname || "/b2b/";
    path = path.replace(/index\.html$/, "");
    if (path.slice(-1) !== "/") path += "/";
    return path + "obrigado/";
  }

  function showError(form) {
    var slot = form.querySelector("[data-form-error]");
    if (slot) slot.hidden = false;
  }

  function readSim() {
    try {
      var parsed = JSON.parse(window.sessionStorage.getItem(SIM_KEY) || "null");
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (err) {
      return null;
    }
  }

  function writeSim(data) {
    try { window.sessionStorage.setItem(SIM_KEY, JSON.stringify(data)); } catch (err) { /* optional */ }
  }

  function money(value) {
    try {
      return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    } catch (err) {
      return "R$ " + Number(value).toFixed(2);
    }
  }

  function percent(value) {
    try {
      return Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 0 }) + "%";
    } catch (err) {
      return Number(value).toFixed(1) + "%";
    }
  }

  function capture(name, props) {
    if (window.GelatoAnalytics && typeof window.GelatoAnalytics.capture === "function") {
      window.GelatoAnalytics.capture(name, props || {});
    }
  }

  function requestIdFor(form) {
    var key = "gelato.b2b.request." + (form.id || "lead");
    try {
      var existing = form.getAttribute("data-request-id") || window.sessionStorage.getItem(key) || "";
      if (existing) {
        form.setAttribute("data-request-id", existing);
        return existing;
      }
    } catch (err) { /* continue */ }
    var created = "b2b_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    form.setAttribute("data-request-id", created);
    try { window.sessionStorage.setItem(key, created); } catch (err) { /* optional */ }
    return created;
  }

  function onSubmit(event) {
    event.preventDefault();
    var form = event.currentTarget;
    if (typeof form.reportValidity === "function" && !form.reportValidity()) return;
    var data = new FormData(form);
    var button = form.querySelector("[type='submit']");
    var errorSlot = form.querySelector("[data-form-error]");
    var original = button ? button.textContent : "";
    var sim = readSim() || {};
    if (errorSlot) errorSlot.hidden = true;
    if (button) {
      button.disabled = true;
      button.textContent = phrase("b2b.form.loading", "Enviando…");
    }
    var payload = {
      id: requestIdFor(form),
      nome: data.get("nome"),
      locale: data.get("locale"),
      telefone: data.get("telefone"),
      citta: data.get("citta"),
      tipo: data.get("tipo"),
      lang: window.GelatoI18n && window.GelatoI18n.lang ? window.GelatoI18n.lang() : "",
      sim_preco: sim.price,
      sim_custo: sim.cost,
      sim_margem: sim.margin
    };
    capture("b2b_form_started", { track_id: form.id || "lead-form" });
    window.GelatoB2BLeads.submitRemote(payload).then(function () {
      capture("b2b_lead_converted", { lead_status: "lead_b2b_nuovo" });
      window.location.assign(destination());
    }).catch(function () {
      showError(form);
      if (button) {
        button.disabled = false;
        button.textContent = original;
      }
    });
  }

  function nearestForm(forms) {
    var mark = window.scrollY + window.innerHeight * 0.35;
    var best = forms[0];
    var bestDistance = Infinity;
    Array.prototype.forEach.call(forms, function (form) {
      var top = form.getBoundingClientRect().top + window.scrollY;
      var distance = Math.abs(top - mark);
      if (distance < bestDistance) {
        best = form;
        bestDistance = distance;
      }
    });
    return best;
  }

  function bindSticky(sticky, forms) {
    function go(event) {
      event.preventDefault();
      var form = nearestForm(forms);
      form.scrollIntoView({ behavior: "smooth", block: "start" });
      var field = form.querySelector("input");
      if (field) field.focus({ preventScroll: true });
    }
    sticky.addEventListener("click", go);

    var hiddenByFocus = false;
    function paint() {
      var formVisible = false;
      Array.prototype.forEach.call(forms, function (form) {
        var box = form.getBoundingClientRect();
        if (box.top < window.innerHeight * 0.82 && box.bottom > 80) formVisible = true;
      });
      sticky.classList.toggle("is-hidden", hiddenByFocus || formVisible);
    }
    document.addEventListener("focusin", function (event) {
      hiddenByFocus = !!(event.target && event.target.closest && event.target.closest("form.lead-form"));
      paint();
    });
    document.addEventListener("focusout", function () {
      window.setTimeout(function () {
        hiddenByFocus = !!(document.activeElement && document.activeElement.closest && document.activeElement.closest("form.lead-form"));
        paint();
      }, 40);
    });
    window.addEventListener("scroll", paint, { passive: true });
    window.addEventListener("resize", paint);
    paint();
  }

  function bindNav() {
    var nav = document.querySelector(".site-nav");
    var toggle = document.querySelector(".nav-toggle");
    var menu = document.querySelector(".site-menu");
    var closeBtn = document.querySelector(".nav-close");
    if (!nav || !toggle) return;

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("nav-locked", open);
    }

    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });
    if (closeBtn) closeBtn.addEventListener("click", function () { setOpen(false); });
    if (menu) {
      menu.addEventListener("click", function (event) {
        if (event.target === menu) setOpen(false);
      });
    }
    nav.addEventListener("click", function (event) {
      if (!event.target.closest || !event.target.closest(".site-menu-links a")) return;
      setOpen(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setOpen(false);
    });
  }

  /* Valori fittizi dimostrativi: lo slider sceglie uno scenario, senza input numerici. */
  var SIM_SCENARIOS = [
    { price: 10, cost: 4.5 },
    { price: 12, cost: 3.8 },
    { price: 14, cost: 3.2 },
    { price: 16, cost: 2.9 },
    { price: 18, cost: 2.7 }
  ];

  function bindSimulator() {
    var root = document.querySelector("[data-b2b-simulator]");
    if (!root) return;
    var slider = root.querySelector("#sim-slider");
    var metrics = root.querySelector("[data-sim-metrics]");
    var marginEl = root.querySelector("[data-sim-margin]");
    var restEl = root.querySelector("[data-sim-rest]");
    var priceEl = root.querySelector("[data-sim-price]");
    var costEl = root.querySelector("[data-sim-cost]");
    if (!slider || !metrics || !marginEl || !restEl || !priceEl || !costEl) return;

    function paint() {
      var index = Number(slider.value);
      if (!Number.isFinite(index) || index < 0) index = 0;
      if (index > SIM_SCENARIOS.length - 1) index = SIM_SCENARIOS.length - 1;
      var scenario = SIM_SCENARIOS[index];
      var price = scenario.price;
      var cost = scenario.cost;
      var rest = price - cost;
      var margin = (rest / price) * 100;

      slider.setAttribute("aria-valuenow", String(index));
      priceEl.textContent = money(price);
      costEl.textContent = money(cost);
      marginEl.textContent = percent(margin);
      restEl.textContent = money(rest);
      metrics.hidden = false;
      writeSim({
        price: price,
        cost: cost,
        margin: Math.round(margin * 10) / 10,
        rest: Math.round(rest * 100) / 100,
        scenario: index,
        demo: true
      });

      if (!trackedSim) {
        trackedSim = true;
        capture("b2b_simulator_used", { demo: true, scenario: index });
      }
    }

    slider.addEventListener("input", paint);
    document.addEventListener("gelato:lang", paint);

    var saved = readSim();
    if (saved && Number.isFinite(Number(saved.scenario))) {
      slider.value = String(Math.max(0, Math.min(SIM_SCENARIOS.length - 1, Number(saved.scenario))));
    }
    paint();
  }

  function boot() {
    bindNav();
    bindSimulator();
    var forms = document.querySelectorAll("form.lead-form");
    Array.prototype.forEach.call(forms, function (form) {
      form.addEventListener("submit", onSubmit);
    });
    var sticky = document.querySelector(".sticky-cta");
    if (sticky && forms.length) bindSticky(sticky, forms);
    var wa = document.querySelector("[data-b2b-whatsapp]");
    if (wa) {
      paintWhatsapp(wa);
      document.addEventListener("gelato:lang", function () { paintWhatsapp(wa); });
    }
  }

  if (document.body) boot();
  else document.addEventListener("DOMContentLoaded", boot);
})(window, document);

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

  function onSubmit(event) {
    event.preventDefault();
    var form = event.currentTarget;
    if (typeof form.reportValidity === "function" && !form.reportValidity()) return;
    var data = new FormData(form);
    var button = form.querySelector("[type='submit']");
    var original = button ? button.textContent : "";
    var sim = readSim() || {};
    if (button) {
      button.disabled = true;
      button.textContent = phrase("b2b.form.loading", "Enviando…");
    }
    try {
      window.GelatoB2BLeads.save({
        nome: data.get("nome"),
        locale: data.get("locale"),
        telefone: data.get("telefone"),
        citta: data.get("citta"),
        tipo: data.get("tipo"),
        lang: window.GelatoI18n && window.GelatoI18n.lang ? window.GelatoI18n.lang() : "",
        sim_preco: sim.price,
        sim_custo: sim.cost,
        sim_margem: sim.margin
      });
    } catch (err) {
      showError(form);
      if (button) {
        button.disabled = false;
        button.textContent = original;
      }
      return;
    }
    capture("b2b_lead_converted", { lead_status: "lead_b2b_nuovo" });
    window.location.assign(destination());
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
    if (!nav || !toggle) return;
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (event) {
      if (!event.target.closest || !event.target.closest(".site-menu a")) return;
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  }

  function bindSimulator() {
    var root = document.querySelector("[data-b2b-simulator]");
    if (!root) return;
    var priceInput = root.querySelector("#sim-price");
    var costInput = root.querySelector("#sim-cost");
    var status = root.querySelector("[data-sim-status]");
    var metrics = root.querySelector("[data-sim-metrics]");
    var marginEl = root.querySelector("[data-sim-margin]");
    var restEl = root.querySelector("[data-sim-rest]");
    if (!priceInput || !costInput || !status || !metrics || !marginEl || !restEl) return;

    function paint() {
      var priceRaw = String(priceInput.value || "").trim();
      var costRaw = String(costInput.value || "").trim();
      var price = Number(priceRaw);
      var cost = Number(costRaw === "" ? 0 : costRaw);

      if (priceRaw === "" && costRaw === "") {
        status.hidden = false;
        status.textContent = phrase("b2b.sim.empty", "Informe preço e custo para ver a margem estimada.");
        metrics.hidden = true;
        writeSim({});
        return;
      }

      if (!Number.isFinite(price) || price <= 0) {
        status.hidden = false;
        status.textContent = phrase("b2b.sim.invalid", "Informe um preço de venda maior que zero.");
        metrics.hidden = true;
        writeSim({});
        return;
      }

      if (!Number.isFinite(cost) || cost < 0) cost = 0;

      if (cost > price) {
        status.hidden = false;
        status.textContent = phrase("b2b.sim.negative", "O custo informado é maior que o preço. Ajuste os valores para ver uma margem positiva.");
        metrics.hidden = true;
        writeSim({ price: price, cost: cost, margin: null, rest: price - cost });
        return;
      }

      var rest = price - cost;
      var margin = (rest / price) * 100;
      status.hidden = true;
      metrics.hidden = false;
      marginEl.textContent = percent(margin);
      restEl.textContent = money(rest);
      writeSim({ price: price, cost: cost, margin: Math.round(margin * 10) / 10, rest: Math.round(rest * 100) / 100 });

      if (!trackedSim) {
        trackedSim = true;
        capture("b2b_simulator_used", {});
      }
    }

    priceInput.addEventListener("input", paint);
    costInput.addEventListener("input", paint);
    document.addEventListener("gelato:lang", paint);

    var saved = readSim();
    if (saved && saved.price !== undefined && saved.price !== "") priceInput.value = saved.price;
    if (saved && saved.cost !== undefined && saved.cost !== "") costInput.value = saved.cost;
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

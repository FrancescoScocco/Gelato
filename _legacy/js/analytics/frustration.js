/* Dead click, rage click, abbandono del modulo sull'ultimo campo toccato. */
(function (window) {
  "use strict";

  var cfg = window.GELATO_ANALYTICS_CONFIG;
  var started = false;
  var recent = [];
  var rageSentAt = 0;
  var deadCount = 0;
  var rageCount = 0;
  var lastField = null;
  var submitted = {};
  var dropoffSent = false;

  var TEXT = { P: 1, SPAN: 1, H1: 1, H2: 1, H3: 1, H4: 1, H5: 1, H6: 1, LI: 1, FIGCAPTION: 1, BLOCKQUOTE: 1, STRONG: 1, EM: 1, SMALL: 1, TIME: 1 };

  function interactive(el) {
    if (!el || !el.closest) return false;
    if (el.closest("a, button, input, select, textarea, label, summary, audio, video, [role='button'], [role='link'], [role='tab'], [role='checkbox'], [role='switch'], [contenteditable='true']")) {
      return true;
    }
    var node = el;
    while (node && node !== document.body) {
      if (node.tagName === "A" || node.tagName === "BUTTON") return true;
      var style = window.getComputedStyle(node);
      if (style.cursor === "pointer") return true;
      node = node.parentElement;
    }
    return false;
  }

  function ignored(el) {
    return !!(el && el.closest && el.closest("[data-analytics-ignore], [data-analytics-chrome]"));
  }

  function deadElement(target) {
    if (!target || target === document.body || target === document.documentElement) return null;
    if (ignored(target) || interactive(target)) return null;
    var media = target.closest && target.closest("img, picture, svg");
    if (media && !interactive(media) && !ignored(media)) return media;
    if (TEXT[target.tagName]) return target;
    if ((target.tagName === "DIV" || target.tagName === "LI") && target.innerText) {
      var text = clip(target.innerText);
      var hasControl = target.querySelector && target.querySelector("a, button, input, textarea, select");
      if (text && text.length <= 180 && !hasControl) return target;
    }
    return null;
  }

  function clip(value) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, 120);
  }

  function describe(el) {
    var node = el;
    while (node && node !== document.body) {
      if (node.tagName === "IMG") {
        var alt = clip(node.getAttribute("alt"));
        if (alt) return alt;
      }
      if (/^H[1-6]$/.test(node.tagName)) {
        var heading = clip(node.innerText);
        if (heading) return heading;
      }
      var direct = "";
      Array.prototype.forEach.call(node.childNodes || [], function (child) {
        if (child.nodeType === 3) direct += " " + child.nodeValue;
      });
      direct = clip(direct);
      if (direct) return direct;
      var label = node.getAttribute && (node.getAttribute("aria-label") || node.getAttribute("alt"));
      if (label) return clip(label);
      node = node.parentElement;
    }
    return (el.tagName || "elemento").toLowerCase();
  }

  function sectionLabel(el) {
    var section = el && el.closest ? el.closest("[data-section]") : null;
    if (!section) return "";
    return section.getAttribute("data-section") || section.id || "";
  }

  function path() {
    return window.GelatoAnalyticsTransport.pagePath();
  }

  function onClick(event) {
    if (event.button !== 0) return;
    var target = event.target;
    if (!target || !target.closest) return;
    if (ignored(target)) return;

    var now = Date.now();
    recent.push({ t: now, x: event.clientX, y: event.clientY, el: target });
    var windowMs = cfg.rageWindowMs || 700;
    var radius = cfg.rageRadiusPx || 28;
    recent = recent.filter(function (hit) { return now - hit.t <= windowMs; });
    var cluster = recent.filter(function (hit) {
      var dx = hit.x - event.clientX;
      var dy = hit.y - event.clientY;
      return Math.sqrt(dx * dx + dy * dy) <= radius;
    });
    var need = cfg.rageClicks || 3;
    if (cluster.length >= need && now - rageSentAt > windowMs && rageCount < 12) {
      rageSentAt = now;
      rageCount += 1;
      recent = [];
      window.GelatoAnalyticsTransport.capture("rage_click", {
        page_path: path(),
        tag: (target.tagName || "").toLowerCase(),
        text: describe(target),
        section_label: sectionLabel(target),
        clicks: cluster.length
      });
    }

    var dead = deadElement(target);
    if (dead && deadCount < 20) {
      deadCount += 1;
      window.GelatoAnalyticsTransport.capture("dead_click", {
        page_path: path(),
        tag: (dead.tagName || "").toLowerCase(),
        text: describe(dead),
        section_label: sectionLabel(dead)
      });
    }
  }

  function fieldLabel(field) {
    var explicit = field.getAttribute("data-field-label");
    if (explicit) return clip(explicit);
    if (field.id) {
      var lab = document.querySelector("label[for='" + String(field.id).replace(/'/g, "") + "']");
      if (lab) return clip(lab.textContent);
    }
    var wrap = field.closest("label");
    if (wrap) return clip(wrap.textContent);
    return clip(field.getAttribute("aria-label") || field.name || field.id || "campo");
  }

  function rememberField(field) {
    var form = field.closest("form");
    if (!form || ignored(field)) return;
    var formId = form.id || form.getAttribute("name") || "form";
    if (submitted[formId]) return;
    lastField = {
      form_id: formId,
      field_name: field.getAttribute("name") || field.id || "",
      field_label: fieldLabel(field)
    };
  }

  function markSubmitted(form) {
    if (!form || !form.getAttribute) return;
    var formId = form.id || form.getAttribute("name") || "form";
    submitted[formId] = true;
    if (lastField && lastField.form_id === formId) lastField = null;
  }

  function onFocus(event) {
    var field = event.target;
    if (!field || !field.matches || !field.matches("input, textarea, select")) return;
    if (field.type === "hidden" || field.type === "submit" || field.type === "button") return;
    rememberField(field);
  }

  function emitDropoff() {
    if (dropoffSent || !lastField) return;
    if (submitted[lastField.form_id]) return;
    dropoffSent = true;
    window.GelatoAnalyticsTransport.capture("form_dropoff", {
      page_path: path(),
      form_id: lastField.form_id,
      field_name: lastField.field_name,
      field_label: lastField.field_label
    });
  }

  function start() {
    if (started) return;
    started = true;
    document.addEventListener("click", onClick, true);
    document.addEventListener("focusin", onFocus, true);
    document.addEventListener("focus", onFocus, true);
    document.addEventListener("submit", function (event) {
      var form = event.target;
      if (!form || form.tagName !== "FORM") return;
      if (typeof form.checkValidity === "function" && !form.checkValidity()) return;
      markSubmitted(form);
    }, true);
    window.addEventListener("pagehide", emitDropoff);
    window.addEventListener("beforeunload", emitDropoff);
  }

  window.GelatoAnalyticsFrustration = {
    start: start,
    markSubmitted: markSubmitted
  };
})(window);

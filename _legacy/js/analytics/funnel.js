/* CTA (data-track-id / data-track-copy) e fasi funnel ordini. */
(function (window) {
  "use strict";

  var started = false;
  var FUNNEL = {
    view_catalog: true,
    expand_product_details: true,
    checkout_started: true,
    order_completed: true
  };
  var viewed = {};

  function path() {
    return window.GelatoAnalyticsTransport.pagePath();
  }

  function clip(value) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, 160);
  }

  function sectionOf(el) {
    var section = el && el.closest ? el.closest("[data-section]") : null;
    if (!section) return "";
    return section.getAttribute("data-section") || section.id || "";
  }

  function trackCopy(el) {
    var copy = el.getAttribute("data-track-copy");
    if (copy) return clip(copy);
    return clip(el.innerText || el.getAttribute("aria-label") || el.getAttribute("data-track-id"));
  }

  function emitCta(el) {
    window.GelatoAnalyticsTransport.capture("cta_click", {
      page_path: path(),
      track_id: el.getAttribute("data-track-id") || "",
      track_copy: trackCopy(el),
      section_label: sectionOf(el)
    });
  }

  function numeric(value) {
    if (value == null || value === "") return null;
    var number = Number(value);
    return isFinite(number) ? number : null;
  }

  function emitFunnel(name, el, extra) {
    if (!FUNNEL[name]) return;
    var props = extra || {};
    props.page_path = path();
    if (el) {
      var product = el.getAttribute && el.getAttribute("data-product");
      var items = el.getAttribute && el.getAttribute("data-items");
      if (product) props.product = clip(product);
      if (items != null && numeric(items) != null) props.items = numeric(items);
      if (!props.section_label) props.section_label = sectionOf(el);
    }
    window.GelatoAnalyticsTransport.capture(name, props);
  }

  function onClick(event) {
    if (event.button !== 0) return;
    var origin = event.target;
    if (!origin || !origin.closest) return;
    if (origin.closest("[data-analytics-ignore]")) return;

    var track = origin.closest("[data-track-id]");
    if (track) emitCta(track);

    var funnel = origin.closest("[data-funnel]");
    if (!funnel) return;
    var name = funnel.getAttribute("data-funnel");
    if (!FUNNEL[name]) return;
    var expanded = funnel.getAttribute("aria-expanded");
    if (expanded === "true") return;
    emitFunnel(name, funnel);
  }

  function watchCatalog() {
    var nodes = document.querySelectorAll("[data-funnel-view]");
    if (!nodes.length || typeof IntersectionObserver !== "function") {
      Array.prototype.forEach.call(nodes, function (node) {
        var name = node.getAttribute("data-funnel-view");
        if (FUNNEL[name] && !viewed[name]) {
          viewed[name] = true;
          emitFunnel(name, node);
        }
      });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var name = entry.target.getAttribute("data-funnel-view");
        if (!FUNNEL[name] || viewed[name]) return;
        viewed[name] = true;
        emitFunnel(name, entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.35 });
    Array.prototype.forEach.call(nodes, function (node) { observer.observe(node); });
  }

  function onSubmit(event) {
    var form = event.target;
    if (!form || form.tagName !== "FORM") return;
    if (form.getAttribute("data-funnel-form") !== "order") return;
    if (typeof form.checkValidity === "function" && !form.checkValidity()) return;
    var channelInput = form.querySelector("input[name='channel']:checked");
    var itemsInput = form.querySelector("[name='items']");
    var channel = channelInput ? channelInput.value : "";
    if (channel !== "b2b" && channel !== "b2c") channel = "";
    emitFunnel("order_completed", form, {
      channel: channel,
      items: itemsInput ? numeric(itemsInput.value) : null
    });
  }

  function start() {
    if (started) return;
    started = true;
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    watchCatalog();
  }

  window.GelatoAnalyticsFunnel = { start: start };
})(window);

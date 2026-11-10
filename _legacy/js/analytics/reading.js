/* Reading engine: profondità, lettura effettiva vs teorica, sezione di abbandono. */
(function (window) {
  "use strict";

  var cfg = window.GELATO_ANALYTICS_CONFIG;
  var started = false;
  var left = false;
  var words = 0;
  var expected = 0;
  var activeMs = 0;
  var lastTick = 0;
  var visible = true;
  var depth = 0;
  var section = { id: "", label: "" };
  var fired = {};
  var readDone = false;
  var timer = 0;
  var root = null;
  var skipCache = typeof WeakMap === "function" ? new WeakMap() : null;

  function shouldCountAsRead(depthPercent, seconds, wordCount, wpm) {
    if (!wordCount || wordCount <= 0) return false;
    if (depthPercent < (cfg.readDepth || 75)) return false;
    var theory = (wordCount / (wpm || 200)) * 60;
    return seconds >= theory;
  }

  function expectedSeconds(wordCount, wpm) {
    if (!wordCount || wordCount <= 0) return 0;
    return (wordCount / (wpm || 200)) * 60;
  }

  function rememberSkip(from, value) {
    if (!skipCache) return;
    var node = from;
    while (node && node !== document.documentElement) {
      skipCache.set(node, value);
      if (value === true) return;
      node = node.parentElement;
    }
  }

  function isSkipped(el) {
    var node = el && el.nodeType === 1 ? el : el && el.parentElement;
    if (!node) return true;
    if (skipCache && skipCache.has(node)) return skipCache.get(node);
    var cursor = node;
    while (cursor && cursor !== document.documentElement) {
      if (skipCache && skipCache.has(cursor)) {
        rememberSkip(node, skipCache.get(cursor));
        return skipCache.get(cursor);
      }
      var tag = cursor.tagName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || cursor.hasAttribute("hidden") || cursor.hasAttribute("data-analytics-chrome") || cursor.hasAttribute("data-analytics-ignore")) {
        rememberSkip(node, true);
        return true;
      }
      var style = window.getComputedStyle(cursor);
      if (style.display === "none" || style.visibility === "hidden") {
        rememberSkip(node, true);
        return true;
      }
      cursor = cursor.parentElement;
    }
    rememberSkip(node, false);
    return false;
  }

  function countWords(scope) {
    var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (isSkipped(node.parentElement)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var count = 0;
    while (walker.nextNode()) {
      count += walker.currentNode.nodeValue.trim().split(/\s+/).filter(Boolean).length;
    }
    return count;
  }

  function readRoot() {
    return document.querySelector("[data-read-root]") || document.body;
  }

  function depthPercent() {
    var target = root || document.body;
    var scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    if (target === document.body || target === document.documentElement) {
      var height = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      var max = height - window.innerHeight;
      if (max <= 8) return 100;
      return Math.max(0, Math.min(100, (scrollTop / max) * 100));
    }
    var rect = target.getBoundingClientRect();
    var top = scrollTop + rect.top;
    var total = target.scrollHeight || target.offsetHeight;
    var viewed = scrollTop + window.innerHeight - top;
    if (total <= window.innerHeight) return 100;
    return Math.max(0, Math.min(100, (viewed / total) * 100));
  }

  function currentSection() {
    var nodes = document.querySelectorAll("[data-section]");
    var best = null;
    var bestScore = 0;
    var vh = window.innerHeight || 1;
    Array.prototype.forEach.call(nodes, function (el) {
      if (isSkipped(el)) return;
      var rect = el.getBoundingClientRect();
      var visiblePx = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
      if (visiblePx > bestScore) {
        bestScore = visiblePx;
        best = el;
      }
    });
    if (!best) return { id: "", label: "" };
    return {
      id: best.id || "",
      label: best.getAttribute("data-section") || best.id || ""
    };
  }

  function seconds() {
    tick();
    return Math.round(activeMs / 1000);
  }

  function tick() {
    var now = window.performance ? window.performance.now() : Date.now();
    if (!lastTick) lastTick = now;
    var delta = now - lastTick;
    lastTick = now;
    if (visible && delta > 0 && delta < 5000) activeMs += delta;
  }

  function roundedDepth() {
    return Math.round(depth);
  }

  function evaluate() {
    if (left) return;
    tick();
    depth = depthPercent();
    section = currentSection();
    var marks = cfg.scrollMarks || [25, 50, 75, 100];
    var elapsed = Math.round(activeMs / 1000);
    marks.forEach(function (mark) {
      if (depth + 0.6 >= mark && !fired[mark]) {
        fired[mark] = true;
        window.GelatoAnalyticsTransport.capture("page_scroll_depth", {
          page_path: window.GelatoAnalyticsTransport.pagePath(),
          depth_percentage: mark,
          time_seconds: elapsed
        });
      }
    });
    if (!readDone && shouldCountAsRead(depth, elapsed, words, cfg.wordsPerMinute)) {
      readDone = true;
      window.GelatoAnalyticsTransport.capture("content_read_completed", {
        page_path: window.GelatoAnalyticsTransport.pagePath(),
        word_count: words,
        time_seconds: elapsed,
        expected_seconds: Math.round(expected),
        depth_percentage: roundedDepth()
      });
    }
  }

  var scheduled = false;
  function onScroll() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(function () {
      scheduled = false;
      evaluate();
    });
  }

  function leave() {
    if (left) return;
    evaluate();
    left = true;
    window.GelatoAnalyticsTransport.capture("content_dropoff", {
      page_path: window.GelatoAnalyticsTransport.pagePath(),
      section_id: section.id,
      section_label: section.label,
      depth_percentage: roundedDepth(),
      time_seconds: seconds()
    });
    window.clearInterval(timer);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("pagehide", leave);
    window.removeEventListener("beforeunload", leave);
  }

  function measure() {
    root = readRoot();
    words = countWords(root);
    expected = expectedSeconds(words, cfg.wordsPerMinute);
    return { word_count: words, expected_seconds: Math.round(expected) };
  }

  function start() {
    if (started) return measure();
    started = true;
    visible = document.visibilityState !== "hidden";
    lastTick = window.performance ? window.performance.now() : Date.now();
    measure();
    evaluate();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", function () {
      tick();
      visible = document.visibilityState !== "hidden";
    });
    window.addEventListener("pagehide", leave);
    window.addEventListener("beforeunload", leave);
    timer = window.setInterval(evaluate, 1000);
    return { word_count: words, expected_seconds: Math.round(expected) };
  }

  function status() {
    tick();
    return {
      word_count: words,
      expected_seconds: Math.round(expected),
      time_seconds: Math.round(activeMs / 1000),
      depth_percentage: roundedDepth(),
      section_label: section.label,
      read_completed: readDone
    };
  }

  window.GelatoAnalyticsReading = {
    measure: measure,
    start: start,
    status: status,
    shouldCountAsRead: shouldCountAsRead,
    expectedSeconds: expectedSeconds
  };
})(window);

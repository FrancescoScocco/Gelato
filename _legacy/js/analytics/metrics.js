/* Aggregazioni per la dashboard Lab. Funzioni pure, senza DOM. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.GelatoAnalyticsMetrics = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function props(event) {
    return event.props || {};
  }

  function pageOf(event) {
    return event.page_path || props(event).page_path || "(sconosciuta)";
  }

  function sessions(list) {
    var seen = {};
    list.forEach(function (event) {
      if (event.session_id) seen[event.session_id] = true;
    });
    return Object.keys(seen).length;
  }

  function byPage(events) {
    var groups = {};
    events.forEach(function (event) {
      var key = pageOf(event);
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    });
    return groups;
  }

  function maxNumber(values) {
    var max = null;
    values.forEach(function (value) {
      if (typeof value !== "number" || !isFinite(value)) return;
      if (max === null || value > max) max = value;
    });
    return max;
  }

  function average(values) {
    var nums = values.filter(function (value) { return typeof value === "number" && isFinite(value); });
    if (!nums.length) return null;
    var sum = nums.reduce(function (total, value) { return total + value; }, 0);
    return sum / nums.length;
  }

  var DEPTH_EVENTS = {
    page_scroll_depth: true,
    content_dropoff: true,
    content_read_completed: true
  };

  function pages(events) {
    var groups = byPage(events);
    return Object.keys(groups).map(function (path) {
      var list = groups[path];
      var bySession = {};
      list.forEach(function (event) {
        if (!event.session_id) return;
        if (!bySession[event.session_id]) bySession[event.session_id] = [];
        bySession[event.session_id].push(event);
      });
      var times = [];
      var depths = [];
      var expected = [];
      var reads = 0;
      var visits = 0;
      Object.keys(bySession).forEach(function (id) {
        var mine = bySession[id];
        if (!mine.some(function (event) { return event.name === "page_view"; })) return;
        visits += 1;
        var time = maxNumber(mine.map(function (event) { return props(event).time_seconds; }));
        var depth = maxNumber(mine.map(function (event) {
          if (!DEPTH_EVENTS[event.name]) return null;
          return props(event).depth_percentage;
        }));
        if (time !== null) times.push(time);
        if (depth !== null) depths.push(depth);
        if (mine.some(function (event) { return event.name === "content_read_completed"; })) reads += 1;
        mine.forEach(function (event) {
          if (event.name === "page_view" && typeof props(event).expected_seconds === "number") {
            expected.push(props(event).expected_seconds);
          }
        });
      });
      return {
        page_path: path,
        visits: visits,
        avg_time_seconds: average(times),
        avg_depth: average(depths),
        expected_seconds: average(expected),
        reads: reads,
        measured: times.length
      };
    }).sort(function (a, b) { return b.visits - a.visits || a.page_path.localeCompare(b.page_path); });
  }

  function dropoff(events) {
    var groups = byPage(events);
    return Object.keys(groups).map(function (path) {
      var list = groups[path];
      var views = {};
      list.forEach(function (event) {
        if (!event.view_id) return;
        if (!views[event.view_id]) views[event.view_id] = { depth: null, left: false, section: "" };
        var row = views[event.view_id];
        if (event.name === "content_dropoff") {
          row.left = true;
          row.section = props(event).section_label || row.section;
          if (typeof props(event).depth_percentage === "number") {
            row.depth = row.depth === null ? props(event).depth_percentage : Math.max(row.depth, props(event).depth_percentage);
          }
        }
        if (event.name === "page_scroll_depth" && typeof props(event).depth_percentage === "number") {
          row.depth = row.depth === null ? props(event).depth_percentage : Math.max(row.depth, props(event).depth_percentage);
        }
      });
      var exits = Object.keys(views).map(function (id) { return views[id]; }).filter(function (row) { return row.left; });
      var early = exits.filter(function (row) { return row.depth !== null && row.depth < 50; });
      var sections = {};
      early.forEach(function (row) {
        var key = row.section || "—";
        sections[key] = (sections[key] || 0) + 1;
      });
      var topSection = "—";
      var topCount = 0;
      Object.keys(sections).forEach(function (key) {
        if (sections[key] > topCount) {
          topCount = sections[key];
          topSection = key;
        }
      });
      return {
        page_path: path,
        exits: exits.length,
        early: early.length,
        rate: exits.length ? early.length / exits.length : 0,
        section_label: topSection
      };
    }).filter(function (row) { return row.exits > 0; })
      .sort(function (a, b) { return b.rate - a.rate || b.early - a.early || a.page_path.localeCompare(b.page_path); });
  }

  function cta(events) {
    var visitsByPage = {};
    events.forEach(function (event) {
      if (event.name !== "page_view") return;
      var path = pageOf(event);
      if (!visitsByPage[path]) visitsByPage[path] = {};
      if (event.session_id) visitsByPage[path][event.session_id] = true;
    });
    var groups = {};
    events.forEach(function (event) {
      if (event.name !== "cta_click") return;
      var path = pageOf(event);
      var section = props(event).section_label || "—";
      var copy = props(event).track_copy || props(event).track_id || "CTA";
      var id = props(event).track_id || copy;
      var key = path + "|" + section + "|" + id;
      if (!groups[key]) {
        groups[key] = {
          page_path: path,
          section_label: section,
          track_id: id,
          track_copy: copy,
          clicks: 0,
          sessions: {}
        };
      }
      groups[key].clicks += 1;
      if (event.session_id) groups[key].sessions[event.session_id] = true;
    });
    return Object.keys(groups).map(function (key) {
      var row = groups[key];
      var unique = Object.keys(row.sessions).length;
      var visits = visitsByPage[row.page_path] ? Object.keys(visitsByPage[row.page_path]).length : 0;
      return {
        page_path: row.page_path,
        section_label: row.section_label,
        track_id: row.track_id,
        track_copy: row.track_copy,
        clicks: row.clicks,
        unique_clicks: unique,
        visits: visits,
        ctr: visits ? unique / visits : 0
      };
    }).sort(function (a, b) { return b.ctr - a.ctr || b.clicks - a.clicks; });
  }

  function forms(events) {
    var steps = ["view_catalog", "expand_product_details", "checkout_started", "order_completed"];
    var funnel = steps.map(function (name) {
      var list = events.filter(function (event) { return event.name === name; });
      return { name: name, events: list.length, sessions: sessions(list) };
    });
    var fields = {};
    events.forEach(function (event) {
      if (event.name !== "form_dropoff") return;
      var formId = props(event).form_id || "form";
      var label = props(event).field_label || props(event).field_name || "campo";
      var key = formId + "|" + label;
      if (!fields[key]) fields[key] = { form_id: formId, field_label: label, exits: 0 };
      fields[key].exits += 1;
    });
    var checkout = funnel[2].sessions;
    var orders = funnel[3].sessions;
    return {
      funnel: funnel,
      order_rate: checkout ? orders / checkout : 0,
      fields: Object.keys(fields).map(function (key) { return fields[key]; })
        .sort(function (a, b) { return b.exits - a.exits || a.field_label.localeCompare(b.field_label); })
    };
  }

  return {
    pages: pages,
    dropoff: dropoff,
    cta: cta,
    forms: forms
  };
});

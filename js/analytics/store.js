/* Archivio locale di prima parte. Nessun identificativo oltre la sessione di scheda. */
(function (window) {
  "use strict";

  var KEY = (window.GELATO_ANALYTICS_CONFIG && window.GELATO_ANALYTICS_CONFIG.storageKey) || "gelato.analytics.v1";
  var MAX = (window.GELATO_ANALYTICS_CONFIG && window.GELATO_ANALYTICS_CONFIG.maxEvents) || 2000;

  function empty() {
    return { v: 1, events: [] };
  }

  function read() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return empty();
      var data = JSON.parse(raw);
      if (!data || !Array.isArray(data.events)) return empty();
      return data;
    } catch (err) {
      return empty();
    }
  }

  function write(data) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch (err) {
      data.events = data.events.slice(-Math.ceil(MAX / 2));
      try { window.localStorage.setItem(KEY, JSON.stringify(data)); } catch (again) { /* archivio pieno */ }
    }
  }

  function append(event) {
    var data = read();
    data.events.push(event);
    if (data.events.length > MAX) {
      data.events = data.events.slice(data.events.length - MAX);
    }
    write(data);
    return event;
  }

  function clear() {
    write(empty());
  }

  window.GelatoAnalyticsStore = {
    key: KEY,
    read: read,
    append: append,
    clear: clear
  };
})(window);

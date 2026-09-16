(function () {
  var ENDPOINT = '/api/analytics/event';
  var SENT_KEY = 'unichanl_analytics_sent';

  function readSent() {
    try {
      var raw = localStorage.getItem(SENT_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) { return {}; }
  }
  function writeSent(map) {
    try { localStorage.setItem(SENT_KEY, JSON.stringify(map)); } catch (_) {}
  }

  function post(payload) {
    var body = JSON.stringify(payload);
    try {
      if (navigator.sendBeacon) {
        var blob = new Blob([body], { type: 'application/json' });
        if (navigator.sendBeacon(ENDPOINT, blob)) return;
      }
    } catch (_) {}
    try {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
        keepalive: true,
        credentials: 'same-origin',
      }).catch(function () {});
    } catch (_) {}
  }

  function track(event, meta) {
    if (!event) return;
    var payload = {
      event: event,
      path: location.pathname + location.search,
      ref: document.referrer || undefined,
    };
    if (meta && typeof meta === 'object') payload.meta = meta;
    post(payload);
  }

  function trackOnce(event, meta) {
    var sent = readSent();
    if (sent[event]) return;
    sent[event] = Date.now();
    writeSent(sent);
    track(event, meta);
  }

  window.unichanlAnalytics = { track: track, trackOnce: trackOnce };

  // Auto page_view
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { track('page_view'); });
  } else {
    track('page_view');
  }

  // CTA clicks: any element with data-track="<event>"
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest && e.target.closest('[data-track]');
    if (!el) return;
    var evt = el.getAttribute('data-track');
    if (!evt) return;
    var meta = {};
    var label = el.getAttribute('data-track-label');
    if (label) meta.label = label;
    track('cta_click', { name: evt, label: label || undefined });
  }, true);
})();

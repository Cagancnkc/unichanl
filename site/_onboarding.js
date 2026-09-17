(function () {
  // Server sync + funnel tracker. UI moved to _setup_wizard.js.
  // Overview loader already fetches /api/dashboard/onboarding-status on boot,
  // so this module skips the initial fetch and starts polling only.

  var lastFetch = 0;
  var MIN_GAP_MS = 60000;
  var inflight = null;

  function refreshOnboarding(force) {
    var now = Date.now();
    if (!force && now - lastFetch < MIN_GAP_MS) return Promise.resolve();
    if (inflight) return inflight;
    var k = null;
    try { k = localStorage.getItem('unichanl_key'); } catch (_) {}
    if (!k) return Promise.resolve();
    lastFetch = now;
    inflight = fetch('/api/dashboard/onboarding-status', { headers: { Authorization: 'Bearer ' + k } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (o) {
        if (!o) return;
        if (!window.__unichanl) window.__unichanl = {};
        var prev = window.__unichanl.onboarding;
        window.__unichanl.onboarding = o;
        try {
          if (o.steps) {
            if (o.steps.topup && o.steps.topup.done && (!prev || !prev.steps || !prev.steps.topup || !prev.steps.topup.done)) {
              window.unichanlAnalytics && window.unichanlAnalytics.trackOnce('first_topup_success');
            }
            if (o.steps.rules && o.steps.rules.done && (!prev || !prev.steps || !prev.steps.rules || !prev.steps.rules.done)) {
              window.unichanlAnalytics && window.unichanlAnalytics.trackOnce('first_rule_created');
            }
          }
        } catch (_) {}
        try { window.dispatchEvent(new CustomEvent('unichanl:onboarding', { detail: o })); } catch (_) {}
      })
      .catch(function () {})
      .then(function () { inflight = null; });
    return inflight;
  }

  var pollHandle = null;
  function scheduleNext() {
    if (pollHandle) return;
    var jitter = 60000 + Math.floor(Math.random() * 12000);
    pollHandle = setTimeout(function () {
      pollHandle = null;
      if (document.visibilityState !== 'hidden') {
        refreshOnboarding(true).finally(scheduleNext);
      } else {
        scheduleNext();
      }
    }, jitter);
  }
  function stopPolling() {
    if (!pollHandle) return;
    clearTimeout(pollHandle);
    pollHandle = null;
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      refreshOnboarding(false);
      scheduleNext();
    } else {
      stopPolling();
    }
  });
  window.addEventListener('focus', function () { refreshOnboarding(false); });

  // Seed lastFetch from any overview fetch that just landed, so we don't double up.
  if (window.__unichanl && window.__unichanl.onboarding) {
    lastFetch = Date.now();
  }

  window.__unichanlOnboardingSync = { refresh: function () { return refreshOnboarding(true); } };

  scheduleNext();
})();

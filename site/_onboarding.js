(function () {
  // Server sync + funnel tracker. UI moved to _setup_wizard.js.

  function refreshOnboarding() {
    var k = null;
    try { k = localStorage.getItem('unichanl_key'); } catch (_) {}
    if (!k) return;
    fetch('/api/dashboard/onboarding-status', { headers: { Authorization: 'Bearer ' + k } })
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
      }).catch(function () {});
  }

  var pollHandle = null;
  function startPolling() {
    if (pollHandle) return;
    pollHandle = setInterval(function () {
      if (document.visibilityState === 'hidden') return;
      refreshOnboarding();
    }, 60000);
  }
  function stopPolling() {
    if (!pollHandle) return;
    clearInterval(pollHandle);
    pollHandle = null;
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') refreshOnboarding();
    else stopPolling();
  });
  window.addEventListener('focus', refreshOnboarding);

  window.__unichanlOnboardingSync = { refresh: refreshOnboarding };

  refreshOnboarding();
  startPolling();
})();

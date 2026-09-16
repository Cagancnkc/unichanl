(function () {
  var WIZ_ID = 'uc-wiz';
  var STYLE_ID = 'uc-wiz-css';
  var SPOT_ID = 'uc-wiz-spot';
  var WELCOME_ID = 'uc-wiz-welcome';

  var ACCENT = '#DFFF00';
  var ACCENT_SOFT = 'rgba(223,255,0,0.08)';
  var ACCENT_BORDER = 'rgba(223,255,0,0.35)';
  var TEXT = '#F2F5F4';
  var MUTED = '#98A3A3';
  var DIM = '#657172';
  var BORDER = '#1C2A2D';
  var CARD_BG = '#071114';
  var PAGE_BG = '#03090B';
  var GREEN = '#4ADE80';

  var LS = {
    DISMISSED: 'unichanl.wizard.dismissed',
    WELCOME: 'unichanl.wizard.welcome_shown',
    INT_DONE: 'unichanl.wizard.step.integration.done',
    skipKey: function (k) { return 'unichanl.wizard.step.' + k + '.skipped'; }
  };
  var SS_COLLAPSED = 'unichanl.wizard.collapsed';

  var STEPS = [
    { key: 'topup',       n: 1, title: 'Bakiye Yükle',              cta: 'Bakiye Yükle',                hint: 'İlk isteklerin için hesabına bakiye ekle. Header\u2019daki krediler alanı kullanılır.' },
    { key: 'apiKey',      n: 2, title: 'API Key Al',                cta: 'API Keys sayfasına git',      hint: 'Uygulamandan veya CLI\u2019dan istek göndermek için bir API anahtarı oluştur.' },
    { key: 'rules',       n: 3, title: 'Yönlendirme Kuralı Oluştur', cta: 'Yönlendirme sayfasına git',  hint: 'İsteklerinin hangi modele nasıl gideceğini belirle. Hazır şablonla başlayabilirsin.' },
    { key: 'integration', n: 4, title: 'Entegrasyon Yap',           cta: 'Entegrasyonlar sayfasına git', hint: 'Cursor, Claude Code veya diğer istemcileri Unichanl\u2019a bağla.' }
  ];

  function ls(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (_) {} }
  function ss(k) { try { return sessionStorage.getItem(k); } catch (_) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (_) {} }

  function track(evt, meta) {
    try { window.unichanlAnalytics && window.unichanlAnalytics.track(evt, meta || {}); } catch (_) {}
  }
  function trackOnce(evt, meta) {
    try { window.unichanlAnalytics && window.unichanlAnalytics.trackOnce(evt, meta || {}); } catch (_) {}
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function stepState(step) {
    var onb = (window.__unichanl && window.__unichanl.onboarding) || null;
    var done = false, skipped = ls(LS.skipKey(step.key)) === '1';
    if (step.key === 'integration') {
      done = ls(LS.INT_DONE) === '1';
    } else if (onb && onb.steps && onb.steps[step.key]) {
      done = !!onb.steps[step.key].done;
    }
    return { done: done, skipped: skipped };
  }

  function computeActive() {
    for (var i = 0; i < STEPS.length; i++) {
      var s = stepState(STEPS[i]);
      if (!s.done && !s.skipped) return STEPS[i].n;
    }
    return null;
  }

  function isCompleted() {
    if (ls(LS.DISMISSED) === '1') return true;
    return computeActive() == null;
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css = document.createElement('style');
    css.id = STYLE_ID;
    css.textContent = [
      '@keyframes uc-wiz-pulse{0%,100%{box-shadow:0 0 0 0 rgba(223,255,0,.55),0 0 0 4px rgba(223,255,0,.28)}50%{box-shadow:0 0 0 6px rgba(223,255,0,0),0 0 0 4px rgba(223,255,0,.15)}}',
      '@keyframes uc-wiz-in{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}',
      '@keyframes uc-wiz-fade{from{opacity:0}to{opacity:1}}',
      '#' + WIZ_ID + '{position:fixed;right:24px;bottom:24px;z-index:150;width:360px;max-width:calc(100vw - 32px);background:' + CARD_BG + ';border:1px solid ' + BORDER + ';border-radius:14px;box-shadow:0 18px 48px rgba(0,0,0,.55);color:' + TEXT + ";font-family:'Archivo',system-ui,sans-serif;animation:uc-wiz-in .32s ease}",
      '#' + WIZ_ID + ' .uw-hd{display:flex;align-items:center;gap:10px;padding:14px 16px 10px;border-bottom:1px solid ' + BORDER + '}',
      '#' + WIZ_ID + ' .uw-icon{width:28px;height:28px;border-radius:8px;background:' + ACCENT + ';display:grid;place-items:center;color:' + PAGE_BG + ';flex:none}',
      '#' + WIZ_ID + ' .uw-title{font-weight:700;font-size:13.5px;color:' + TEXT + '}',
      '#' + WIZ_ID + " .uw-sub{font:600 10px 'JetBrains Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:" + ACCENT + '}',
      '#' + WIZ_ID + ' .uw-min{margin-left:auto;background:transparent;border:1px solid ' + BORDER + ';color:' + MUTED + ";width:26px;height:26px;border-radius:7px;cursor:pointer;font:700 14px 'Archivo';line-height:1}",
      '#' + WIZ_ID + ' .uw-min:hover{color:' + TEXT + ';border-color:' + ACCENT_BORDER + '}',
      '#' + WIZ_ID + ' .uw-prog{padding:10px 16px 4px}',
      '#' + WIZ_ID + " .uw-prog-row{display:flex;align-items:center;gap:10px;font:600 11px 'JetBrains Mono',monospace;color:" + MUTED + '}',
      '#' + WIZ_ID + ' .uw-bar{flex:1;height:4px;background:' + BORDER + ';border-radius:99px;overflow:hidden}',
      '#' + WIZ_ID + ' .uw-fill{height:100%;background:' + ACCENT + ';transition:width .3s ease;box-shadow:0 0 8px ' + ACCENT + '}',
      '#' + WIZ_ID + ' .uw-pct{color:' + ACCENT + ';min-width:34px;text-align:right}',
      '#' + WIZ_ID + ' .uw-list{padding:8px 8px 6px}',
      '#' + WIZ_ID + ' .uw-item{display:flex;align-items:flex-start;gap:10px;padding:10px 10px;border-radius:10px;transition:background .15s;cursor:default}',
      '#' + WIZ_ID + ' .uw-item.active{background:' + ACCENT_SOFT + ';outline:1px solid ' + ACCENT_BORDER + '}',
      '#' + WIZ_ID + ' .uw-cir{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;flex:none;font:700 11px "JetBrains Mono",monospace;margin-top:1px}',
      '#' + WIZ_ID + ' .uw-cir.done{background:' + GREEN + ';color:' + PAGE_BG + '}',
      '#' + WIZ_ID + ' .uw-cir.skip{background:transparent;border:2px solid ' + DIM + ';color:' + DIM + '}',
      '#' + WIZ_ID + ' .uw-cir.active{background:transparent;border:2px solid ' + ACCENT + ';color:' + ACCENT + ';box-shadow:0 0 0 3px ' + ACCENT_SOFT + '}',
      '#' + WIZ_ID + ' .uw-cir.future{background:transparent;border:2px solid ' + BORDER + ';color:' + DIM + '}',
      '#' + WIZ_ID + ' .uw-body{flex:1;min-width:0}',
      '#' + WIZ_ID + ' .uw-name{font:600 13px Archivo,sans-serif;color:' + TEXT + '}',
      '#' + WIZ_ID + ' .uw-item.done .uw-name,#' + WIZ_ID + ' .uw-item.skip .uw-name{color:' + MUTED + '}',
      '#' + WIZ_ID + ' .uw-hint{font-size:12px;color:' + MUTED + ';margin-top:3px;line-height:1.4}',
      '#' + WIZ_ID + ' .uw-actions{display:flex;gap:8px;margin-top:10px;align-items:center;flex-wrap:wrap}',
      '#' + WIZ_ID + " .uw-cta{background:" + ACCENT + ';color:' + PAGE_BG + ";border:none;border-radius:8px;padding:8px 14px;font:700 12px 'Archivo';cursor:pointer;transition:filter .12s}",
      '#' + WIZ_ID + ' .uw-cta:hover{filter:brightness(1.08)}',
      '#' + WIZ_ID + " .uw-skip{background:transparent;border:none;color:" + DIM + ";font:600 12px 'Archivo';cursor:pointer;text-decoration:underline;text-underline-offset:2px}",
      '#' + WIZ_ID + ' .uw-skip:hover{color:' + MUTED + '}',
      '#' + WIZ_ID + ' .uw-tag{font:600 9.5px "JetBrains Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:' + DIM + '}',
      '#' + WIZ_ID + ' .uw-item.skip .uw-tag{color:' + DIM + '}',
      '#' + WIZ_ID + ' .uw-item.done .uw-tag{color:' + GREEN + '}',
      '#' + WIZ_ID + ' .uw-ft{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-top:1px solid ' + BORDER + '}',
      '#' + WIZ_ID + " .uw-finish{background:transparent;color:" + MUTED + ';border:1px solid ' + BORDER + ";border-radius:8px;padding:7px 12px;font:600 12px 'Archivo';cursor:pointer}",
      '#' + WIZ_ID + ' .uw-finish:hover{color:' + TEXT + ';border-color:' + ACCENT_BORDER + '}',
      '#' + WIZ_ID + '.uw-collapsed{width:auto;padding:0}',
      '#' + WIZ_ID + ' .uw-fab{display:none;align-items:center;gap:10px;padding:10px 14px;cursor:pointer}',
      '#' + WIZ_ID + '.uw-collapsed .uw-hd,#' + WIZ_ID + '.uw-collapsed .uw-prog,#' + WIZ_ID + '.uw-collapsed .uw-list,#' + WIZ_ID + '.uw-collapsed .uw-ft{display:none}',
      '#' + WIZ_ID + '.uw-collapsed .uw-fab{display:flex}',
      '#' + WIZ_ID + " .uw-fab-txt{font:700 12.5px 'Archivo';color:" + TEXT + '}',
      '#' + WIZ_ID + " .uw-fab-count{font:700 11px 'JetBrains Mono',monospace;color:" + ACCENT + '}',

      // spotlight overlay
      '#' + SPOT_ID + '{position:fixed;inset:0;z-index:140;pointer-events:auto;animation:uc-wiz-fade .2s ease}',
      '#' + SPOT_ID + ' .uw-hole{position:absolute;border-radius:12px;box-shadow:0 0 0 9999px rgba(3,9,11,.72);outline:2px solid ' + ACCENT + ';animation:uc-wiz-pulse 1.6s ease-in-out infinite;pointer-events:none}',
      '#' + SPOT_ID + ' .uw-spot-tip{position:absolute;background:' + CARD_BG + ';border:1px solid ' + ACCENT_BORDER + ";border-radius:10px;padding:10px 12px;color:" + TEXT + ";font:600 12.5px 'Archivo';box-shadow:0 12px 28px rgba(0,0,0,.5);max-width:240px}",

      // highlights on target pages
      'body[data-wiz-highlight="apikey"] [data-wiz-target="apikey"],body[data-wiz-highlight="rules"] [data-wiz-target="rules"],body[data-wiz-highlight="integration"] [data-wiz-target="integration"]{outline:2px solid ' + ACCENT + ';outline-offset:3px;border-radius:10px;animation:uc-wiz-pulse 1.6s ease-in-out infinite;position:relative;z-index:1}',

      // welcome overlay
      '#' + WELCOME_ID + '{position:fixed;inset:0;background:radial-gradient(ellipse at center,rgba(223,255,0,.08),rgba(3,9,11,.94) 60%);z-index:200;display:grid;place-items:center;animation:uc-wiz-fade .35s ease;cursor:pointer}',
      '#' + WELCOME_ID + ' .uw-wel{text-align:center;padding:24px}',
      '#' + WELCOME_ID + " .uw-wel h2{font-family:'Newsreader',serif;font-weight:400;font-size:42px;line-height:1.1;letter-spacing:-.01em;color:" + TEXT + ";margin:0 0 10px;text-shadow:0 0 24px rgba(223,255,0,.4)}",
      '#' + WELCOME_ID + " .uw-wel p{color:" + MUTED + ";font-size:15px;margin:0}",
      '#' + WELCOME_ID + '.uw-fade-out{opacity:0;transition:opacity .35s ease}',

      '@media (max-width:640px){#' + WIZ_ID + '{right:12px;left:12px;bottom:12px;width:auto;max-height:70vh;overflow:auto}#' + WELCOME_ID + ' .uw-wel h2{font-size:30px}}'
    ].join('\n');
    document.head.appendChild(css);
  }

  function checkIcon() {
    return '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>';
  }
  function rocketIcon() {
    return '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1-2 5-2 5s4-.5 5-2c.5-.9.4-2.2-.4-3-.8-.8-2.1-.9-3-.4z"/><path d="M12 15l-3-3a22 22 0 0 1 8-11c3 0 6 3 6 6a22 22 0 0 1-11 8"/></svg>';
  }

  function buildHTML(active, doneCount) {
    var pct = Math.round((doneCount / STEPS.length) * 100);
    var rows = STEPS.map(function (s) {
      var st = stepState(s);
      var isActive = s.n === active;
      var cls, cir, tag;
      if (st.done) { cls = 'done'; cir = 'done'; tag = 'Tamamlandı'; }
      else if (st.skipped) { cls = 'skip'; cir = 'skip'; tag = 'Atlandı'; }
      else if (isActive) { cls = 'active'; cir = 'active'; tag = 'Aktif adım'; }
      else { cls = 'future'; cir = 'future'; tag = 'Sırada'; }

      var circleInner = st.done ? checkIcon() : (st.skipped ? '–' : String(s.n));
      var actions = '';
      if (isActive && !st.done && !st.skipped) {
        actions = '<div class="uw-actions">' +
          '<button class="uw-cta" data-wiz-cta="' + s.key + '">' + esc(s.cta) + '</button>' +
          '<button class="uw-skip" data-wiz-skip="' + s.key + '">Atla</button>' +
        '</div>';
      }
      return '<div class="uw-item ' + cls + '">' +
        '<div class="uw-cir ' + cir + '">' + circleInner + '</div>' +
        '<div class="uw-body">' +
          '<div class="uw-tag">Adım ' + s.n + ' · ' + esc(tag) + '</div>' +
          '<div class="uw-name">' + esc(s.title) + '</div>' +
          (isActive && !st.done && !st.skipped ? '<div class="uw-hint">' + esc(s.hint) + '</div>' : '') +
          actions +
        '</div>' +
      '</div>';
    }).join('');

    return [
      '<div class="uw-hd">',
        '<div class="uw-icon">' + rocketIcon() + '</div>',
        '<div>',
          '<div class="uw-sub">KURULUM</div>',
          '<div class="uw-title">Unichanl\u2019ı Hazırla</div>',
        '</div>',
        '<button class="uw-min" title="Küçült" aria-label="Küçült">–</button>',
      '</div>',
      '<div class="uw-fab">',
        '<div class="uw-icon">' + rocketIcon() + '</div>',
        '<div class="uw-fab-txt">Kurulum</div>',
        '<div class="uw-fab-count">' + doneCount + '/' + STEPS.length + '</div>',
      '</div>',
      '<div class="uw-prog">',
        '<div class="uw-prog-row">',
          '<span>' + doneCount + '/' + STEPS.length + ' adım</span>',
          '<div class="uw-bar"><div class="uw-fill" style="width:' + pct + '%"></div></div>',
          '<span class="uw-pct">%' + pct + '</span>',
        '</div>',
      '</div>',
      '<div class="uw-list">' + rows + '</div>',
      '<div class="uw-ft">',
        '<span style="font:600 10.5px \'JetBrains Mono\',monospace;color:' + DIM + ';letter-spacing:.1em">4 ADIMDA HAZIR</span>',
        '<button class="uw-finish" data-wiz-finish>Kurulumu Bitir</button>',
      '</div>'
    ].join('');
  }

  function clearSpotlight() {
    var el = document.getElementById(SPOT_ID);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function positionSpotlight() {
    var el = document.getElementById(SPOT_ID);
    if (!el) return;
    var target = document.getElementById('credits-pill');
    if (!target) { clearSpotlight(); return; }
    var r = target.getBoundingClientRect();
    var pad = 6;
    var hole = el.querySelector('.uw-hole');
    var tip = el.querySelector('.uw-spot-tip');
    if (hole) {
      hole.style.left = (r.left - pad) + 'px';
      hole.style.top = (r.top - pad) + 'px';
      hole.style.width = (r.width + pad * 2) + 'px';
      hole.style.height = (r.height + pad * 2) + 'px';
    }
    if (tip) {
      var tipTop = r.bottom + 10;
      var tipRight = Math.max(16, window.innerWidth - r.right);
      tip.style.top = tipTop + 'px';
      tip.style.right = tipRight + 'px';
    }
  }

  function showSpotlight() {
    clearSpotlight();
    var target = document.getElementById('credits-pill');
    if (!target) return;
    var el = document.createElement('div');
    el.id = SPOT_ID;
    el.innerHTML = '<div class="uw-hole"></div>' +
      '<div class="uw-spot-tip">Buraya bas → bakiye yükleme paneli açılır.</div>';
    document.body.appendChild(el);
    el.addEventListener('click', function (e) {
      // clicking the hole area passes through; clicking rest closes
      if (e.target && (e.target.classList.contains('uw-hole') || e.target.classList.contains('uw-spot-tip'))) return;
      clearSpotlight();
    });
    positionSpotlight();
  }

  window.addEventListener('resize', positionSpotlight);
  window.addEventListener('scroll', positionSpotlight, true);

  function setHighlightForStep(active) {
    var map = { 2: 'apikey', 3: 'rules', 4: 'integration' };
    if (active && map[active]) document.body.setAttribute('data-wiz-highlight', map[active]);
    else document.body.removeAttribute('data-wiz-highlight');
  }

  function skipStep(key) {
    lsSet(LS.skipKey(key), '1');
    track('wizard_step_skip', { step: key });
    render();
  }

  function ctaAction(key) {
    if (key === 'topup') {
      // scroll to header (already visible on desktop) and spotlight
      var pill = document.getElementById('credits-pill');
      if (pill && pill.scrollIntoView) {
        try { pill.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (_) {}
      }
      showSpotlight();
      track('wizard_cta', { step: 'topup' });
      return;
    }
    var nav = null;
    if (key === 'apiKey') nav = 'apikeys';
    else if (key === 'rules') nav = 'routing';
    else if (key === 'integration') nav = 'integrations';
    if (!nav) return;
    track('wizard_cta', { step: key });
    var el = document.querySelector('[data-nav="' + nav + '"]');
    if (el && el.click) el.click();
    else location.hash = '#/' + nav;
  }

  function finish() {
    if (!confirm('Kurulumu bitirmek istediğine emin misin? Bu paneli bir daha görmeyeceksin.')) return;
    lsSet(LS.DISMISSED, '1');
    track('wizard_finish');
    destroy();
  }

  function destroy() {
    clearSpotlight();
    document.body.removeAttribute('data-wiz-highlight');
    var el = document.getElementById(WIZ_ID);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function bindPanel(panel) {
    panel.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var cta = t.closest('[data-wiz-cta]');
      if (cta) { ctaAction(cta.getAttribute('data-wiz-cta')); return; }
      var sk = t.closest('[data-wiz-skip]');
      if (sk) { skipStep(sk.getAttribute('data-wiz-skip')); return; }
      if (t.closest('[data-wiz-finish]')) { finish(); return; }
      if (t.closest('.uw-min')) { toggleCollapsed(true); return; }
      if (t.closest('.uw-fab')) { toggleCollapsed(false); return; }
    });
  }

  function toggleCollapsed(collapsed) {
    var el = document.getElementById(WIZ_ID);
    if (!el) return;
    if (collapsed) { el.classList.add('uw-collapsed'); ssSet(SS_COLLAPSED, '1'); }
    else { el.classList.remove('uw-collapsed'); ssSet(SS_COLLAPSED, '0'); }
  }

  var prevActive = null;
  var prevDone = 0;

  function render() {
    if (isCompleted()) {
      if (prevActive != null && ls(LS.DISMISSED) !== '1') {
        // all steps just became done
        track('wizard_complete');
      }
      destroy();
      return;
    }
    ensureStyles();
    var active = computeActive();
    var doneCount = 0;
    STEPS.forEach(function (s) {
      var st = stepState(s);
      if (st.done || st.skipped) doneCount++;
    });

    var el = document.getElementById(WIZ_ID);
    if (!el) {
      el = document.createElement('div');
      el.id = WIZ_ID;
      document.body.appendChild(el);
      bindPanel(el);
      trackOnce('wizard_shown');
    }
    el.innerHTML = buildHTML(active, doneCount);
    if (ss(SS_COLLAPSED) === '1') el.classList.add('uw-collapsed');

    setHighlightForStep(active);

    // spotlight only relevant while step 1 active; clear if step moved past
    if (active !== 1) clearSpotlight();

    prevActive = active;
    prevDone = doneCount;
  }

  function maybeWelcome() {
    if (ls(LS.WELCOME) === '1') return false;
    if (ls(LS.DISMISSED) === '1') return false;
    if (isCompleted()) return false;
    lsSet(LS.WELCOME, '1');
    var el = document.createElement('div');
    el.id = WELCOME_ID;
    el.innerHTML = '<div class="uw-wel"><h2>Hadi Unichanl\u2019ı hazırlayalım</h2><p>4 kısa adımda ilk isteğine.</p></div>';
    document.body.appendChild(el);
    var t = setTimeout(close, 3200);
    function close() {
      clearTimeout(t);
      el.classList.add('uw-fade-out');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); render(); }, 380);
    }
    el.addEventListener('click', close);
    return true;
  }

  function init() {
    // Only run on dashboard (must be authenticated)
    if (!ls('unichanl_key')) return;
    if (ls(LS.DISMISSED) === '1') return;
    ensureStyles();
    if (!maybeWelcome()) render();
  }

  // Public API
  window.UnichanlSetupWizard = {
    init: init,
    refresh: render,
    destroy: destroy,
    isActive: function () { return !isCompleted() && !!document.getElementById(WIZ_ID); },
    markIntegrationDone: function () {
      if (ls(LS.INT_DONE) === '1') return;
      lsSet(LS.INT_DONE, '1');
      track('wizard_integration_done');
      render();
    }
  };

  window.addEventListener('unichanl:onboarding', render);
  window.addEventListener('unichanl:data', render);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      if (window.__unichanlOnboardingSync) window.__unichanlOnboardingSync.refresh();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

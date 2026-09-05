(function () {
  var STEPPER_ID = 'unichanl-onboarding';
  var ACCENT = '#DFFF00';
  var ACCENT_SOFT = 'rgba(223,255,0,0.08)';
  var ACCENT_BORDER = 'rgba(223,255,0,0.35)';
  var TEXT = '#e8efe6';
  var MUTED = '#8a9a94';
  var DIM = '#657172';
  var BORDER = '#1a2528';
  var BORDER_DEEP = '#1C2A2D';
  var CARD_BG = '#0a1214';
  var CARD_INNER = '#071114';
  var PAGE_BG = '#050a0b';

  function ensureStyles() {
    if (document.getElementById('unichanl-onboarding-css')) return;
    var css = document.createElement('style');
    css.id = 'unichanl-onboarding-css';
    css.textContent = [
      '#' + STEPPER_ID + '{background:' + CARD_BG + ';border:1px solid ' + BORDER + ';border-radius:16px;padding:20px 24px;margin-bottom:20px;color:' + TEXT + ";font-family:Archivo,system-ui,sans-serif;position:relative;overflow:hidden}",
      '#' + STEPPER_ID + '::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:' + ACCENT + '}',

      '#' + STEPPER_ID + ' .uc-top{display:flex;align-items:center;gap:14px;flex-wrap:wrap}',
      '#' + STEPPER_ID + ' .uc-icon{width:34px;height:34px;border-radius:10px;background:' + ACCENT + ';display:grid;place-items:center;color:' + PAGE_BG + ';flex:none;box-shadow:0 0 0 4px ' + ACCENT_SOFT + '}',
      '#' + STEPPER_ID + ' .uc-title-wrap{display:flex;flex-direction:column;gap:2px;min-width:0}',
      '#' + STEPPER_ID + ' .uc-label{font:600 10px "JetBrains Mono",monospace;letter-spacing:.14em;text-transform:uppercase;color:' + ACCENT + '}',
      '#' + STEPPER_ID + ' .uc-h{font-family:Archivo,sans-serif;font-weight:700;font-size:15px;line-height:1.2;margin:0;color:' + TEXT + '}',
      '#' + STEPPER_ID + ' .uc-progress{display:flex;align-items:center;gap:10px;margin-left:auto;flex:none}',
      '#' + STEPPER_ID + ' .uc-count{font:600 11px "JetBrains Mono",monospace;color:' + MUTED + '}',
      '#' + STEPPER_ID + ' .uc-bar{width:110px;height:4px;background:' + BORDER + ';border-radius:99px;overflow:hidden}',
      '#' + STEPPER_ID + ' .uc-fill{height:100%;background:' + ACCENT + ';transition:width .3s ease;box-shadow:0 0 8px ' + ACCENT + '}',
      '#' + STEPPER_ID + ' .uc-pct{font:700 12px "JetBrains Mono",monospace;color:' + ACCENT + ';min-width:34px;text-align:right}',

      '#' + STEPPER_ID + ' .uc-strip{display:flex;align-items:flex-start;gap:0;margin:20px 0 0;overflow-x:auto;padding-bottom:4px}',
      '#' + STEPPER_ID + ' .uc-step{display:flex;flex-direction:column;align-items:center;position:relative;flex:1 1 0;min-width:80px}',
      '#' + STEPPER_ID + ' .uc-step + .uc-step::before{content:"";position:absolute;top:13px;right:50%;left:-50%;height:2px;background:' + BORDER + ';z-index:0}',
      '#' + STEPPER_ID + ' .uc-step.done + .uc-step::before{background:' + ACCENT + '}',
      '#' + STEPPER_ID + ' .uc-step.current + .uc-step::before{background:' + ACCENT + '}',
      '#' + STEPPER_ID + ' .uc-circle{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font:700 11px "JetBrains Mono",monospace;flex:none;position:relative;z-index:1}',
      '#' + STEPPER_ID + ' .uc-circle.done{background:' + ACCENT + ';color:' + PAGE_BG + ';border:2px solid ' + ACCENT + '}',
      '#' + STEPPER_ID + ' .uc-circle.current{background:transparent;border:2px solid ' + ACCENT + ';color:' + ACCENT + '}',
      '#' + STEPPER_ID + ' .uc-circle.future{background:transparent;border:2px solid ' + DIM + ';color:' + DIM + '}',
      '#' + STEPPER_ID + ' .uc-step-label{font:600 11px Archivo,sans-serif;text-align:center;margin-top:6px;line-height:1.2;max-width:90px;white-space:normal}',
      '#' + STEPPER_ID + ' .uc-step.done .uc-step-label{color:' + ACCENT + '}',
      '#' + STEPPER_ID + ' .uc-step.current .uc-step-label{color:' + TEXT + '}',
      '#' + STEPPER_ID + ' .uc-step.future .uc-step-label{color:' + DIM + '}',

      '#' + STEPPER_ID + ' .uc-active{margin-top:14px;background:' + CARD_INNER + ';border:1px solid ' + ACCENT_BORDER + ';border-radius:12px;padding:16px 18px;display:flex;align-items:center;gap:18px;flex-wrap:wrap}',
      '#' + STEPPER_ID + ' .uc-active-l{flex:1 1 260px;min-width:0}',
      '#' + STEPPER_ID + ' .uc-active-label{font:700 10px "JetBrains Mono",monospace;letter-spacing:.14em;text-transform:uppercase;color:' + ACCENT + ';margin-bottom:4px}',
      '#' + STEPPER_ID + ' .uc-active-title{font:700 14px Archivo,sans-serif;color:' + TEXT + ';margin-bottom:4px}',
      '#' + STEPPER_ID + ' .uc-active-hint{font:12.5px Archivo,sans-serif;color:' + MUTED + ';margin:0;line-height:1.45}',
      '#' + STEPPER_ID + ' .uc-active-r{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}',
      '#' + STEPPER_ID + ' .uc-active-meta{font:12px "JetBrains Mono",monospace;color:' + MUTED + ';margin-right:4px}',
      '#' + STEPPER_ID + ' .uc-active-meta strong{color:' + ACCENT + ';font-weight:700}',
      '#' + STEPPER_ID + ' .uc-input{background:' + PAGE_BG + ';border:1px solid ' + BORDER + ';border-radius:8px;padding:9px 12px;color:' + TEXT + ';font:13px "JetBrains Mono",monospace;width:96px}',
      '#' + STEPPER_ID + ' .uc-input:focus{outline:none;border-color:' + ACCENT + '}',
      '#' + STEPPER_ID + ' .uc-btn{background:' + ACCENT + ';color:' + PAGE_BG + ';border:none;border-radius:8px;padding:10px 16px;font:700 12.5px Archivo,sans-serif;letter-spacing:.02em;cursor:pointer;white-space:nowrap;transition:filter .15s}',
      '#' + STEPPER_ID + ' .uc-btn:hover{filter:brightness(1.08)}',
      '#' + STEPPER_ID + ' .uc-btn:disabled{opacity:.5;cursor:not-allowed}',
      '#' + STEPPER_ID + ' .uc-btn.ghost{background:transparent;color:' + ACCENT + ';border:1px solid ' + ACCENT_BORDER + ';padding:8px 14px;font-weight:600}',
      '#' + STEPPER_ID + ' .uc-btn.ghost:hover{filter:none;background:' + ACCENT_SOFT + '}',
      '#' + STEPPER_ID + ' .uc-pre{background:' + PAGE_BG + ';border:1px solid ' + BORDER + ';border-radius:8px;padding:10px 12px;font:11.5px "JetBrains Mono",monospace;color:' + TEXT + ';white-space:pre;overflow-x:auto;margin:0;flex:1 1 260px;min-width:0}',
      '#' + STEPPER_ID + ' .uc-badge{background:' + ACCENT + ';color:' + PAGE_BG + ';padding:2px 7px;border-radius:99px;font:700 9.5px "JetBrains Mono",monospace;margin-left:6px;display:inline-flex;align-items:center;gap:3px}',

      '#' + STEPPER_ID + ' .uc-done-banner{background:' + ACCENT_SOFT + ';border:1px solid ' + ACCENT_BORDER + ';border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:10px;margin-bottom:14px;color:' + TEXT + ';font:13px Archivo,sans-serif}',
      '#' + STEPPER_ID + ' .uc-done-banner strong{color:' + ACCENT + ';font-weight:700}',
      '#' + STEPPER_ID + ' .uc-done-banner .uc-check{color:' + ACCENT + ';display:inline-flex}',

      '#' + STEPPER_ID + ' .uc-current-step-label{font:700 10px "JetBrains Mono",monospace;letter-spacing:.14em;text-transform:uppercase;color:' + ACCENT + ';margin:18px 0 6px}',

      '@media (max-width:720px){#' + STEPPER_ID + ' .uc-strip{overflow-x:auto}',
      '#' + STEPPER_ID + ' .uc-step{min-width:72px}',
      '#' + STEPPER_ID + ' .uc-active{flex-direction:column;align-items:stretch}',
      '#' + STEPPER_ID + ' .uc-active-r{justify-content:flex-start}}'
    ].join('\n');
    document.head.appendChild(css);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function stepSuffix(n) {
    var m = { 0: "'\u0131", 1: "'i", 2: "'si", 3: "'\u00fc", 4: "'\u00fc" };
    return m[n] != null ? m[n] : "'i";
  }

  function stepDescriptors() {
    return [
      { key: 'topup',    title: 'Bakiye y\u00fckle' },
      { key: 'cli',      title: 'CLI ba\u011fla' },
      { key: 'apiKey',   title: 'Anahtar olu\u015ftur' },
      { key: 'firstRun', title: '\u0130lk istek' }
    ];
  }

  function stepActiveTitle(step) {
    var map = {
      1: 'Bakiyeni y\u00fckle',
      2: "CLI'yi Unichanl'a ba\u011fla",
      3: 'Yeni bir API anahtar\u0131 olu\u015ftur',
      4: '\u0130lk iste\u011fini g\u00f6nder'
    };
    return map[step] || '';
  }

  function rocketSvg() {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1-2 5-2 5s4-.5 5-2c.5-.9.4-2.2-.4-3-.8-.8-2.1-.9-3-.4z"/><path d="M12 15l-3-3a22 22 0 0 1 8-11c3 0 6 3 6 6a22 22 0 0 1-11 8"/></svg>';
  }
  function checkSvg(size) {
    var s = size || 14;
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>';
  }

  function circle(step, state) {
    if (state === 'done') return '<div class="uc-circle done">' + checkSvg(13) + '</div>';
    return '<div class="uc-circle ' + state + '">' + step + '</div>';
  }

  function maskedKeyHint() {
    try {
      var d = (window.__unichanl && window.__unichanl.keys) || null;
      if (d && d.length) {
        var first = d.find(function (k) { return k.enabled; }) || d[0];
        if (first && first.keyPrefix) return first.keyPrefix + '\u2026';
      }
    } catch (_) {}
    return '<anahtar\u0131n\u0131 gir>';
  }

  function activeCard(step, onb) {
    var label, title, hint, right;
    if (step === 1) {
      var bal = onb.walletBalanceUsd || '0';
      label = '\u0130LK Y\u00dcKLEME';
      title = stepActiveTitle(1);
      hint = 'Min $5 y\u00fckleyerek ba\u015fla. Y\u00fcklenen tutar direkt c\u00fczdan\u0131na eklenir.';
      right = [
        '<span class="uc-active-meta">C\u00fczdan: <strong>$' + esc(bal) + '</strong></span>',
        '<input id="uc-topup-amt" class="uc-input" type="number" min="5" step="1" value="5" />',
        '<button id="uc-topup-go" class="uc-btn">Bakiye Y\u00fckle</button>'
      ].join('');
    } else if (step === 2) {
      var snippet = 'ANTHROPIC_BASE_URL=http://127.0.0.1:20128\nANTHROPIC_AUTH_TOKEN=' + maskedKeyHint();
      label = 'CLI YAPILANDIRMASI';
      title = stepActiveTitle(2);
      hint = 'Terminal ortam\u0131na a\u015fa\u011f\u0131daki de\u011fi\u015fkenleri ekleyerek Claude Code / Codex trafi\u011fini Unichanl\u2019a y\u00f6nlendir.';
      right = [
        '<pre id="uc-cfg-pre" class="uc-pre">' + esc(snippet) + '</pre>',
        '<button id="uc-copy-cfg" class="uc-btn ghost">Kopyala</button>'
      ].join('');
    } else if (step === 3) {
      label = 'API ANAHTARI';
      title = stepActiveTitle(3);
      hint = 'Uygulaman veya CLI i\u00e7in yeni bir anahtar \u00fcret. Anahtar sadece bir kez g\u00f6r\u00fcn\u00fcr.';
      right = '<button id="uc-create-key" class="uc-btn">Anahtar Olu\u015ftur</button>';
    } else if (step === 4) {
      var snip = 'claude "Merhaba, \u00e7al\u0131\u015f\u0131yor musun?"';
      label = '\u0130LK \u0130STEK';
      title = stepActiveTitle(4);
      hint = 'CLI\u2019yi kur ve terminalden ilk komutunu \u00e7al\u0131\u015ft\u0131r:';
      right = '<pre class="uc-pre">' + esc(snip) + '</pre>';
    } else {
      return '';
    }
    return [
      '<div class="uc-active">',
        '<div class="uc-active-l">',
          '<div class="uc-active-label">' + esc(label) + '</div>',
          '<div class="uc-active-title">' + esc(title) + '</div>',
          '<p class="uc-active-hint">' + esc(hint) + '</p>',
        '</div>',
        '<div class="uc-active-r">' + right + '</div>',
      '</div>'
    ].join('');
  }

  function buildStepperHTML(onb) {
    var steps = stepDescriptors();
    var stateKeys = ['topup', 'cli', 'apiKey', 'firstRun'];
    var doneCount = 0;
    stateKeys.forEach(function (k) { if (onb.steps[k] && onb.steps[k].done) doneCount++; });
    var pct = onb.progressPercent != null ? onb.progressPercent : Math.round((doneCount / 4) * 100);
    var current = onb.currentStep;

    var stepHTML = steps.map(function (s, i) {
      var idx = i + 1;
      var done = onb.steps[s.key] && onb.steps[s.key].done;
      var state = done ? 'done' : (idx === current ? 'current' : 'future');
      return [
        '<div class="uc-step ' + state + '">',
          circle(idx, state),
          '<span class="uc-step-label">' + esc(s.title) + '</span>',
        '</div>'
      ].join('');
    }).join('');

    var currentStepLabel = current ? '<div class="uc-current-step-label">\u015eUANKI ADIM</div>' : '';
    var activeBlock = current ? currentStepLabel + activeCard(current, onb) : '';

    var doneBanner = (!current && doneCount > 0) ? [
      '<div class="uc-done-banner">',
        '<span class="uc-check">' + checkSvg(16) + '</span>',
        '<strong>Kurulum tamamland\u0131.</strong>',
        '<span>Art\u0131k trafi\u011fi izleyebilir ve yeni istekler g\u00f6nderebilirsin.</span>',
      '</div>'
    ].join('') : '';

    var countLabel = '4 ad\u0131mdan ' + doneCount + stepSuffix(doneCount);

    return [
      '<section id="' + STEPPER_ID + '">',
        doneBanner,
        '<div class="uc-top">',
          '<div class="uc-icon">' + rocketSvg() + '</div>',
          '<div class="uc-title-wrap">',
            '<span class="uc-label">BA\u015eLAYALIM</span>',
            '<h3 class="uc-h">\u0130lk iste\u011fini g\u00f6nder</h3>',
          '</div>',
          '<div class="uc-progress">',
            '<span class="uc-count">' + countLabel + '</span>',
            '<div class="uc-bar"><div class="uc-fill" style="width:' + pct + '%"></div></div>',
            '<span class="uc-pct">%' + pct + '</span>',
          '</div>',
        '</div>',
        '<div class="uc-strip">' + stepHTML + '</div>',
        activeBlock,
      '</section>'
    ].join('');
  }

  function findOverviewH1() {
    var h1s = document.querySelectorAll('h1');
    for (var i = 0; i < h1s.length; i++) {
      var txt = (h1s[i].textContent || '').trim();
      if (txt.indexOf('Genel Bak\u0131\u015f') !== -1) return h1s[i];
    }
    return null;
  }

  function findStatGrid(container) {
    var kids = container.children;
    for (var i = 0; i < kids.length; i++) {
      var c = kids[i];
      var style = c.getAttribute && c.getAttribute('style') || '';
      if (c.tagName === 'DIV' && style.indexOf('repeat(4') !== -1) return c;
    }
    return null;
  }

  function toast(msg) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:99999;background:' + CARD_BG + ';color:' + ACCENT + ';border:1px solid ' + ACCENT + ';padding:12px 18px;border-radius:10px;font:14px Archivo,system-ui;box-shadow:0 6px 24px rgba(0,0,0,.4)';
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }

  function authHeaders() {
    var k = null;
    try { k = localStorage.getItem('unichanl_key'); } catch (_) {}
    return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (k || '') };
  }

  function bindActions() {
    var topupBtn = document.getElementById('uc-topup-go');
    if (topupBtn && !topupBtn._bound) {
      topupBtn._bound = true;
      topupBtn.addEventListener('click', function () {
        var input = document.getElementById('uc-topup-amt');
        var amt = parseFloat(input && input.value);
        if (!isFinite(amt) || amt < 5) { toast('Minimum $5'); return; }
        topupBtn.disabled = true;
        fetch('/api/billing/topup', {
          method: 'POST', headers: authHeaders(),
          body: JSON.stringify({ amountUsd: amt, successUrl: location.origin + '/dashboard.html' })
        }).then(function (r) { return r.json(); }).then(function (res) {
          if (res && res.url) location.href = res.url;
          else { toast('\u00d6deme ba\u015flat\u0131lamad\u0131'); topupBtn.disabled = false; }
        }).catch(function () { toast('\u00d6deme ba\u015flat\u0131lamad\u0131'); topupBtn.disabled = false; });
      });
    }

    var copyBtn = document.getElementById('uc-copy-cfg');
    if (copyBtn && !copyBtn._bound) {
      copyBtn._bound = true;
      copyBtn.addEventListener('click', function () {
        var pre = document.getElementById('uc-cfg-pre');
        if (!pre) return;
        try {
          navigator.clipboard.writeText(pre.textContent || '');
          toast('Kopyaland\u0131');
        } catch (_) { toast('Kopyalanamad\u0131'); }
      });
    }

    var keyBtn = document.getElementById('uc-create-key');
    if (keyBtn && !keyBtn._bound) {
      keyBtn._bound = true;
      keyBtn.addEventListener('click', function () {
        keyBtn.disabled = true;
        fetch('/api/keys', {
          method: 'POST', headers: authHeaders(),
          body: JSON.stringify({ name: 'onboarding-' + Date.now().toString(36) })
        }).then(function (r) { return r.json(); }).then(function (res) {
          if (res && res.key) {
            prompt('Yeni API anahtar\u0131n\u0131z (bir daha g\u00f6sterilmeyecek):', res.key);
            refreshOnboarding();
          } else {
            toast('Anahtar olu\u015fturulamad\u0131');
            keyBtn.disabled = false;
          }
        }).catch(function () { toast('Anahtar olu\u015fturulamad\u0131'); keyBtn.disabled = false; });
      });
    }
  }

  function refreshOnboarding() {
    var k = null;
    try { k = localStorage.getItem('unichanl_key'); } catch (_) {}
    if (!k) return;
    fetch('/api/dashboard/onboarding-status', { headers: { Authorization: 'Bearer ' + k } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (o) {
        if (!o) return;
        if (!window.__unichanl) window.__unichanl = {};
        window.__unichanl.onboarding = o;
        mount();
      }).catch(function () {});
  }

  var mounting = false;
  function mount() {
    if (mounting) return;
    mounting = true;
    try {
      var onb = window.__unichanl && window.__unichanl.onboarding;
      var existing = document.getElementById(STEPPER_ID);
      if (!onb) return;

      if (onb.currentStep === null) {
        if (existing) existing.remove();
        return;
      }

      var h1 = findOverviewH1();
      if (!h1) {
        if (existing) existing.remove();
        return;
      }
      var container = h1.parentElement;
      if (!container) return;
      var target = findStatGrid(container);
      if (!target) return;

      var html = buildStepperHTML(onb);

      if (existing && existing.parentElement === container) {
        var wrap = document.createElement('div');
        wrap.innerHTML = html;
        container.replaceChild(wrap.firstElementChild, existing);
      } else {
        if (existing) existing.remove();
        var wrap2 = document.createElement('div');
        wrap2.innerHTML = html;
        container.insertBefore(wrap2.firstElementChild, target);
      }
      bindActions();
    } finally {
      mounting = false;
    }
  }

  ensureStyles();
  window.addEventListener('unichanl:onboarding', mount);
  window.addEventListener('unichanl:data', mount);

  window.addEventListener('unichanl:inflated', function () {
    if (window.__unichanl && window.__unichanl.onboarding) {
      try { mo.disconnect(); } catch (_) {}
      mo.observe(document.body, { childList: true, subtree: true });
      mount();
    }
  });

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t && t.closest && t.closest('[data-nav]')) {
      setTimeout(mount, 40);
      setTimeout(mount, 250);
    }
  }, true);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') refreshOnboarding();
  });

  var mo = new MutationObserver(function () {
    if (mo._q) return;
    mo._q = true;
    requestAnimationFrame(function () {
      mo._q = false;
      if (!window.__unichanl || !window.__unichanl.onboarding) return;
      if (window.__unichanl.onboarding.currentStep === null) return;
      if (!document.getElementById(STEPPER_ID) && findOverviewH1()) mount();
    });
  });
  mo.observe(document.body, { childList: true, subtree: true });
})();

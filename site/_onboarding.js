(function () {
  var STEPPER_ID = 'unichanl-onboarding';
  var ACCENT = '#DFFF00';
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
      '#' + STEPPER_ID + '{background:' + CARD_BG + ';border:1px solid ' + BORDER + ';border-radius:16px;padding:28px;margin-bottom:20px;color:' + TEXT + ";font-family:Archivo,system-ui,sans-serif}",
      '#' + STEPPER_ID + ' .uc-head{display:grid;grid-template-columns:1fr auto;gap:24px;align-items:start;margin-bottom:24px}',
      '#' + STEPPER_ID + ' .uc-head-l{display:flex;gap:14px;align-items:flex-start}',
      '#' + STEPPER_ID + ' .uc-icon{width:40px;height:40px;border-radius:12px;background:' + ACCENT + ';display:grid;place-items:center;color:' + PAGE_BG + ';flex:0 0 40px}',
      '#' + STEPPER_ID + ' .uc-label{display:block;font:600 10.5px "JetBrains Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:' + DIM + '}',
      '#' + STEPPER_ID + ' .uc-h{font-family:Newsreader,serif;font-weight:600;font-size:22px;line-height:1.15;margin:4px 0 6px;letter-spacing:-.01em;color:' + TEXT + '}',
      '#' + STEPPER_ID + ' .uc-sub{font:14px Archivo,sans-serif;color:' + MUTED + ';margin:0}',
      '#' + STEPPER_ID + ' .uc-head-r{text-align:right;min-width:220px;display:flex;flex-direction:column;align-items:flex-end;gap:6px}',
      '#' + STEPPER_ID + ' .uc-count{font:11px "JetBrains Mono",monospace;color:' + DIM + '}',
      '#' + STEPPER_ID + ' .uc-pct{font:12px "JetBrains Mono",monospace;color:' + ACCENT + '}',
      '#' + STEPPER_ID + ' .uc-bar{width:220px;height:3px;background:#132023;border-radius:2px;overflow:hidden}',
      '#' + STEPPER_ID + ' .uc-fill{height:100%;background:' + ACCENT + ';transition:width .3s ease}',
      '#' + STEPPER_ID + ' .uc-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;position:relative;margin-bottom:24px}',
      '#' + STEPPER_ID + ' .uc-step{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:8px}',
      '#' + STEPPER_ID + ' .uc-step + .uc-step::before{content:"";position:absolute;left:-8px;right:calc(100% - 16px);top:16px;height:1px;background:' + BORDER + ';z-index:0}',
      '#' + STEPPER_ID + ' .uc-step.done + .uc-step::before,#' + STEPPER_ID + ' .uc-step.done::before{background:' + ACCENT + '}',
      '#' + STEPPER_ID + ' .uc-circle{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font:600 13px "JetBrains Mono",monospace;position:relative;z-index:1;flex:none}',
      '#' + STEPPER_ID + ' .uc-circle.done{background:' + ACCENT + ';color:' + PAGE_BG + '}',
      '#' + STEPPER_ID + ' .uc-circle.current{background:transparent;border:1.5px solid ' + ACCENT + ';color:' + ACCENT + '}',
      '#' + STEPPER_ID + ' .uc-circle.future{background:' + CARD_BG + ';border:1px solid ' + BORDER + ';color:' + DIM + '}',
      '#' + STEPPER_ID + ' .uc-step-title{font:600 13px Archivo,sans-serif;color:' + TEXT + ';display:flex;align-items:center;gap:6px}',
      '#' + STEPPER_ID + ' .uc-step-desc{font:11px Archivo,sans-serif;color:' + MUTED + ';margin:0;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '#' + STEPPER_ID + ' .uc-badge{background:#0a2a1a;color:#7fff8a;border:1px solid #1a4a2a;padding:2px 8px;border-radius:6px;font:600 10px "JetBrains Mono",monospace;margin-left:6px}',
      '#' + STEPPER_ID + ' .uc-active{background:' + CARD_INNER + ';border:1px solid ' + BORDER_DEEP + ';border-radius:12px;padding:20px;margin-top:4px}',
      '#' + STEPPER_ID + ' .uc-active-label{font:600 10.5px "JetBrains Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:' + DIM + ';margin-bottom:6px}',
      '#' + STEPPER_ID + ' .uc-active-title{font:600 15px Archivo,sans-serif;color:' + TEXT + ';margin-bottom:14px}',
      '#' + STEPPER_ID + ' .uc-active-hint{font:13px Archivo,sans-serif;color:' + MUTED + ';margin:0 0 14px;line-height:1.5}',
      '#' + STEPPER_ID + ' .uc-active-meta{font:12px "JetBrains Mono",monospace;color:' + MUTED + ';margin-bottom:12px}',
      '#' + STEPPER_ID + ' .uc-active-meta strong{color:' + ACCENT + ';font-weight:600}',
      '#' + STEPPER_ID + ' .uc-input-row{display:flex;gap:10px;align-items:stretch}',
      '#' + STEPPER_ID + ' .uc-input{background:' + CARD_BG + ';border:1px solid ' + BORDER + ';border-radius:10px;padding:10px 14px;color:' + TEXT + ';font:14px "JetBrains Mono",monospace;width:120px}',
      '#' + STEPPER_ID + ' .uc-input:focus{outline:none;border-color:' + ACCENT + '}',
      '#' + STEPPER_ID + ' .uc-btn{background:' + ACCENT + ';color:' + PAGE_BG + ';border:none;border-radius:10px;padding:12px 20px;font:700 13px Archivo,sans-serif;letter-spacing:.02em;cursor:pointer;white-space:nowrap;transition:filter .15s}',
      '#' + STEPPER_ID + ' .uc-btn:hover{filter:brightness(1.05)}',
      '#' + STEPPER_ID + ' .uc-btn:disabled{opacity:.5;cursor:not-allowed}',
      '#' + STEPPER_ID + ' .uc-btn.ghost{background:transparent;color:' + TEXT + ';border:1px solid ' + BORDER + ';padding:8px 14px;font:600 12px Archivo,sans-serif;letter-spacing:0}',
      '#' + STEPPER_ID + ' .uc-btn.ghost:hover{filter:none;border-color:' + ACCENT + ';color:' + ACCENT + '}',
      '#' + STEPPER_ID + ' .uc-pre{background:' + PAGE_BG + ';border:1px solid ' + BORDER + ';border-radius:10px;padding:14px;font:12px "JetBrains Mono",monospace;color:' + TEXT + ';white-space:pre;overflow-x:auto;margin:0}',
      '#' + STEPPER_ID + ' .uc-pre-row{display:flex;gap:10px;align-items:flex-start}',
      '#' + STEPPER_ID + ' .uc-pre-row .uc-pre{flex:1}',
      '#' + STEPPER_ID + ' .uc-done-banner{background:' + CARD_BG + ';border:1px solid ' + BORDER + ';border-radius:12px;padding:16px 20px;display:flex;align-items:center;gap:10px;margin-bottom:20px;color:' + MUTED + ';font:13px Archivo,sans-serif}',
      '#' + STEPPER_ID + ' .uc-done-banner strong{color:' + TEXT + ';font-weight:600}',
      '#' + STEPPER_ID + ' .uc-done-banner .uc-check{color:' + ACCENT + '}'
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
      { key: 'topup',    title: 'Bakiye y\u00fckle',              desc: '\u0130lk iste\u011fini g\u00f6ndermek i\u00e7in minimum $5 kredi y\u00fckle.' },
      { key: 'cli',      title: 'Claude Code / Codex CLI',        desc: "CLI'nin Unichanl u\u00e7 noktas\u0131n\u0131 kullanacak \u015fekilde yap\u0131land\u0131r." },
      { key: 'apiKey',   title: 'API anahtar\u0131 olu\u015ftur', desc: 'Uygulaman i\u00e7in yeni bir Unichanl anahtar\u0131 \u00fcret.' },
      { key: 'firstRun', title: 'Ba\u015flamaya haz\u0131r',      desc: '\u0130lk iste\u011fini g\u00f6nder ve dashboardda g\u00f6r.' }
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
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1-2 5-2 5s4-.5 5-2c.5-.9.4-2.2-.4-3-.8-.8-2.1-.9-3-.4z"/><path d="M12 15l-3-3a22 22 0 0 1 8-11c3 0 6 3 6 6a22 22 0 0 1-11 8"/><path d="M9 12H5s.5-2.7 2-4 5-1 5-1M12 15v4s2.7-.5 4-2 1-5 1-5"/></svg>';
  }
  function checkSvg() {
    return '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>';
  }

  function circle(step, state) {
    if (state === 'done') return '<div class="uc-circle done">' + checkSvg() + '</div>';
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
    if (step === 1) {
      var bal = onb.walletBalanceUsd || '0';
      return [
        '<div class="uc-active">',
          '<div class="uc-active-label">\u0130LK Y\u00dcKLEME</div>',
          '<div class="uc-active-title">' + esc(stepActiveTitle(1)) + '</div>',
          '<p class="uc-active-hint">Min $5 y\u00fckleyerek ba\u015fla. Y\u00fcklenen tutar direkt c\u00fczdan\u0131na eklenir.</p>',
          '<div class="uc-active-meta">C\u00fczdan kredisi: <strong>$' + esc(bal) + '</strong></div>',
          '<div class="uc-input-row">',
            '<input id="uc-topup-amt" class="uc-input" type="number" min="5" step="1" value="5" />',
            '<button id="uc-topup-go" class="uc-btn">Bakiye Y\u00fckle</button>',
          '</div>',
        '</div>'
      ].join('');
    }
    if (step === 2) {
      var snippet = 'ANTHROPIC_BASE_URL=http://127.0.0.1:20128\nANTHROPIC_AUTH_TOKEN=' + maskedKeyHint();
      return [
        '<div class="uc-active">',
          '<div class="uc-active-label">CLI YAPILANDIRMASI</div>',
          '<div class="uc-active-title">' + esc(stepActiveTitle(2)) + '</div>',
          '<p class="uc-active-hint">Claude Code veya Codex CLI\u2019nin trafi\u011fini Unichanl\u2019a y\u00f6nlendirmek i\u00e7in terminal ortam\u0131na a\u015fa\u011f\u0131daki de\u011fi\u015fkenleri ekle.</p>',
          '<div class="uc-pre-row">',
            '<pre id="uc-cfg-pre" class="uc-pre">' + esc(snippet) + '</pre>',
            '<button id="uc-copy-cfg" class="uc-btn ghost">Kopyala</button>',
          '</div>',
        '</div>'
      ].join('');
    }
    if (step === 3) {
      return [
        '<div class="uc-active">',
          '<div class="uc-active-label">API ANAHTARI</div>',
          '<div class="uc-active-title">' + esc(stepActiveTitle(3)) + '</div>',
          '<p class="uc-active-hint">Uygulaman veya CLI i\u00e7in yeni bir Unichanl anahtar\u0131 \u00fcret. Anahtar\u0131 sadece bir kez g\u00f6receksin \u2014 g\u00fcvenli sakla.</p>',
          '<button id="uc-create-key" class="uc-btn">Anahtar Olu\u015ftur</button>',
        '</div>'
      ].join('');
    }
    if (step === 4) {
      var snip = 'claude "Merhaba, \u00e7al\u0131\u015f\u0131yor musun?"';
      return [
        '<div class="uc-active">',
          '<div class="uc-active-label">\u0130LK \u0130STEK</div>',
          '<div class="uc-active-title">' + esc(stepActiveTitle(4)) + '</div>',
          '<p class="uc-active-hint">CLI\u2019yi kur ve terminalden ilk komutunu \u00e7al\u0131\u015ft\u0131r. \u00d6rnek:</p>',
          '<pre class="uc-pre">' + esc(snip) + '</pre>',
        '</div>'
      ].join('');
    }
    return '';
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
      var badge = done ? '<span class="uc-badge">\u2713 Tamam</span>' : '';
      return [
        '<div class="uc-step ' + state + '">',
          circle(idx, state),
          '<div class="uc-step-title">' + esc(s.title) + badge + '</div>',
          '<p class="uc-step-desc">' + esc(s.desc) + '</p>',
        '</div>'
      ].join('');
    }).join('');

    var activeBlock = current ? activeCard(current, onb) : '';

    var doneBanner = (!current && doneCount > 0) ? [
      '<div class="uc-done-banner">',
        '<span class="uc-check">' + checkSvg() + '</span>',
        '<strong>Kurulum tamamland\u0131</strong>',
        '<span>Art\u0131k trafi\u011fi izleyebilir ve yeni istekler g\u00f6nderebilirsin.</span>',
      '</div>'
    ].join('') : '';

    var countLabel = '4 ad\u0131mdan ' + doneCount + stepSuffix(doneCount);

    return [
      '<section id="' + STEPPER_ID + '">',
        doneBanner,
        '<div class="uc-head">',
          '<div class="uc-head-l">',
            '<div class="uc-icon">' + rocketSvg() + '</div>',
            '<div>',
              '<span class="uc-label">BA\u015eLAYALIM</span>',
              '<h2 class="uc-h">\u0130lk iste\u011fini g\u00f6nder</h2>',
              '<p class="uc-sub">K\u0131sa bir kurulum sonras\u0131 Unichanl trafi\u011fin buradan akmaya ba\u015flar.</p>',
            '</div>',
          '</div>',
          '<div class="uc-head-r">',
            '<span class="uc-count">' + countLabel + '</span>',
            '<span class="uc-pct">%' + pct + '</span>',
            '<div class="uc-bar"><div class="uc-fill" style="width:' + pct + '%"></div></div>',
          '</div>',
        '</div>',
        '<div class="uc-row">' + stepHTML + '</div>',
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
  window.addEventListener('unichanl:data', mount);
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

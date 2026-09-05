(function () {
  var STEPPER_ID = 'unichanl-onboarding';
  var ACCENT = '#DFFF00';
  var TEXT = '#F2F5F4';
  var MUTED = '#98A3A3';
  var DIM = '#657172';
  var BORDER = '#1C2A2D';
  var CARD_BG = '#071114';
  var CARD_DEEP = '#050a0b';

  function ensureStyles() {
    if (document.getElementById('unichanl-onboarding-css')) return;
    var css = document.createElement('style');
    css.id = 'unichanl-onboarding-css';
    css.textContent = [
      '#' + STEPPER_ID + '{background:' + CARD_BG + ';border:1px solid ' + BORDER + ';border-radius:12px;padding:22px;margin-bottom:16px;color:' + TEXT + ';font-family:Archivo,system-ui,sans-serif}',
      '#' + STEPPER_ID + ' .uc-head{display:grid;grid-template-columns:1fr auto;gap:24px;align-items:start;margin-bottom:22px}',
      '#' + STEPPER_ID + ' .uc-head-l{display:flex;gap:14px;align-items:flex-start}',
      '#' + STEPPER_ID + ' .uc-icon{width:40px;height:40px;border-radius:10px;background:' + ACCENT + ';display:flex;align-items:center;justify-content:center;color:' + CARD_DEEP + ';flex:0 0 40px}',
      '#' + STEPPER_ID + ' .uc-label{display:block;font:600 10px "JetBrains Mono",monospace;letter-spacing:.14em;color:' + DIM + ';margin-bottom:6px}',
      '#' + STEPPER_ID + ' .uc-h{font-family:Newsreader,serif;font-weight:400;font-size:24px;line-height:1.1;margin:0 0 4px;letter-spacing:-.01em;color:' + TEXT + '}',
      '#' + STEPPER_ID + ' .uc-sub{font-size:13px;color:' + MUTED + ';margin:0}',
      '#' + STEPPER_ID + ' .uc-head-r{text-align:right;min-width:180px}',
      '#' + STEPPER_ID + ' .uc-count{font:500 11px "JetBrains Mono",monospace;color:' + DIM + '}',
      '#' + STEPPER_ID + ' .uc-pct{font:600 12px "JetBrains Mono",monospace;color:' + ACCENT + ';margin-left:8px}',
      '#' + STEPPER_ID + ' .uc-bar{width:100%;height:3px;background:#132023;border-radius:2px;margin-top:8px;overflow:hidden}',
      '#' + STEPPER_ID + ' .uc-fill{height:100%;background:' + ACCENT + ';transition:width .3s ease}',
      '#' + STEPPER_ID + ' .uc-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;position:relative;margin-bottom:22px}',
      '#' + STEPPER_ID + ' .uc-step{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:8px;padding-top:0}',
      '#' + STEPPER_ID + ' .uc-step + .uc-step::before{content:"";position:absolute;left:-6px;right:calc(100% - 16px);top:16px;height:1px;background:' + BORDER + ';z-index:0}',
      '#' + STEPPER_ID + ' .uc-step.done + .uc-step::before,#' + STEPPER_ID + ' .uc-step.done::before{background:' + ACCENT + '}',
      '#' + STEPPER_ID + ' .uc-circle{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:600 12px "JetBrains Mono",monospace;position:relative;z-index:1}',
      '#' + STEPPER_ID + ' .uc-circle.done{background:' + ACCENT + ';color:' + CARD_DEEP + '}',
      '#' + STEPPER_ID + ' .uc-circle.current{background:transparent;border:1.5px solid ' + ACCENT + ';color:' + ACCENT + '}',
      '#' + STEPPER_ID + ' .uc-circle.future{background:#0B171A;border:1px solid ' + BORDER + ';color:' + DIM + '}',
      '#' + STEPPER_ID + ' .uc-step-title{font:600 13px Archivo,sans-serif;color:' + TEXT + ';display:flex;align-items:center;gap:6px}',
      '#' + STEPPER_ID + ' .uc-step-desc{font-size:11px;color:' + MUTED + ';margin:0;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '#' + STEPPER_ID + ' .uc-badge{background:rgba(74,222,128,.12);color:#4ADE80;font:600 10px "JetBrains Mono",monospace;padding:2px 6px;border-radius:4px;letter-spacing:.06em}',
      '#' + STEPPER_ID + ' .uc-active{background:' + CARD_DEEP + ';border:1px solid ' + BORDER + ';border-radius:10px;padding:18px;margin-top:6px}',
      '#' + STEPPER_ID + ' .uc-active-label{font:600 10px "JetBrains Mono",monospace;letter-spacing:.14em;color:' + DIM + ';margin-bottom:10px}',
      '#' + STEPPER_ID + ' .uc-active-title{font:600 15px Archivo,sans-serif;color:' + TEXT + ';margin-bottom:4px}',
      '#' + STEPPER_ID + ' .uc-active-hint{font-size:12px;color:' + MUTED + ';margin-bottom:14px}',
      '#' + STEPPER_ID + ' .uc-active-meta{display:flex;justify-content:space-between;font:500 12px "JetBrains Mono",monospace;color:' + MUTED + ';margin-bottom:12px}',
      '#' + STEPPER_ID + ' .uc-active-meta strong{color:' + TEXT + ';font-weight:600}',
      '#' + STEPPER_ID + ' .uc-input-row{display:flex;gap:8px;align-items:stretch}',
      '#' + STEPPER_ID + ' .uc-input{flex:1;background:#0B171A;border:1px solid ' + BORDER + ';border-radius:8px;padding:10px 12px;color:' + TEXT + ';font:500 14px "JetBrains Mono",monospace}',
      '#' + STEPPER_ID + ' .uc-input:focus{outline:none;border-color:' + ACCENT + '}',
      '#' + STEPPER_ID + ' .uc-btn{background:' + ACCENT + ';color:' + CARD_DEEP + ';border:none;border-radius:8px;padding:10px 18px;font:600 13px Archivo,sans-serif;cursor:pointer;white-space:nowrap;transition:opacity .15s}',
      '#' + STEPPER_ID + ' .uc-btn:hover{opacity:.9}',
      '#' + STEPPER_ID + ' .uc-btn.ghost{background:transparent;color:' + ACCENT + ';border:1px solid ' + ACCENT + '}',
      '#' + STEPPER_ID + ' .uc-pre{background:#0B171A;border:1px solid ' + BORDER + ';border-radius:8px;padding:14px;font:500 12px "JetBrains Mono",monospace;color:' + TEXT + ';white-space:pre;overflow-x:auto;margin:0}',
      '#' + STEPPER_ID + ' .uc-pre-row{display:flex;gap:8px;align-items:flex-start}',
      '#' + STEPPER_ID + ' .uc-pre-row .uc-pre{flex:1}',
      '#' + STEPPER_ID + ' .uc-done-banner{background:' + CARD_BG + ';border:1px solid ' + BORDER + ';border-radius:10px;padding:14px 18px;color:' + MUTED + ';font:500 13px Archivo,sans-serif;display:flex;gap:10px;align-items:center;margin-bottom:16px}',
      '#' + STEPPER_ID + ' .uc-done-banner strong{color:' + ACCENT + '}'
    ].join('\n');
    document.head.appendChild(css);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function stepDescriptors() {
    return [
      { key: 'topup',    title: 'Bakiye yükle',              desc: 'İlk isteğini göndermek için minimum $5 kredi yükle.' },
      { key: 'cli',      title: 'Claude Code / Codex CLI',   desc: 'CLI\'nin Unichanl uç noktasını kullanacak şekilde yapılandır.' },
      { key: 'apiKey',   title: 'API key oluştur',           desc: 'Uygulaman için yeni bir Unichanl anahtarı üret.' },
      { key: 'firstRun', title: 'Başlamaya hazır',           desc: 'İlk isteğini gönder ve dashboardda gör.' }
    ];
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

  function currentTitle(step) {
    var d = stepDescriptors()[step - 1];
    return d ? d.title : '';
  }

  function activeCard(step, onb, payload) {
    if (step === 1) {
      var bal = onb.walletBalanceUsd || '0';
      return [
        '<div class="uc-active">',
          '<div class="uc-active-label">FIRST FUNDING</div>',
          '<div class="uc-active-title">$5.00 minimum yükleme</div>',
          '<div class="uc-active-hint">Kredi kartıyla güvenli ödeme. Cüzdana anında yansır.</div>',
          '<div class="uc-active-meta"><span>Wallet credit</span><strong>$' + esc(bal) + '</strong></div>',
          '<div class="uc-input-row">',
            '<input id="uc-topup-amt" class="uc-input" type="number" min="5" step="1" value="5" />',
            '<button id="uc-topup-go" class="uc-btn">Bakiye Yükle</button>',
          '</div>',
        '</div>'
      ].join('');
    }
    if (step === 2) {
      var keyPh = '<UNICHANL_API_KEY>';
      var localKey = null;
      try { localKey = localStorage.getItem('unichanl_key'); } catch (_) {}
      var showKey = localKey || keyPh;
      var snippet = 'ANTHROPIC_BASE_URL=http://127.0.0.1:20128\nANTHROPIC_AUTH_TOKEN=' + showKey;
      return [
        '<div class="uc-active">',
          '<div class="uc-active-label">CLI CONFIG</div>',
          '<div class="uc-active-title">Claude Code / Codex CLI kur</div>',
          '<div class="uc-active-hint">Aşağıdaki iki değişkeni kabuğuna ekle, sonra CLI\'ı yeniden başlat.</div>',
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
          '<div class="uc-active-label">API KEY</div>',
          '<div class="uc-active-title">Yeni bir anahtar oluştur</div>',
          '<div class="uc-active-hint">Anahtar sadece bir kez gösterilir. Kopyalamayı unutma.</div>',
          '<button id="uc-create-key" class="uc-btn">Yeni Anahtar Oluştur</button>',
        '</div>'
      ].join('');
    }
    if (step === 4) {
      var snip = 'curl http://127.0.0.1:20128/v1/messages \\\n  -H "Authorization: Bearer <UNICHANL_KEY>" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"model":"claude-3-5-sonnet-latest","max_tokens":64,"messages":[{"role":"user","content":"Merhaba"}]}\'';
      return [
        '<div class="uc-active">',
          '<div class="uc-active-label">FIRST REQUEST</div>',
          '<div class="uc-active-title">Bir istek gönder</div>',
          '<div class="uc-active-hint">CLI kurulumun tamamsa artık isteğin dashboarda düşer.</div>',
          '<pre class="uc-pre">' + esc(snip) + '</pre>',
        '</div>'
      ].join('');
    }
    return '';
  }

  function buildStepperHTML(onb, payload) {
    var steps = stepDescriptors();
    var stateKeys = ['topup', 'cli', 'apiKey', 'firstRun'];
    var doneCount = 0;
    stateKeys.forEach(function (k) { if (onb.steps[k].done) doneCount++; });
    var pct = onb.progressPercent != null ? onb.progressPercent : Math.round((doneCount / 4) * 100);
    var current = onb.currentStep;

    var stepHTML = steps.map(function (s, i) {
      var idx = i + 1;
      var done = onb.steps[s.key].done;
      var state = done ? 'done' : (idx === current ? 'current' : 'future');
      var badge = done ? '<span class="uc-badge">✓ Done</span>' : '';
      return [
        '<div class="uc-step ' + state + '">',
          circle(idx, state),
          '<div class="uc-step-title">' + esc(s.title) + badge + '</div>',
          '<p class="uc-step-desc">' + esc(s.desc) + '</p>',
        '</div>'
      ].join('');
    }).join('');

    var activeBlock = current ? [
      '<div class="uc-active-label" style="margin-bottom:8px">CURRENT STEP</div>',
      '<div class="uc-active-title" style="margin-bottom:10px">' + esc(currentTitle(current)) + '</div>',
      activeCard(current, onb, payload)
    ].join('') : '';

    return [
      '<section id="' + STEPPER_ID + '">',
        '<div class="uc-head">',
          '<div class="uc-head-l">',
            '<div class="uc-icon">' + rocketSvg() + '</div>',
            '<div>',
              '<span class="uc-label">GET STARTED</span>',
              '<h2 class="uc-h">İlk isteğini gönder</h2>',
              '<p class="uc-sub">Kısa bir kurulum sonrası Unichanl trafiğin buradan akmaya başlar.</p>',
            '</div>',
          '</div>',
          '<div class="uc-head-r">',
            '<span class="uc-count">' + doneCount + ' of 4 steps</span>',
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
      if (txt.indexOf('Genel Bakış') !== -1) return h1s[i];
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
    t.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:99999;background:#111;color:' + ACCENT + ';border:1px solid ' + ACCENT + ';padding:12px 18px;border-radius:8px;font:14px system-ui;box-shadow:0 6px 24px rgba(0,0,0,.4)';
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
          else { toast('Ödeme başlatılamadı'); topupBtn.disabled = false; }
        }).catch(function () { toast('Ödeme başlatılamadı'); topupBtn.disabled = false; });
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
          toast('Kopyalandı');
        } catch (_) { toast('Kopyalanamadı'); }
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
            prompt('Yeni API anahtarınız (bir daha gösterilmeyecek):', res.key);
            refreshOnboarding();
          } else {
            toast('Anahtar oluşturulamadı');
            keyBtn.disabled = false;
          }
        }).catch(function () { toast('Anahtar oluşturulamadı'); keyBtn.disabled = false; });
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

      var payload = (window.__unichanl && window.__unichanl.payload) || {};
      var html = buildStepperHTML(onb, payload);

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

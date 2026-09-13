/* Unichanl — First-Topup Modal
 * Dashboard'a ilk giriş anında (onboarding tamamlandıysa ve bakiye $0 ise) tek seferlik popup.
 * dashboard.html layout'una dokunmaz; tüm CSS #uc-first-topup altında scope'ludur.
 */
(function () {
  "use strict";
  if (window.__ucFirstTopupLoaded) return;
  window.__ucFirstTopupLoaded = true;

  var STORAGE = "unichanl.onboarding";
  var SHOWN_KEY = "unichanl.first_topup_shown";
  var KEY_STORAGE = "unichanl_key";
  var API = "/api/billing";
  var POLAR_URL = "https://buy.polar.sh/polar_cl_KPLbu6b1dABR2LXgvmEu2jeALNSSn5HnuujYD4BudFI";

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    // Only on dashboard
    if (!/\/dashboard(\.html)?$/i.test(location.pathname)) return;
    if (localStorage.getItem(SHOWN_KEY) === "1") return;
    var raw = localStorage.getItem(STORAGE);
    if (!raw) return;
    var onboarding;
    try { onboarding = JSON.parse(raw); } catch (_) { return; }
    if (!onboarding || !onboarding.plan) return;
    var key = localStorage.getItem(KEY_STORAGE);
    if (!key) return;

    fetch(API + "/balance", { headers: { Authorization: "Bearer " + key } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j) return;
        var bal = parseFloat(j.balanceUsd != null ? j.balanceUsd : j.balance);
        if (!isFinite(bal) || bal > 0.001) return;
        openModal(j);
      })
      .catch(function () {});
  });

  function fmt(n) { return "$" + (Math.round(n * 100) / 100).toFixed(2); }

  function getEmail() {
    return (
      localStorage.getItem("unichanl_email") ||
      localStorage.getItem("unichanl_user_email") ||
      ""
    );
  }

  function buildPolarUrl(amt, email) {
    var params = new URLSearchParams();
    var cents = Math.round(amt * 100);
    if (isFinite(cents) && cents > 0) {
      params.set("amount", String(cents));
      params.set("prefilled_amount", String(cents));
    }
    if (email) params.set("customer_email", email);
    var q = params.toString();
    return q ? POLAR_URL + "?" + q : POLAR_URL;
  }

  function openModal(bal) {
    localStorage.setItem(SHOWN_KEY, "1");

    // Write default auto-recharge (opt-in by design)
    var key = localStorage.getItem(KEY_STORAGE);
    fetch(API + "/recharge-settings", {
      method: "PUT",
      headers: { "content-type": "application/json", Authorization: "Bearer " + key },
      body: JSON.stringify({ autoRechargeEnabled: true, autoRechargeThreshold: 3, autoRechargeAmount: 20 }),
    }).catch(function () {});

    var email = getEmail();
    var balanceUsd = parseFloat(bal.balanceUsd != null ? bal.balanceUsd : bal.balance) || 0;

    var host = document.createElement("div");
    host.id = "uc-first-topup";
    host.innerHTML = [
      '<style>',
      '#uc-first-topup, #uc-first-topup *{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",Roboto,sans-serif}',
      '#uc-first-topup .backdrop{position:fixed;inset:0;background:rgba(0,0,0,.62);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;animation:uc-fade .22s ease}',
      '@keyframes uc-fade{from{opacity:0}to{opacity:1}}',
      '@keyframes uc-pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}',
      '#uc-first-topup .modal{width:100%;max-width:520px;background:#0B0E11;color:#EDEDED;border:1px solid #1e2429;border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,.55);padding:26px 28px;animation:uc-pop .28s cubic-bezier(.2,.7,.2,1)}',
      '#uc-first-topup .strip{display:flex;align-items:center;justify-content:space-between;font:500 12px "JetBrains Mono",ui-monospace,monospace;color:#8a9498;margin-bottom:14px;gap:12px}',
      '#uc-first-topup .strip .email{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:60%}',
      '#uc-first-topup .strip .bal{color:#EDEDED}',
      '#uc-first-topup h2{margin:0 0 6px;font-size:22px;font-weight:600;letter-spacing:-0.01em;line-height:1.2}',
      '#uc-first-topup .desc{margin:0 0 18px;color:#98A3A3;font-size:13.5px;line-height:1.55}',
      '#uc-first-topup .chips{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px}',
      '#uc-first-topup .chip{padding:12px 0;background:#0F1418;border:1px solid #1e2429;border-radius:9px;color:#EDEDED;font:600 14px "JetBrains Mono",ui-monospace,monospace;cursor:pointer;transition:all .12s;text-align:center}',
      '#uc-first-topup .chip:hover{border-color:#2b333a}',
      '#uc-first-topup .chip.sel{border-color:#7c5cff;background:rgba(124,92,255,.08);color:#fff}',
      '#uc-first-topup .custom{display:flex;align-items:center;gap:8px;background:#0F1418;border:1px solid #1e2429;border-radius:9px;padding:8px 12px;margin-bottom:14px}',
      '#uc-first-topup .custom.sel{border-color:#7c5cff}',
      '#uc-first-topup .custom label{color:#8a9498;font-size:12.5px}',
      '#uc-first-topup .custom .pfx{color:#657172;font-family:"JetBrains Mono",monospace}',
      '#uc-first-topup .custom input{flex:1;background:transparent;border:0;color:#EDEDED;font:500 14px "JetBrains Mono",monospace;outline:none;min-width:0;padding:6px 0}',
      '#uc-first-topup .note{color:#657172;font-size:11.5px;margin:0 0 16px}',
      '#uc-first-topup .btn{width:100%;padding:13px 16px;background:#7c5cff;color:#fff;border:0;border-radius:9px;font:600 14px inherit;cursor:pointer;transition:opacity .15s,background .15s}',
      '#uc-first-topup .btn:hover:not(:disabled){background:#8f72ff}',
      '#uc-first-topup .btn:disabled{opacity:.35;cursor:not-allowed}',
      '#uc-first-topup .divider{height:1px;background:rgba(255,255,255,.06);margin:20px 0 18px}',
      '#uc-first-topup .ar{border:1px solid #1e2429;border-radius:10px;padding:14px 16px;background:#0D1114}',
      '#uc-first-topup .ar.off{opacity:.55}',
      '#uc-first-topup .ar-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}',
      '#uc-first-topup .ar-hd .ttl{font-size:13.5px;font-weight:600}',
      '#uc-first-topup .ar-hd .rec{font:500 10px "JetBrains Mono",monospace;color:#7c5cff;background:rgba(124,92,255,.1);padding:2px 6px;border-radius:4px;letter-spacing:.08em}',
      '#uc-first-topup .togg{position:relative;width:36px;height:20px;background:#1e2429;border-radius:999px;border:0;cursor:pointer;transition:background .15s;flex-shrink:0}',
      '#uc-first-topup .togg::after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;background:#fff;border-radius:50%;transition:transform .18s}',
      '#uc-first-topup .togg.on{background:#7c5cff}',
      '#uc-first-topup .togg.on::after{transform:translateX(16px)}',
      '#uc-first-topup .ar-desc{color:#98A3A3;font-size:12px;line-height:1.5;margin:0 0 10px}',
      '#uc-first-topup .ar-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:12.5px;color:#C7CFCE}',
      '#uc-first-topup .ar-row select{background:#0F1418;color:#EDEDED;border:1px solid #1e2429;border-radius:5px;padding:3px 6px;font:500 12px "JetBrains Mono",monospace}',
      '#uc-first-topup .skip{display:block;margin:14px auto 0;background:transparent;border:0;color:#657172;font-size:12px;cursor:pointer}',
      '#uc-first-topup .skip:hover{color:#98A3A3}',
      '</style>',
      '<div class="backdrop" id="uc-bd">',
      '  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="uc-title">',
      '    <div class="strip"><span class="email" title="' + escapeHtml(email) + '">' + (email ? escapeHtml(email) : 'Hesap: bağlı') + '</span><span class="bal">Mevcut Bakiye: ' + fmt(balanceUsd) + '</span></div>',
      '    <h2 id="uc-title">Kredi Satın Al</h2>',
      '    <p class="desc">Unichanl kullanım bazlı çalışır. Bakiyen oldukça modelleri kullanmaya devam edersin. Bakiye bittiğinde istekler durur.</p>',
      '    <div class="chips" id="uc-chips">',
      '      <button class="chip" data-amt="5">$5</button>',
      '      <button class="chip" data-amt="15">$15</button>',
      '      <button class="chip" data-amt="25">$25</button>',
      '      <button class="chip" data-amt="50">$50</button>',
      '    </div>',
      '    <div class="custom" id="uc-custom-wrap"><span class="pfx">$</span><input id="uc-custom" type="number" min="5" step="1" placeholder="Custom (min 5)" inputmode="numeric"></div>',
      '    <p class="note">Minimum $5. Vergi Polar checkout\'ta hesaplanır.</p>',
      '    <button class="btn" id="uc-pay" disabled>Bakiye Yükle</button>',
      '    <div class="divider"></div>',
      '    <div class="ar" id="uc-ar">',
      '      <div class="ar-hd"><span class="ttl">Otomatik Yenileme <span class="rec">ÖNERİLEN</span></span><button class="togg on" id="uc-tog" aria-label="Otomatik yenileme"></button></div>',
      '      <p class="ar-desc">Bakiye eşiğin altına düşerse, seçtiğin tutarda otomatik yükleme başlar. Kod yazarken kesinti yaşamazsın.</p>',
      '      <div class="ar-row">Bakiye <select id="uc-th"><option value="3" selected>$3</option><option value="5">$5</option><option value="10">$10</option></select> altına düşerse <select id="uc-am"><option value="10">$10</option><option value="20" selected>$20</option><option value="50">$50</option></select> yükle.</div>',
      '    </div>',
      '    <button class="skip" id="uc-skip">Şimdi değil</button>',
      '  </div>',
      '</div>'
    ].join("");

    document.body.appendChild(host);

    var selected = null;
    var chips = host.querySelectorAll(".chip");
    var custom = host.querySelector("#uc-custom");
    var customWrap = host.querySelector("#uc-custom-wrap");
    var payBtn = host.querySelector("#uc-pay");

    function updateBtn() {
      payBtn.disabled = !(selected && selected >= 5);
    }
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        chips.forEach(function (x) { x.classList.remove("sel"); });
        c.classList.add("sel");
        customWrap.classList.remove("sel");
        custom.value = "";
        selected = parseFloat(c.dataset.amt);
        updateBtn();
      });
    });
    custom.addEventListener("input", function () {
      chips.forEach(function (x) { x.classList.remove("sel"); });
      customWrap.classList.add("sel");
      var v = parseFloat(custom.value);
      selected = isFinite(v) ? v : null;
      updateBtn();
    });

    payBtn.addEventListener("click", function () {
      if (!selected || selected < 5) return;
      payBtn.disabled = true;
      payBtn.textContent = "Yönlendiriliyor…";
      location.href = buildPolarUrl(selected, email);
    });

    // Auto-recharge toggle
    var tog = host.querySelector("#uc-tog");
    var ar = host.querySelector("#uc-ar");
    var th = host.querySelector("#uc-th");
    var am = host.querySelector("#uc-am");
    var arEnabled = true;

    function pushAr() {
      var body = {
        autoRechargeEnabled: arEnabled,
        autoRechargeThreshold: parseFloat(th.value),
        autoRechargeAmount: parseFloat(am.value),
      };
      fetch(API + "/recharge-settings", {
        method: "PUT",
        headers: { "content-type": "application/json", Authorization: "Bearer " + key },
        body: JSON.stringify(body),
      }).catch(function () {});
    }
    tog.addEventListener("click", function () {
      arEnabled = !arEnabled;
      tog.classList.toggle("on", arEnabled);
      ar.classList.toggle("off", !arEnabled);
      pushAr();
    });
    var arDebounce;
    [th, am].forEach(function (el) {
      el.addEventListener("change", function () {
        clearTimeout(arDebounce);
        arDebounce = setTimeout(pushAr, 200);
      });
    });

    function close() {
      host.parentNode && host.parentNode.removeChild(host);
    }
    host.querySelector("#uc-skip").addEventListener("click", close);
    host.querySelector("#uc-bd").addEventListener("click", function (e) {
      if (e.target.id === "uc-bd") close();
    });
    document.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); }
    });
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
})();

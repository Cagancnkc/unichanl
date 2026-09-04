export const KEY_STORAGE = 'unichanl_key';
export const getKey = () => localStorage.getItem(KEY_STORAGE);
export const setKey = (k) => localStorage.setItem(KEY_STORAGE, k);
export const clearKey = () => localStorage.removeItem(KEY_STORAGE);

export async function api(path, opts = {}) {
  const key = getKey();
  if (!key) throw new Error('no_key');
  const headers = { Authorization: `Bearer ${key}`, ...(opts.headers || {}) };
  if (opts.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  const r = await fetch(path, { ...opts, headers });
  if (r.status === 401) {
    clearKey();
    location.href = '/signup.html';
    throw new Error('auth');
  }
  if (r.status === 204) return null;
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error?.message || `HTTP ${r.status}`);
  return data;
}

export function fmtUsd(v) {
  const n = typeof v === 'number' ? v : parseFloat(v);
  if (!Number.isFinite(n)) return '$0.00';
  return '$' + n.toFixed(n >= 100 ? 2 : 4);
}

export function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('tr-TR');
}

export function navBar(active) {
  const items = [
    ['balance', '/balance.html', 'Bakiye'],
    ['usage', '/usage.html', 'Kullanım'],
    ['models', '/models.html', 'Modeller'],
    ['apikeys', '/apikeys.html', 'API Anahtarları'],
  ];
  const links = items
    .map(([id, href, label]) => {
      const cls = id === active ? 'nav-a active' : 'nav-a';
      return `<a class="${cls}" href="${href}">${label}</a>`;
    })
    .join('');
  return `<nav class="nav">
    <div class="nav-brand">Unichanl</div>
    <div class="nav-links">${links}</div>
    <button class="nav-logout" id="logoutBtn" type="button">Çıkış</button>
  </nav>`;
}

export function mountNav(active) {
  const host = document.getElementById('nav');
  if (!host) return;
  host.innerHTML = navBar(active);
  const btn = document.getElementById('logoutBtn');
  if (btn) btn.addEventListener('click', () => {
    clearKey();
    location.reload();
  });
}

export const baseCss = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{background:#050a0b;color:#e8efe6;font-family:'Archivo',sans-serif;min-height:100vh}
body{padding:24px}
.wrap{max-width:1080px;margin:0 auto}
.nav{display:flex;align-items:center;gap:20px;padding:14px 18px;background:#0a1214;border:1px solid #1a2528;border-radius:12px;margin-bottom:24px}
.nav-brand{font-weight:700;letter-spacing:-.01em;color:#DFFF00}
.nav-links{display:flex;gap:6px;flex:1;flex-wrap:wrap}
.nav-a{color:#8a9a94;text-decoration:none;font-size:13px;padding:6px 10px;border-radius:8px;transition:all .15s}
.nav-a:hover{color:#e8efe6;background:#050a0b}
.nav-a.active{color:#DFFF00;background:#050a0b}
.nav-logout{background:transparent;border:1px solid #1a2528;color:#8a9a94;padding:6px 12px;border-radius:8px;font-family:inherit;font-size:12px;cursor:pointer;transition:all .15s}
.nav-logout:hover{border-color:#DFFF00;color:#DFFF00}
.card{background:#0a1214;border:1px solid #1a2528;border-radius:16px;padding:28px;margin-bottom:20px}
h1{font-size:22px;font-weight:700;margin-bottom:6px;letter-spacing:-.01em}
h2{font-size:16px;font-weight:600;margin-bottom:14px}
p.sub{color:#8a9a94;font-size:14px;margin-bottom:20px}
label{display:block;font-size:12px;color:#8a9a94;margin-bottom:6px;text-transform:uppercase;letter-spacing:.08em}
input{width:100%;background:#050a0b;border:1px solid #1a2528;color:#e8efe6;padding:12px 14px;border-radius:10px;font-family:inherit;font-size:14px;outline:none;transition:border-color .15s}
input:focus{border-color:#DFFF00}
.row{margin-bottom:16px}
button{background:#DFFF00;color:#050a0b;border:0;padding:12px 20px;border-radius:10px;font-family:inherit;font-weight:700;font-size:13px;cursor:pointer;letter-spacing:.02em;transition:filter .15s}
button:hover:not(:disabled){filter:brightness(1.08)}
button:disabled{opacity:.5;cursor:not-allowed}
button.ghost{background:transparent;color:#e8efe6;border:1px solid #1a2528}
button.ghost:hover:not(:disabled){border-color:#DFFF00;color:#DFFF00;filter:none}
button.danger{background:transparent;color:#ff6b6b;border:1px solid #2a1518;padding:6px 12px;font-size:12px}
button.danger:hover:not(:disabled){background:#ff6b6b;color:#050a0b;filter:none}
.err{margin-top:14px;color:#ff6b6b;font-size:13px;display:none}
.err.show{display:block}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}
.metric{background:#0a1214;border:1px solid #1a2528;border-radius:14px;padding:20px}
.metric .lbl{font-size:11px;color:#8a9a94;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px}
.metric .val{font-size:28px;font-weight:700;color:#DFFF00;font-family:'JetBrains Mono',monospace}
.metric .sub{font-size:12px;color:#8a9a94;margin-top:6px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;padding:10px 12px;color:#8a9a94;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid #1a2528}
td{padding:12px;border-bottom:1px solid #1a2528;color:#e8efe6}
tr:last-child td{border-bottom:0}
tr:hover td{background:#050a0b}
.mono{font-family:'JetBrains Mono',monospace;font-size:12px;color:#DFFF00}
.badge{display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;font-family:'JetBrains Mono',monospace}
.badge.ok{background:#0a2a1a;color:#7fff8a;border:1px solid #1a4a2a}
.badge.warn{background:#2a2010;color:#ffd66b;border:1px solid #4a3a1a}
.badge.err{background:#2a1518;color:#ff6b6b;border:1px solid #4a1a20}
.modal{position:fixed;inset:0;background:rgba(5,10,11,.85);display:none;align-items:center;justify-content:center;z-index:10;padding:20px}
.modal.show{display:flex}
.modal-card{background:#0a1214;border:1px solid #1a2528;border-radius:16px;padding:28px;max-width:420px;width:100%}
.row-actions{display:flex;gap:10px;margin-top:20px}
.empty{color:#8a9a94;font-size:14px;padding:40px 20px;text-align:center}
.toggle-row{display:flex;align-items:center;gap:12px;cursor:pointer;margin:16px 0}
.toggle-row input[type=checkbox]{width:20px;height:20px;accent-color:#DFFF00;cursor:pointer}
.toggle-label{font-size:14px}
`;

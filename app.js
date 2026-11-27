/* ============================================================
   DOMI — Finanzas personales
   App local-first: sin servidor, datos en localStorage.
   ============================================================ */
(() => {
  'use strict';

  // ---------- Utilidades ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const ym = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  const today = () => iso(new Date());
  const parseYM = s => { const [y, m] = s.split('-').map(Number); return new Date(y, m - 1, 1); };
  const shiftYM = (s, n) => { const d = parseYM(s); d.setMonth(d.getMonth() + n); return ym(d); };
  const daysIn = s => { const d = parseYM(s); return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); };
  const sum = (arr, f = x => x) => arr.reduce((a, b) => a + f(b), 0);

  const parseAmount = v => {
    let s = String(v).replace(/[^\d.,]/g, '');
    if (s.includes('.') && s.includes(',')) s = s.replace(/,/g, '');
    else s = s.replace(',', '.');
    const n = parseFloat(s);
    return isFinite(n) ? Math.round(n * 100) / 100 : 0;
  };

  // ---------- Iconografía (trazo 1.8, sistema propio) ----------
  const P = {
    home: 'M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M10 21v-6h4v6',
    list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
    target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01',
    pie: 'M21 12a9 9 0 1 1-9-9v9zM15 3.5A9 9 0 0 1 20.5 9H15z',
    gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    plus: 'M12 5v14M5 12h14',
    x: 'M18 6 6 18M6 6l12 12',
    search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
    trash: 'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14',
    download: 'M12 3v12M7 10l5 5 5-5M5 21h14',
    upload: 'M12 21V9M7 14l5-5 5 5M5 3h14',
    camera: 'M4 8h3l2-3h6l2 3h3v12H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    receipt: 'M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM9 8h6M9 12h6',
    briefcase: 'M3 7h18v13H3zM8 7V4h8v3M3 13h18',
    spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6',
    // Categorías
    food: 'M7 3v8M4.5 3v4.5a2.5 2.5 0 0 0 5 0V3M7 11v10M17.5 3C15.5 3 14 5 14 8.5s1.5 4.5 3.5 4.5V21',
    car: 'M5 17h14M6 17l1.6-6.5h8.8L18 17M5 17v3h2.5v-3M16.5 17v3H19v-3M3 11h2.5M18.5 11H21',
    house: 'M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6',
    bag: 'M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2',
    pulse: 'M3 12h4l2.5-5 4 10 2.5-5H21',
    ticket: 'M3 7h18v3.5a1.5 1.5 0 0 0 0 3V17H3v-3.5a1.5 1.5 0 0 0 0-3zM14 7v10',
    bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
    book: 'M4 19V5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2zM20 19v2H6',
    repeat: 'M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3',
    plane: 'M2 13l20-8-6 16-4-6zM12 15l4-5',
    dots: 'M5 12h.01M12 12h.01M19 12h.01',
    code: 'M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14',
    trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
    gift: 'M3 8h18v4H3zM5 12v9h14v-9M12 8v13M12 8C10 4 6.5 4 6.5 6.2S12 8 12 8zm0 0c2-4 5.5-4 5.5-1.8S12 8 12 8z',
    coin: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15 9.5c-.5-1-1.6-1.5-3-1.5-1.8 0-3 .9-3 2.1 0 2.9 6 1.4 6 4.3 0 1.2-1.3 2.1-3 2.1-1.5 0-2.6-.6-3.1-1.6M12 6.5v11'
  };
  const icon = (name, sw = 1.8) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[name] || P.dots}"/></svg>`;

  // ---------- Categorías ----------
  // Paleta restringida: azules, verdes y escala de grises -> consistencia de marca
  const CATS = {
    expense: [
      { id: 'comida', name: 'Comida', icon: 'food', color: '#3d6bff' },
      { id: 'transporte', name: 'Transporte', icon: 'car', color: '#3bff8a' },
      { id: 'hogar', name: 'Hogar', icon: 'house', color: 'var(--cat-ink)' },
      { id: 'compras', name: 'Compras', icon: 'bag', color: '#8aa5ff' },
      { id: 'servicios', name: 'Servicios', icon: 'bolt', color: '#1f9e57' },
      { id: 'salud', name: 'Salud', icon: 'pulse', color: '#9a9a9e' },
      { id: 'ocio', name: 'Ocio', icon: 'ticket', color: '#a6ffcb' },
      { id: 'suscripciones', name: 'Suscripciones', icon: 'repeat', color: '#2238a8' },
      { id: 'educacion', name: 'Educación', icon: 'book', color: 'var(--cat-ink-2)' },
      { id: 'viajes', name: 'Viajes', icon: 'plane', color: '#5b5b60' },
      { id: 'otros', name: 'Otros', icon: 'dots', color: '#3a3a3e' }
    ],
    income: [
      { id: 'salario', name: 'Salario', icon: 'briefcase', color: '#3bff8a' },
      { id: 'freelance', name: 'Freelance', icon: 'code', color: '#3d6bff' },
      { id: 'inversion', name: 'Inversión', icon: 'trend', color: '#a6ffcb' },
      { id: 'reembolso', name: 'Reembolso', icon: 'receipt', color: '#8aa5ff' },
      { id: 'regalo', name: 'Regalo', icon: 'gift', color: 'var(--cat-ink)' },
      { id: 'otros-in', name: 'Otros', icon: 'coin', color: '#9a9a9e' }
    ]
  };
  const ALL_CATS = [...CATS.expense, ...CATS.income];
  const cat = id => ALL_CATS.find(c => c.id === id) || CATS.expense.at(-1);
  const ACCOUNTS = ['Débito', 'Crédito', 'Efectivo', 'Transferencia'];
  const CURRENCIES = { MXN: 'es-MX', USD: 'en-US', EUR: 'es-ES', COP: 'es-CO', ARS: 'es-AR', CLP: 'es-CL', PEN: 'es-PE' };

  // ---------- Estado ----------
  const STORE = 'domi.v1';
  const LEGACY_STORE = 'fosforo.v1';
  const blank = () => ({ tx: [], budgets: {}, goals: [], settings: { currency: 'MXN', theme: 'dark', name: '' } });
  const load = () => {
    try {
      const s = JSON.parse(localStorage.getItem(STORE) || localStorage.getItem(LEGACY_STORE));
      if (s && Array.isArray(s.tx)) return { ...blank(), ...s, settings: { ...blank().settings, ...s.settings } };
    } catch (e) { /* sin almacenamiento disponible */ }
    return blank();
  };
  let state = load();
  const save = () => {
    try { localStorage.setItem(STORE, JSON.stringify(state)); return true; }
    catch (e) { toast('No hay espacio suficiente. Elimina algunos recibos o exporta un respaldo.'); return false; }
  };

  const ui = { view: 'inicio', month: ym(new Date()), q: '', type: 'all', cat: 'all', draft: null };

  // ---------- Formato ----------
  const money = (n, opts = {}) => {
    const cur = state.settings.currency;
    return new Intl.NumberFormat(CURRENCIES[cur] || 'es-MX', { style: 'currency', currency: cur, maximumFractionDigits: opts.compact ? 0 : 2, minimumFractionDigits: opts.compact ? 0 : 2 }).format(n);
  };
  const moneySplit = n => {
    const s = money(Math.abs(n));
    const m = s.match(/^(.*?)([.,]\d{2})(\D*)$/);
    return m ? { int: m[1], cents: m[2] + m[3] } : { int: s, cents: '' };
  };
  const curSymbol = () => money(0).replace(/[\d.,\s]/g, '') || '$';
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const monthName = s => { const d = parseYM(s); const m = MONTHS[d.getMonth()]; return `${m[0].toUpperCase() + m.slice(1)} ${d.getFullYear()}`; };
  const monthShort = s => parseYM(s).toLocaleDateString('es-MX', { month: 'short' }).replace('.', '');
  const dayLabel = d => {
    if (d === today()) return 'Hoy';
    const y = new Date(); y.setDate(y.getDate() - 1);
    if (d === iso(y)) return 'Ayer';
    const [Y, M, D] = d.split('-').map(Number);
    return new Date(Y, M - 1, D).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' });
  };
  const pctFmt = n => `${Math.round(n)}%`;

  // ---------- Selectores de datos ----------
  const inMonth = (m = ui.month) => state.tx.filter(t => t.date.startsWith(m));
  const totals = list => {
    const inc = sum(list.filter(t => t.type === 'income'), t => t.amount);
    const exp = sum(list.filter(t => t.type === 'expense'), t => t.amount);
    return { inc, exp, bal: inc - exp };
  };
  const byCat = list => {
    const map = {};
    list.filter(t => t.type === 'expense').forEach(t => { map[t.cat] = (map[t.cat] || 0) + t.amount; });
    return Object.entries(map).map(([id, v]) => ({ ...cat(id), value: v })).sort((a, b) => b.value - a.value);
  };
  const sorted = list => [...list].sort((a, b) => b.date.localeCompare(a.date) || b.created - a.created);

  // ---------- Navegación ----------
  const NAV = [
    { id: 'inicio', label: 'Inicio', icon: 'home' },
    { id: 'movimientos', label: 'Movimientos', icon: 'list' },
    { id: 'presupuestos', label: 'Presupuestos', icon: 'pie' },
    { id: 'metas', label: 'Metas', icon: 'target' },
    { id: 'ajustes', label: 'Ajustes', icon: 'gear' }
  ];

  const renderNav = () => {
    const tab = n => `<a class="tab" href="#${n.id}" ${ui.view === n.id ? 'aria-current="page"' : ''}>${icon(n.icon)}<span>${n.label === 'Movimientos' ? 'Historial' : n.label === 'Presupuestos' ? 'Límites' : n.label}</span></a>`;
    $('#tabbar').innerHTML = tab(NAV[0]) + tab(NAV[1]) + `<button class="fab" data-action="add" aria-label="Nuevo movimiento">${icon('plus', 2.4)}</button>` + tab(NAV[2]) + tab(NAV[3]);
    $('#monthLabel').textContent = monthName(ui.month);
    $('#monthSwitch').style.visibility = ['metas', 'ajustes'].includes(ui.view) ? 'hidden' : 'visible';
  };

  // ---------- Gráficas (SVG propio, sin librerías) ----------
  const dailyChart = list => {
    const n = daysIn(ui.month);
    const vals = Array(n).fill(0);
    list.filter(t => t.type === 'expense').forEach(t => { vals[+t.date.slice(8) - 1] += t.amount; });
    const max = Math.max(...vals, 1);
    const W = n * 12, H = 120, top = 8, base = H - 18;
    const isCur = ui.month === ym(new Date());
    const td = new Date().getDate();
    const active = isCur ? vals.slice(0, td) : vals;
    const avg = active.length ? sum(active) / active.length : 0;
    const bars = vals.map((v, i) => {
      const h = v ? Math.max(3, (v / max) * (base - top)) : 2;
      const future = isCur && i + 1 > td;
      const isToday = isCur && i + 1 === td;
      const fill = isToday ? 'var(--green)' : future ? 'var(--surface-3)' : v ? 'var(--blue)' : 'var(--surface-3)';
      return `<rect x="${i * 12 + 3}" y="${base - h}" width="6" height="${h}" rx="3" fill="${fill}"><title>${i + 1}: ${money(v)}</title></rect>`;
    }).join('');
    const ay = base - (avg / max) * (base - top);
    const labels = [1, 8, 15, 22, n].map(d => `<text x="${(d - 1) * 12 + 6}" y="${H - 2}" text-anchor="middle">${d}</text>`).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gasto por día">${bars}${avg ? `<line x1="0" x2="${W}" y1="${ay}" y2="${ay}" stroke="var(--text)" stroke-opacity=".35" stroke-dasharray="3 4"/>` : ''}${labels}</svg>`;
  };

  const donut = (data, size = 140) => {
    const total = sum(data, d => d.value);
    const r = 52, c = 2 * Math.PI * r, sw = 16;
    let off = 0;
    const gap = data.length > 1 ? 3 : 0;
    const segs = data.map(d => {
      const len = (d.value / total) * c;
      const s = `<circle r="${r}" cx="70" cy="70" fill="none" style="stroke:${d.color}" stroke-width="${sw}" stroke-dasharray="${Math.max(len - gap, 0.5)} ${c}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"><title>${esc(d.name)}: ${money(d.value)}</title></circle>`;
      off += len;
      return s;
    }).join('');
    return `<svg width="${size}" height="${size}" viewBox="0 0 140 140" role="img" aria-label="Gastos por categoría"><circle r="${r}" cx="70" cy="70" fill="none" stroke="var(--surface-3)" stroke-width="${sw}"/>${segs}
      <text x="70" y="66" text-anchor="middle" style="font-family:var(--font-mono);font-size:8.5px;letter-spacing:.08em;fill:var(--muted)">GASTO TOTAL</text>
      <text x="70" y="84" text-anchor="middle" class="donut-center" style="font-size:17px;font-weight:700;letter-spacing:-.04em;fill:var(--text)">${esc(money(total, { compact: true }))}</text></svg>`;
  };

  const trendChart = () => {
    const months = Array.from({ length: 6 }, (_, i) => shiftYM(ui.month, i - 5));
    const data = months.map(m => ({ m, ...totals(inMonth(m)) }));
    const max = Math.max(...data.map(d => Math.max(d.inc, d.exp)), 1);
    const W = 300, H = 150, base = H - 20, top = 8, gw = W / 6;
    const g = data.map((d, i) => {
      const x = i * gw + gw / 2;
      const hi = (d.inc / max) * (base - top), he = (d.exp / max) * (base - top);
      const cur = d.m === ui.month;
      return `<g opacity="${cur ? 1 : 0.55}">
        <rect x="${x - 11}" y="${base - Math.max(hi, 2)}" width="10" height="${Math.max(hi, 2)}" rx="3" fill="var(--green)"><title>Ingresos ${money(d.inc)}</title></rect>
        <rect x="${x + 1}" y="${base - Math.max(he, 2)}" width="10" height="${Math.max(he, 2)}" rx="3" fill="var(--blue)"><title>Gastos ${money(d.exp)}</title></rect>
        <text x="${x}" y="${H - 4}" text-anchor="middle" style="${cur ? 'fill:var(--text);font-weight:600' : ''}">${monthShort(d.m).toUpperCase()}</text></g>`;
    }).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Ingresos contra gastos, últimos 6 meses"><line x1="0" x2="${W}" y1="${base + .5}" y2="${base + .5}" stroke="var(--line-strong)"/>${g}</svg>`;
  };

  const ring = (pct, size = 92, color = 'var(--green)') => {
    const r = 38, c = 2 * Math.PI * r, p = Math.min(pct, 100) / 100;
    return `<svg width="${size}" height="${size}" viewBox="0 0 92 92" aria-hidden="true"><circle r="${r}" cx="46" cy="46" fill="none" stroke="var(--surface-3)" stroke-width="9"/><circle r="${r}" cx="46" cy="46" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${c * p} ${c}" transform="rotate(-90 46 46)"/><text x="46" y="51" text-anchor="middle" style="font-family:var(--font-display);font-weight:700;font-size:17px;letter-spacing:-.04em;fill:var(--text)">${Math.round(pct)}%</text></svg>`;
  };

  // ---------- Componentes ----------
  const txRow = t => {
    const c = cat(t.cat);
    const flags = (t.receipt ? icon('receipt') : '');
    const status = t.reimb ? `<span class="status ${t.reimb === 'done' ? 'done' : ''}">${t.reimb === 'done' ? 'Reembolsado' : 'Por reembolsar'}</span>` : '';
    return `<li class="tx" data-edit="${t.id}" tabindex="0" role="button" aria-label="Editar ${esc(t.note || c.name)}">
      <div class="tx-ico ${t.type}">${icon(c.icon)}</div>
      <div class="tx-main">
        <div class="tx-title">${esc(t.note || c.name)}${flags ? `<span class="tx-flags">${flags}</span>` : ''}</div>
        <div class="tx-meta"><span>${esc(c.name)} · ${esc(t.account)}</span>${status}</div>
      </div>
      <div class="tx-amt num ${t.type}">${t.type === 'income' ? '+' : '−'}${money(t.amount)}</div>
    </li>`;
  };

  const emptyState = (title, text, extra = '') => `<div class="card empty">
    <div class="glyph">${icon('spark')}</div><h3>${title}</h3><p>${text}</p>
    <div class="actions"><button class="btn green" data-action="add">${icon('plus', 2.2)}Agregar movimiento</button>${extra}</div></div>`;

  // ---------- Vistas ----------
  const greeting = () => {
    const h = new Date().getHours();
    const g = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
    return state.settings.name ? `${g}, ${esc(state.settings.name)}` : g;
  };

  // ---------- Instalación en iOS / Android ----------
  const platform = (() => {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    return 'desktop';
  })();
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  let installPrompt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; if (ui.view === 'inicio') render(); });
  window.addEventListener('appinstalled', () => { installPrompt = null; state.settings.installHidden = true; save(); render(); toast('DOMI quedó instalada'); });
  const shareIco = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4M7 11H5v10h14V11h-2"/></svg>';

  const installBanner = () => {
    if (standalone || state.settings.installHidden) return '';
    let title, text, act = '';
    if (platform === 'ios') {
      title = 'Instala DOMI en tu iPhone';
      text = `En Safari toca ${shareIco} Compartir y luego «Agregar a inicio».`;
    } else if (platform === 'android') {
      title = 'Instala DOMI en tu Android';
      if (installPrompt) { text = 'Pantalla completa, ícono propio y funciona sin conexión.'; act = '<button class="btn green sm" data-action="install">Instalar</button>'; }
      else text = 'En Chrome abre el menú ⋮ y toca «Instalar app».';
    } else {
      title = 'DOMI vive en tu celular';
      text = 'Abre este enlace en tu iPhone o Android para instalarla.';
    }
    return `<div class="install" role="note"><div class="ico"><img src="icons/icon-192.png" alt=""></div><div><b>${title}</b><p>${text}</p></div>
      <div class="acts">${act}<button class="icon-btn" data-action="install-hide" aria-label="Ocultar aviso">${icon('x')}</button></div></div>`;
  };

  const haptic = (p = 12) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* iOS no soporta vibración web */ } };

  const viewInicio = () => {
    const list = inMonth();
    const { inc, exp, bal } = totals(list);
    if (!state.tx.length) {
      return `<div class="page-head"><div><div class="eyebrow">${greeting()}</div><h1 class="h1">Tu dinero.<br><span>Bajo tu dominio.</span></h1></div></div>
      ${installBanner()}${emptyState('Empieza con tu primer movimiento', 'Registra un gasto o ingreso y DOMI construye tus gráficas, presupuestos e insights en automático.', '<button class="btn" data-action="demo">Ver con datos de ejemplo</button>')}`;
    }
    const prev = totals(inMonth(shiftYM(ui.month, -1)));
    const savingRate = inc ? (bal / inc) * 100 : 0;
    const cats = byCat(list);
    const top = cats[0];
    const isCur = ui.month === ym(new Date());
    const elapsed = isCur ? new Date().getDate() : daysIn(ui.month);
    const dailyAvg = exp / elapsed;
    const projection = isCur ? dailyAvg * daysIn(ui.month) : exp;
    const delta = prev.exp ? ((exp - prev.exp) / prev.exp) * 100 : null;
    const pendingReimb = sum(state.tx.filter(t => t.reimb === 'pending'), t => t.amount);
    const { int, cents } = moneySplit(bal);

    const legendData = cats.length > 5 ? [...cats.slice(0, 4), { name: 'Otras', color: '#3a3a3e', value: sum(cats.slice(4), c => c.value) }] : cats;

    return `<div class="page-head"><div><div class="eyebrow">${greeting()}</div><h1 class="h1">Resumen<span>.</span></h1></div></div>
    ${installBanner()}
    <div class="grid dash">
      <section class="hero" aria-label="Balance del mes">
        <div class="eyebrow">Balance · ${esc(monthName(ui.month))}</div>
        <div class="hero-amount num"><span class="sign">${bal < 0 ? '−' : ''}</span>${esc(int)}<span class="cents">${esc(cents)}</span></div>
        <div class="hero-sub">${inc ? `Ahorras <b class="pos">${pctFmt(Math.max(savingRate, 0))}</b> de lo que ganas este mes.` : 'Registra tus ingresos para medir tu tasa de ahorro.'}</div>
        <div class="hero-stats">
          <div class="hero-stat"><div class="eyebrow"><i class="dot g"></i>Ingresos</div><strong class="num">${money(inc, { compact: true })}</strong></div>
          <div class="hero-stat"><div class="eyebrow"><i class="dot b"></i>Gastos</div><strong class="num">${money(exp, { compact: true })}</strong></div>
          <div class="hero-stat"><div class="eyebrow"><i class="dot w"></i>Movs.</div><strong class="num">${list.length}</strong></div>
        </div>
      </section>

      <div class="insights">
        <div class="card insight"><div class="eyebrow">Vs. mes anterior</div><strong class="num ${delta !== null && delta <= 0 ? 'pos' : ''}">${delta === null ? '—' : (delta > 0 ? '+' : '') + pctFmt(delta)}</strong><p>${delta === null ? 'Sin datos del mes pasado.' : delta <= 0 ? 'Gastas menos. Bien hecho.' : 'Gastas más que el mes pasado.'}</p></div>
        <div class="card insight"><div class="eyebrow">Promedio diario</div><strong class="num">${money(dailyAvg, { compact: true })}</strong><p>En ${elapsed} días transcurridos.</p></div>
        <div class="card insight"><div class="eyebrow">${isCur ? 'Proyección' : 'Total gastado'}</div><strong class="num">${money(projection, { compact: true })}</strong><p>${isCur ? 'Gasto estimado al cierre de mes.' : 'Cierre del mes.'}</p></div>
        ${pendingReimb ? `<button class="card insight" data-action="reimb" style="text-align:left"><div class="eyebrow">Por reembolsar</div><strong class="num" style="color:var(--blue-text)">${money(pendingReimb, { compact: true })}</strong><p>Gastos de trabajo pendientes →</p></button>`
        : `<div class="card insight"><div class="eyebrow">Mayor categoría</div><strong>${top ? esc(top.name) : '—'}</strong><p>${top ? `${pctFmt((top.value / exp) * 100)} de tu gasto.` : 'Sin gastos aún.'}</p></div>`}
      </div>

      <section class="card c-daily">
        <div class="card-head"><h2 class="h2">Ritmo de gasto</h2><div class="chart-key"><span><i class="dot b"></i>Diario</span><span><i style="width:12px;border-top:1.5px dashed var(--muted)"></i>Promedio</span></div></div>
        ${dailyChart(list)}
      </section>

      <section class="card c-cats">
        <div class="card-head"><h2 class="h2">En qué se va</h2><a class="link" href="#presupuestos">Límites</a></div>
        ${cats.length ? `<div class="donut-wrap">${donut(cats)}<ul class="legend">${legendData.map(c => `<li><i class="sw" style="background:${c.color}"></i><span>${esc(c.name)}</span><span class="pct">${pctFmt((c.value / exp) * 100)}</span><span class="amt num">${money(c.value, { compact: true })}</span></li>`).join('')}</ul></div>` : '<p class="lede">Aún no hay gastos este mes.</p>'}
      </section>

      <section class="card c-trend">
        <div class="card-head"><h2 class="h2">Últimos 6 meses</h2><div class="chart-key"><span><i class="dot g"></i>Ingresos</span><span><i class="dot b"></i>Gastos</span></div></div>
        ${trendChart()}
      </section>

      <section class="card c-recent">
        <div class="card-head"><h2 class="h2">Recientes</h2><a class="link" href="#movimientos">Ver todo</a></div>
        ${list.length ? `<ul class="tx-list">${sorted(list).slice(0, 6).map(txRow).join('')}</ul>` : '<p class="lede">Sin movimientos en este mes.</p>'}
      </section>
    </div>`;
  };

  const viewMovimientos = () => {
    let list = inMonth();
    const q = ui.q.trim().toLowerCase();
    if (ui.type === 'reimb') list = state.tx.filter(t => t.reimb);
    else if (ui.type !== 'all') list = list.filter(t => t.type === ui.type);
    if (ui.cat !== 'all') list = list.filter(t => t.cat === ui.cat);
    if (q) list = list.filter(t => (t.note + ' ' + cat(t.cat).name + ' ' + t.account).toLowerCase().includes(q));
    const { inc, exp, bal } = totals(list);
    const groups = {};
    sorted(list).forEach(t => (groups[t.date] = groups[t.date] || []).push(t));
    const pill = (v, l) => `<button class="pill" data-filter-type="${v}" aria-pressed="${ui.type === v}">${l}</button>`;

    return `<div class="page-head"><div><div class="eyebrow">${ui.type === 'reimb' ? 'Todos los meses' : esc(monthName(ui.month))}</div><h1 class="h1">Movimientos<span>.</span></h1></div>
      <button class="btn sm" data-action="export-csv">${icon('download')}Exportar reporte</button></div>
    <div class="toolbar">
      <label class="search">${icon('search')}<span class="sr-only">Buscar</span><input id="q" type="search" placeholder="Buscar por nota, categoría o cuenta" value="${esc(ui.q)}" autocomplete="off"></label>
      <div class="filters">${pill('all', 'Todos')}${pill('expense', 'Gastos')}${pill('income', 'Ingresos')}${pill('reimb', 'Reembolsables')}
        <select class="pill" id="catFilter" aria-label="Filtrar por categoría"><option value="all">Categoría</option>${ALL_CATS.map(c => `<option value="${c.id}" ${ui.cat === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}</select>
      </div>
    </div>
    <div class="summary-row">
      <div class="card"><div class="eyebrow">Entradas</div><strong class="num pos">${money(inc, { compact: true })}</strong></div>
      <div class="card"><div class="eyebrow">Salidas</div><strong class="num">${money(exp, { compact: true })}</strong></div>
      <div class="card"><div class="eyebrow">Neto</div><strong class="num">${money(bal, { compact: true })}</strong></div>
    </div>
    ${list.length ? `<div class="card">${Object.entries(groups).map(([d, items]) => {
      const net = sum(items, t => t.type === 'income' ? t.amount : -t.amount);
      return `<div class="day-group"><div class="day-head"><span class="eyebrow">${esc(dayLabel(d))}</span><span class="num">${net >= 0 ? '+' : '−'}${money(Math.abs(net))}</span></div><ul class="tx-list">${items.map(txRow).join('')}</ul></div>`;
    }).join('')}</div>`
    : state.tx.length ? `<div class="card empty"><div class="glyph">${icon('search')}</div><h3>Sin resultados</h3><p>Prueba con otro filtro o cambia de mes.</p></div>`
    : emptyState('Aún no hay movimientos', 'Cada gasto que registres aparecerá aquí, agrupado por día.')}`;
  };

  const viewPresupuestos = () => {
    const list = inMonth();
    const spent = {};
    list.filter(t => t.type === 'expense').forEach(t => { spent[t.cat] = (spent[t.cat] || 0) + t.amount; });
    const entries = Object.entries(state.budgets).filter(([, v]) => v > 0);
    const totalB = sum(entries, ([, v]) => v);
    const totalS = sum(entries, ([id]) => spent[id] || 0);
    const pct = totalB ? (totalS / totalB) * 100 : 0;
    const level = p => p >= 100 ? 'over' : p >= 80 ? 'warn' : '';

    return `<div class="page-head"><div><div class="eyebrow">${esc(monthName(ui.month))}</div><h1 class="h1">Límites<span>.</span></h1><p class="lede">Define cuánto quieres gastar por categoría. Te avisamos al 80%.</p></div>
      <button class="btn green sm" data-action="budget">${icon('plus', 2.2)}Nuevo límite</button></div>
    ${entries.length ? `<div class="grid two-col">
      <section class="card"><div class="ring-wrap">${ring(pct, 96, pct >= 100 ? 'var(--danger)' : pct >= 80 ? 'var(--blue)' : 'var(--green)')}
        <div><div class="eyebrow">Disponible</div><div class="big num">${money(Math.max(totalB - totalS, 0), { compact: true })}</div><p class="lede" style="margin-top:4px">${money(totalS, { compact: true })} de ${money(totalB, { compact: true })} usados</p></div></div></section>
      <section class="card">${entries.sort((a, b) => ((spent[b[0]] || 0) / b[1]) - ((spent[a[0]] || 0) / a[1])).map(([id, b]) => {
        const c = cat(id), s = spent[id] || 0, p = (s / b) * 100, l = level(p);
        return `<div class="budget" data-budget="${id}" role="button" tabindex="0">
          <div class="budget-top"><div class="tx-ico">${icon(c.icon)}</div><div><div class="tx-title">${esc(c.name)}</div><div class="tx-meta num">${money(s, { compact: true })} de ${money(b, { compact: true })}</div></div>
          <span class="tag ${l}">${l === 'over' ? 'EXCEDIDO' : l === 'warn' ? pctFmt(p) : pctFmt(p)}</span></div>
          <div class="bar ${l}"><i style="width:${Math.min(p, 100)}%"></i></div>
          <div class="budget-foot"><span>${s > b ? `Te pasaste ${money(s - b, { compact: true })}` : `Quedan ${money(b - s, { compact: true })}`}</span><span>${ui.month === ym(new Date()) ? `${daysIn(ui.month) - new Date().getDate()} días restantes` : ''}</span></div>
        </div>`;
      }).join('')}</section></div>`
    : `<div class="card empty"><div class="glyph">${icon('pie')}</div><h3>Sin límites definidos</h3><p>Ponle tope a tus categorías más caras y mantén el control sin pensar.</p><div class="actions"><button class="btn green" data-action="budget">${icon('plus', 2.2)}Crear primer límite</button></div></div>`}`;
  };

  const viewMetas = () => {
    const g = state.goals;
    const total = sum(g, x => x.saved), target = sum(g, x => x.target);
    return `<div class="page-head"><div><div class="eyebrow">Ahorro</div><h1 class="h1">Metas<span>.</span></h1><p class="lede">${g.length ? `${money(total, { compact: true })} ahorrados de ${money(target, { compact: true })}.` : 'Ponle nombre a lo que quieres lograr.'}</p></div>
      <button class="btn green sm" data-action="goal">${icon('plus', 2.2)}Nueva meta</button></div>
    ${g.length ? `<div class="goals">${g.map(x => {
      const p = x.target ? (x.saved / x.target) * 100 : 0;
      const done = p >= 100;
      return `<article class="card goal ${done ? 'done' : ''}">
        <div class="goal-top"><div><div class="eyebrow">${done ? 'Meta cumplida' : x.deadline ? 'Para ' + new Date(x.deadline + 'T12:00').toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }) : 'Sin fecha'}</div><div class="goal-name">${esc(x.name)}</div></div>
          <button class="icon-btn" data-goal-del="${x.id}" aria-label="Eliminar meta">${icon('trash')}</button></div>
        <div class="goal-amt num">${money(x.saved, { compact: true })} <span>/ ${money(x.target, { compact: true })}</span></div>
        <div class="bar"><i style="width:${Math.min(p, 100)}%"></i></div>
        <div class="budget-foot"><span>${pctFmt(p)} completado</span><span>${done ? '' : 'Faltan ' + money(x.target - x.saved, { compact: true })}</span></div>
        <div class="goal-actions"><button class="btn sm ${done ? '' : 'primary'}" data-goal-add="${x.id}">${icon('plus', 2.2)}Abonar</button><button class="btn sm ghost" data-goal-edit="${x.id}">Editar</button></div>
      </article>`;
    }).join('')}</div>`
    : `<div class="card empty"><div class="glyph">${icon('target')}</div><h3>Tu primera meta</h3><p>Un viaje, un fondo de emergencia, una laptop. Define el monto y abona a tu ritmo.</p><div class="actions"><button class="btn green" data-action="goal">${icon('plus', 2.2)}Crear meta</button></div></div>`}`;
  };

  const viewAjustes = () => {
    const s = state.settings;
    const kb = Math.round((JSON.stringify(state).length / 1024));
    return `<div class="page-head"><div><div class="eyebrow">Preferencias</div><h1 class="h1">Ajustes<span>.</span></h1></div></div>
    <div class="grid two-col">
      <section class="card"><h2 class="h2" style="margin-bottom:6px">Perfil</h2><div class="set-list">
        <div class="set-row"><div><div class="label">Tu nombre</div><div class="hint">Para saludarte en el inicio</div></div><input id="setName" value="${esc(s.name)}" placeholder="Opcional" maxlength="24"></div>
        <div class="set-row"><div><div class="label">Moneda</div><div class="hint">Formato de todos los montos</div></div><select id="setCur">${Object.keys(CURRENCIES).map(c => `<option ${c === s.currency ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
        <div class="set-row"><div><div class="label">Modo oscuro</div><div class="hint">Negro profundo o blanco editorial</div></div><button class="switch" role="switch" aria-checked="${s.theme === 'dark'}" data-action="theme" aria-label="Modo oscuro"></button></div>
        <div class="set-row"><div><div class="label">App en tu celular</div><div class="hint">${standalone ? 'Instalada en esta pantalla de inicio' : platform === 'ios' ? 'iPhone · Safari → Compartir → Agregar a inicio' : 'Android · Chrome → Instalar app'}</div></div>${standalone ? '<span class="tag">INSTALADA</span>' : '<button class="btn sm" data-action="install-show">Cómo instalar</button>'}</div>
      </div></section>
      <section class="card"><h2 class="h2" style="margin-bottom:6px">Datos</h2><div class="set-list">
        <div class="set-row"><div><div class="label">Reporte CSV</div><div class="hint">Abre en Excel o Google Sheets</div></div><button class="btn sm" data-action="export-csv">${icon('download')}CSV</button></div>
        <div class="set-row"><div><div class="label">Respaldo completo</div><div class="hint">${state.tx.length} movimientos · ${kb} KB</div></div><button class="btn sm" data-action="export-json">${icon('download')}JSON</button></div>
        <div class="set-row"><div><div class="label">Restaurar respaldo</div><div class="hint">Reemplaza los datos actuales</div></div><button class="btn sm" data-action="import">${icon('upload')}Importar</button></div>
        <div class="set-row"><div><div class="label">Datos de ejemplo</div><div class="hint">Explora la app con 6 meses ficticios</div></div><button class="btn sm" data-action="demo">Cargar</button></div>
        <div class="set-row"><div><div class="label" style="color:var(--danger)">Borrar todo</div><div class="hint">No se puede deshacer</div></div><button class="btn sm danger" data-action="wipe">Borrar</button></div>
      </div></section>
    </div>
    <p class="lede" style="text-align:center;margin-top:28px;font-size:12px">DOMI · local-first · tus datos no salen de este dispositivo</p>`;
  };

  const VIEWS = { inicio: viewInicio, movimientos: viewMovimientos, presupuestos: viewPresupuestos, metas: viewMetas, ajustes: viewAjustes };

  const render = () => {
    renderNav();
    $('#view').innerHTML = (VIEWS[ui.view] || viewInicio)();
    const q = $('#q');
    if (q && ui._focusQ) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); ui._focusQ = false; }
  };

  // ---------- Sheets / formularios ----------
  const sheet = $('#sheet');
  const openSheet = html => {
    $('#sheetBody').innerHTML = `<div class="sheet-grip"></div>${html}`;
    if (!sheet.open) sheet.showModal();
  };
  const closeSheet = () => { if (sheet.open) sheet.close(); ui.draft = null; };
  sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); });
  sheet.addEventListener('close', () => { ui.draft = null; });
  const sheetHead = t => `<div class="sheet-head"><h2 class="h2" id="sheetTitle" style="font-size:20px">${t}</h2><button type="button" class="icon-btn" data-action="close" aria-label="Cerrar">${icon('x')}</button></div>`;

  const txForm = () => {
    const d = ui.draft;
    const cats = CATS[d.type];
    if (!cats.some(c => c.id === d.cat)) d.cat = cats[0].id;
    return `${sheetHead(d.id ? 'Editar movimiento' : 'Nuevo movimiento')}
    <form id="txForm" autocomplete="off">
      <div class="seg" role="group" aria-label="Tipo">
        <button type="button" data-type="expense" aria-pressed="${d.type === 'expense'}">Gasto</button>
        <button type="button" data-type="income" aria-pressed="${d.type === 'income'}">Ingreso</button>
      </div>
      <label class="amount-field"><span class="cur">${esc(curSymbol())}</span><span class="sr-only">Monto</span>
        <input name="amount" inputmode="decimal" placeholder="0" value="${d.amount ? d.amount : ''}" required></label>
      <span class="field-label">Categoría</span>
      <div class="chips">${cats.map(c => `<button type="button" class="chip" data-cat="${c.id}" aria-pressed="${d.cat === c.id}">${icon(c.icon)}${c.name}</button>`).join('')}</div>
      <div class="row2" style="margin-top:6px">
        <label><span class="field-label">Fecha</span><input class="input" type="date" name="date" value="${d.date}" required></label>
        <label><span class="field-label">Cuenta</span><select class="input" name="account">${ACCOUNTS.map(a => `<option ${a === d.account ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
      </div>
      <label><span class="field-label">Nota</span><input class="input" name="note" maxlength="60" placeholder="${d.type === 'expense' ? 'Ej. Súper de la semana' : 'Ej. Quincena'}" value="${esc(d.note || '')}"></label>
      ${d.type === 'expense' ? `
      <span class="field-label">Comprobante</span>
      <button type="button" class="receipt-drop" data-action="receipt">
        <span class="ico">${d.receipt ? `<img src="${d.receipt}" alt="">` : icon('camera')}</span>
        <span><b>${d.receipt ? 'Recibo adjunto' : 'Fotografiar recibo'}</b><small>${d.receipt ? 'Toca para reemplazar' : 'Guárdalo para garantías, facturas o reembolsos'}</small></span>
      </button>
      ${d.receipt ? `<button type="button" class="btn sm ghost" data-action="receipt-del" style="margin-top:8px">Quitar recibo</button>` : ''}
      <button type="button" class="toggle-row" role="switch" aria-checked="${!!d.reimb}" data-action="reimb-toggle"><span><b>Gasto reembolsable</b><small>Lo pagaste tú, pero lo cubre tu trabajo o alguien más</small></span>
        <span class="switch" aria-hidden="true" aria-checked="${!!d.reimb}"></span></button>
      ${d.reimb ? `<button type="button" class="toggle-row" role="switch" aria-checked="${d.reimb === 'done'}" data-action="reimb-done"><span><b>Ya me lo pagaron</b><small>Marca como reembolsado</small></span>
        <span class="switch" aria-hidden="true" aria-checked="${d.reimb === 'done'}"></span></button>` : ''}` : ''}
      <div class="sheet-actions">
        ${d.id ? `<button type="button" class="btn danger" data-action="tx-del" style="flex:0 0 auto;width:52px;padding:0" aria-label="Eliminar">${icon('trash')}</button>` : ''}
        <button type="submit" class="btn ${d.type === 'income' ? 'green' : 'primary'}">${d.id ? 'Guardar cambios' : d.type === 'income' ? 'Agregar ingreso' : 'Agregar gasto'}</button>
      </div>
    </form>`;
  };

  const syncDraft = () => {
    const f = $('#txForm'); if (!f || !ui.draft) return;
    ui.draft.amount = f.amount.value;
    ui.draft.date = f.date.value;
    ui.draft.account = f.account.value;
    ui.draft.note = f.note.value;
  };
  const redrawTx = () => { syncDraft(); const st = $('#sheetBody').scrollTop; openSheet(txForm()); $('#sheetBody').scrollTop = st; };

  const openTx = id => {
    const t = id && state.tx.find(x => x.id === id);
    const defDate = ui.month === ym(new Date()) ? today() : `${ui.month}-01`;
    ui.draft = t ? { ...t } : { type: 'expense', amount: '', cat: 'comida', date: defDate, account: 'Débito', note: '', receipt: null, reimb: null };
    openSheet(txForm());
    if (!t) setTimeout(() => $('#txForm [name=amount]')?.focus(), 60);
  };

  const budgetForm = id => {
    const cur = id ? state.budgets[id] : '';
    return `${sheetHead(id ? 'Editar límite' : 'Nuevo límite')}
    <form id="budgetForm">
      <span class="field-label">Categoría</span>
      <select class="input" name="cat" ${id ? 'disabled' : ''}>${CATS.expense.map(c => `<option value="${c.id}" ${c.id === id ? 'selected' : ''}>${c.name}${state.budgets[c.id] && c.id !== id ? ' · ya tiene límite' : ''}</option>`).join('')}</select>
      ${id ? `<input type="hidden" name="cat" value="${id}">` : ''}
      <label class="amount-field"><span class="cur">${esc(curSymbol())}</span><input name="amount" inputmode="decimal" placeholder="0" value="${cur || ''}" required aria-label="Límite mensual"></label>
      <p class="lede" style="text-align:center;margin-top:-8px">Límite mensual · se reinicia cada mes</p>
      <div class="sheet-actions">${id ? `<button type="button" class="btn danger" data-budget-del="${id}" style="flex:0 0 auto;width:52px;padding:0" aria-label="Eliminar">${icon('trash')}</button>` : ''}<button class="btn primary">Guardar límite</button></div>
    </form>`;
  };

  const goalForm = id => {
    const g = id ? state.goals.find(x => x.id === id) : { name: '', target: '', saved: 0, deadline: '' };
    return `${sheetHead(id ? 'Editar meta' : 'Nueva meta')}
    <form id="goalForm" data-id="${id || ''}">
      <label><span class="field-label">Nombre</span><input class="input" name="name" required maxlength="32" placeholder="Ej. Fondo de emergencia" value="${esc(g.name)}"></label>
      <div class="row2"><label><span class="field-label">Objetivo</span><input class="input" name="target" inputmode="decimal" required placeholder="0" value="${g.target || ''}"></label>
      <label><span class="field-label">Fecha meta</span><input class="input" type="date" name="deadline" value="${g.deadline || ''}"></label></div>
      ${id ? '' : `<label><span class="field-label">Ya tengo ahorrado</span><input class="input" name="saved" inputmode="decimal" placeholder="0"></label>`}
      <div class="sheet-actions"><button class="btn primary">Guardar meta</button></div>
    </form>`;
  };

  const contribForm = id => {
    const g = state.goals.find(x => x.id === id);
    return `${sheetHead('Abonar a ' + esc(g.name))}
    <form id="contribForm" data-id="${id}">
      <div class="seg" role="group" aria-label="Operación"><button type="button" data-op="add" aria-pressed="true">Abonar</button><button type="button" data-op="sub" aria-pressed="false">Retirar</button></div>
      <label class="amount-field"><span class="cur">${esc(curSymbol())}</span><input name="amount" inputmode="decimal" placeholder="0" required aria-label="Monto"></label>
      <p class="lede" style="text-align:center;margin-top:-8px">Llevas ${money(g.saved)} de ${money(g.target)}</p>
      <div class="sheet-actions"><button class="btn green">Confirmar</button></div>
    </form>`;
  };

  // Comprime la foto del recibo para que quepa en el almacenamiento local
  const compressImage = file => new Promise((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 900, k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      res(c.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = rej;
    img.src = url;
  });

  // ---------- Toast ----------
  let toastTimer;
  const toast = (msg, undo) => {
    const el = $('#toast');
    el.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button data-action="undo">Deshacer</button>' : ''}`;
    el.classList.add('show');
    ui._undo = undo || null;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), undo ? 5000 : 2600);
  };

  // ---------- Exportar / importar ----------
  const download = (name, content, type) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const exportCSV = () => {
    const list = ui.view === 'movimientos' && ui.type === 'reimb' ? state.tx.filter(t => t.reimb) : inMonth();
    if (!list.length) return toast('No hay movimientos para exportar en este periodo.');
    const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [['Fecha', 'Tipo', 'Categoría', 'Cuenta', 'Nota', 'Monto', 'Moneda', 'Reembolso', 'Recibo']]
      .concat(sorted(list).map(t => [t.date, t.type === 'income' ? 'Ingreso' : 'Gasto', cat(t.cat).name, t.account, t.note, (t.type === 'income' ? 1 : -1) * t.amount, state.settings.currency, t.reimb === 'done' ? 'Reembolsado' : t.reimb ? 'Pendiente' : '', t.receipt ? 'Sí' : '']));
    download(`domi-${ui.type === 'reimb' ? 'reembolsos' : ui.month}.csv`, '﻿' + rows.map(r => r.map(q).join(',')).join('\n'), 'text/csv;charset=utf-8');
    toast('Reporte exportado');
  };

  // ---------- Datos de ejemplo ----------
  const demo = () => {
    const tx = [];
    const now = new Date();
    const add = (dt, type, catId, amount, note, account = 'Débito', extra = {}) => tx.push({ id: uid(), type, cat: catId, amount, note, account, date: iso(dt), created: dt.getTime(), ...extra });
    const rnd = (a, b) => Math.round((a + Math.random() * (b - a)) * 100) / 100;
    for (let m = 5; m >= 0; m--) {
      const base = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const last = m === 0 ? now.getDate() : new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
      const D = d => new Date(base.getFullYear(), base.getMonth(), Math.min(d, last), 12);
      add(D(1), 'income', 'salario', 18500, 'Quincena');
      if (last >= 15) add(D(15), 'income', 'salario', 18500, 'Quincena');
      if (last >= 10) add(D(10), 'income', 'freelance', rnd(3500, 7000), 'Proyecto de branding', 'Transferencia');
      add(D(2), 'expense', 'hogar', 9800, 'Renta', 'Transferencia');
      add(D(3), 'expense', 'suscripciones', 219, 'Spotify', 'Crédito');
      add(D(4), 'expense', 'suscripciones', 299, 'Netflix', 'Crédito');
      if (last >= 6) add(D(6), 'expense', 'servicios', rnd(380, 520), 'Luz', 'Débito');
      if (last >= 8) add(D(8), 'expense', 'servicios', 599, 'Internet', 'Débito');
      for (let d = 1; d <= last; d++) {
        if (Math.random() < 0.55) add(D(d), 'expense', 'comida', rnd(85, 420), ['Café', 'Comida', 'Súper', 'Tacos', 'Cena'][d % 5], d % 3 ? 'Débito' : 'Efectivo');
        if (Math.random() < 0.3) add(D(d), 'expense', 'transporte', rnd(45, 260), d % 2 ? 'Uber' : 'Gasolina', 'Crédito');
        if (Math.random() < 0.08) add(D(d), 'expense', 'compras', rnd(350, 1800), ['Ropa', 'Amazon', 'Farmacia'][d % 3], 'Crédito');
        if (Math.random() < 0.06) add(D(d), 'expense', 'ocio', rnd(180, 900), ['Cine', 'Concierto', 'Bar'][d % 3], 'Crédito');
      }
      if (last >= 12) add(D(12), 'expense', 'salud', rnd(400, 900), 'Consulta', 'Débito');
      if (last >= 18) add(D(18), 'expense', 'viajes', rnd(1200, 2600), 'Comida con cliente', 'Crédito', { reimb: m === 0 ? 'pending' : 'done' });
    }
    state = { ...state, tx, budgets: { comida: 6000, transporte: 2500, compras: 2500, ocio: 1500, suscripciones: 600 },
      goals: [
        { id: uid(), name: 'Fondo de emergencia', target: 60000, saved: 38500, deadline: `${now.getFullYear() + 1}-03-01` },
        { id: uid(), name: 'Viaje a Japón', target: 45000, saved: 12800, deadline: `${now.getFullYear() + 1}-10-01` },
        { id: uid(), name: 'Laptop nueva', target: 32000, saved: 32000, deadline: '' }
      ] };
    save(); ui.month = ym(now); render(); toast('Datos de ejemplo cargados');
  };

  // ---------- Eventos ----------
  const route = () => {
    const v = location.hash.slice(1);
    if (v === 'nuevo') { history.replaceState(null, '', '#inicio'); ui.view = 'inicio'; render(); return openTx(); }
    ui.view = VIEWS[v] ? v : 'inicio';
    render();
    window.scrollTo({ top: 0 });
  };
  window.addEventListener('hashchange', route);
  window.addEventListener('scroll', () => $('#topbar').classList.toggle('scrolled', scrollY > 4), { passive: true });

  document.addEventListener('click', async e => {
    const t = e.target.closest('[data-action],[data-edit],[data-type],[data-cat],[data-filter-type],[data-budget],[data-budget-del],[data-goal-add],[data-goal-edit],[data-goal-del],[data-op]');
    if (!t) return;
    const a = t.dataset.action;

    if (t.dataset.edit) return openTx(t.dataset.edit);
    if (t.dataset.type && ui.draft) { ui.draft.type = t.dataset.type; if (t.dataset.type === 'income') { ui.draft.reimb = null; ui.draft.receipt = null; } return redrawTx(); }
    if (t.dataset.cat && ui.draft) { ui.draft.cat = t.dataset.cat; $$('.chip').forEach(c => c.setAttribute('aria-pressed', c === t)); return; }
    if (t.dataset.filterType) { ui.type = t.dataset.filterType; return render(); }
    if (t.dataset.budget) return openSheet(budgetForm(t.dataset.budget));
    if (t.dataset.budgetDel) { const id = t.dataset.budgetDel, prev = state.budgets[id]; delete state.budgets[id]; save(); closeSheet(); render(); return toast('Límite eliminado', () => { state.budgets[id] = prev; }); }
    if (t.dataset.goalAdd) return openSheet(contribForm(t.dataset.goalAdd));
    if (t.dataset.goalEdit) return openSheet(goalForm(t.dataset.goalEdit));
    if (t.dataset.goalDel) { const i = state.goals.findIndex(g => g.id === t.dataset.goalDel); const [g] = state.goals.splice(i, 1); save(); render(); return toast('Meta eliminada', () => { state.goals.splice(i, 0, g); }); }
    if (t.dataset.op) { $$('[data-op]').forEach(b => b.setAttribute('aria-pressed', b === t)); return; }

    switch (a) {
      case 'add': return openTx();
      case 'close': return closeSheet();
      case 'install':
        if (!installPrompt) return;
        installPrompt.prompt();
        try { await installPrompt.userChoice; } catch (err) { /* cancelado */ }
        installPrompt = null; return render();
      case 'install-hide': state.settings.installHidden = true; save(); return render();
      case 'install-show': state.settings.installHidden = false; save(); location.hash = 'inicio'; return render();
      case 'month': ui.month = shiftYM(ui.month, +t.dataset.dir); return render();
      case 'demo':
        if (state.tx.length && !confirm('Esto reemplazará tus datos actuales por datos de ejemplo. ¿Continuar?')) return;
        return demo();
      case 'reimb': ui.type = 'reimb'; location.hash = 'movimientos'; return;
      case 'theme':
        state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = state.settings.theme;
        $('meta[name=theme-color]').content = state.settings.theme === 'dark' ? '#050505' : '#f6f6f3';
        save(); return render();
      case 'export-csv': return exportCSV();
      case 'export-json': download(`domi-respaldo-${today()}.json`, JSON.stringify(state, null, 2), 'application/json'); return toast('Respaldo descargado');
      case 'import': return $('#importInput').click();
      case 'wipe':
        if (!confirm('¿Borrar todos tus movimientos, límites y metas? Esta acción no se puede deshacer.')) return;
        state = { ...blank(), settings: state.settings }; save(); render(); return toast('Datos borrados');
      case 'budget': return openSheet(budgetForm());
      case 'goal': return openSheet(goalForm());
      case 'receipt': syncDraft(); return $('#receiptInput').click();
      case 'receipt-del': ui.draft.receipt = null; return redrawTx();
      case 'reimb-toggle': ui.draft.reimb = ui.draft.reimb ? null : 'pending'; return redrawTx();
      case 'reimb-done': ui.draft.reimb = ui.draft.reimb === 'done' ? 'pending' : 'done'; return redrawTx();
      case 'tx-del': {
        const i = state.tx.findIndex(x => x.id === ui.draft.id);
        const [removed] = state.tx.splice(i, 1); save(); closeSheet(); render();
        return toast('Movimiento eliminado', () => { state.tx.push(removed); });
      }
      case 'undo': if (ui._undo) { ui._undo(); ui._undo = null; save(); render(); $('#toast').classList.remove('show'); } return;
    }
  });

  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-edit],[data-budget]')) { e.preventDefault(); e.target.click(); }
    if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !sheet.open && !e.target.matches('input,textarea,select')) { e.preventDefault(); openTx(); }
  });

  const fitAmount = el => { el.style.width = Math.max(1, (el.value || el.placeholder).length) + 0.6 + 'ch'; };
  new MutationObserver(() => $$('.amount-field input').forEach(fitAmount)).observe($('#sheetBody'), { childList: true });
  document.addEventListener('input', e => {
    if (e.target.matches('.amount-field input')) fitAmount(e.target);
    if (e.target.id === 'q') { ui.q = e.target.value; ui._focusQ = true; render(); }
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'catFilter') { ui.cat = e.target.value; render(); }
    if (e.target.id === 'setName') { state.settings.name = e.target.value.trim(); save(); toast('Nombre guardado'); }
    if (e.target.id === 'setCur') { state.settings.currency = e.target.value; save(); render(); toast('Moneda actualizada'); }
  });

  $('#receiptInput').addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f || !ui.draft) return;
    try { ui.draft.receipt = await compressImage(f); redrawTx(); }
    catch { toast('No se pudo leer la imagen'); }
  });

  $('#importInput').addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!Array.isArray(data.tx)) throw new Error('formato');
      if (!confirm(`Se importarán ${data.tx.length} movimientos y reemplazarán los actuales. ¿Continuar?`)) return;
      state = { ...blank(), ...data, settings: { ...blank().settings, ...data.settings } };
      document.documentElement.dataset.theme = state.settings.theme;
      save(); render(); toast('Respaldo restaurado');
    } catch { toast('Archivo no válido'); }
  });

  document.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    if (f.id === 'txForm') {
      syncDraft();
      const d = ui.draft, amount = parseAmount(d.amount);
      if (!amount) { f.amount.focus(); return toast('Escribe un monto mayor a cero'); }
      const rec = { id: d.id || uid(), type: d.type, cat: d.cat, amount, date: d.date || today(), account: d.account, note: d.note.trim(), receipt: d.type === 'expense' ? d.receipt : null, reimb: d.type === 'expense' ? d.reimb : null, created: d.created || Date.now() };
      const i = state.tx.findIndex(x => x.id === rec.id);
      const before = i >= 0 ? state.tx[i] : null;
      if (i >= 0) state.tx[i] = rec; else state.tx.push(rec);
      if (!save()) { if (before) state.tx[i] = before; else state.tx.pop(); return; }
      haptic();
      closeSheet();
      ui.month = rec.date.slice(0, 7);
      render();
      // Alerta de presupuesto
      const b = state.budgets[rec.cat];
      if (rec.type === 'expense' && b) {
        const s = sum(inMonth(rec.date.slice(0, 7)).filter(t => t.cat === rec.cat && t.type === 'expense'), t => t.amount);
        if (s >= b) return toast(`Superaste tu límite de ${cat(rec.cat).name}`);
        if (s >= b * 0.8) return toast(`Llevas ${pctFmt((s / b) * 100)} de tu límite de ${cat(rec.cat).name}`);
      }
      return toast(i >= 0 ? 'Cambios guardados' : rec.type === 'income' ? 'Ingreso agregado' : 'Gasto agregado');
    }
    if (f.id === 'budgetForm') {
      const amount = parseAmount(f.amount.value);
      if (!amount) return toast('Escribe un monto mayor a cero');
      const id = f.querySelector('input[name=cat]')?.value || f.querySelector('select[name=cat]').value;
      state.budgets[id] = amount; save(); closeSheet(); render(); return toast('Límite guardado');
    }
    if (f.id === 'goalForm') {
      const target = parseAmount(f.target.value);
      if (!target) return toast('Define un objetivo mayor a cero');
      const id = f.dataset.id;
      if (id) Object.assign(state.goals.find(g => g.id === id), { name: f.name.value.trim(), target, deadline: f.deadline.value });
      else state.goals.push({ id: uid(), name: f.name.value.trim(), target, saved: parseAmount(f.saved.value), deadline: f.deadline.value });
      save(); closeSheet(); render(); return toast('Meta guardada');
    }
    if (f.id === 'contribForm') {
      const amount = parseAmount(f.amount.value);
      if (!amount) return toast('Escribe un monto mayor a cero');
      const g = state.goals.find(x => x.id === f.dataset.id);
      const sub = $('[data-op="sub"]').getAttribute('aria-pressed') === 'true';
      const wasDone = g.saved >= g.target;
      g.saved = Math.max(0, Math.round((g.saved + (sub ? -amount : amount)) * 100) / 100);
      save(); closeSheet(); render();
      haptic(!wasDone && g.saved >= g.target ? [20, 60, 20] : 12);
      return toast(!wasDone && g.saved >= g.target ? `¡Meta cumplida: ${g.name}!` : sub ? 'Retiro registrado' : 'Abono registrado');
    }
  });

  // ---------- Arranque ----------
  route();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();

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
    check: 'M5 12.5l4.5 4.5L19 7.5',
    calendar: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4',
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
    // Servicios
    drop: 'M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z',
    flame: 'M12 22c3.9 0 7-2.8 7-6.6 0-4-2.9-6-4-9.4-1.6 1.9-2 3.6-2 5.1-1.4-.9-2.5-2.9-2.6-5.1C7.2 8 5 11.5 5 15.4 5 19.2 8.1 22 12 22z',
    wifi: 'M2 8.8a15 15 0 0 1 20 0M5.2 12.3a10 10 0 0 1 13.6 0M8.6 15.8a5 5 0 0 1 6.8 0M12 19.5h.01',
    phone: 'M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM11 18h2',
    tv: 'M3 7h18v12H3zM8 3l4 4 4-4',
    wrench: 'M14.5 4.2a5 5 0 0 0-5.3 6.9L3 17.3 6.7 21l6.2-6.2a5 5 0 0 0 6.9-5.3l-3 3-3.3-.9-.9-3.3z',
    // Suscripciones
    play: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM10 9.5v5l4.5-2.5z',
    music: 'M9 18V5.5l11-2V16M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
    dumbbell: 'M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11',
    grid: 'M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z',
    cloud: 'M7 19a4.5 4.5 0 0 1-.8-8.9A6 6 0 0 1 17.8 9 4.9 4.9 0 0 1 17.5 19z',
    gamepad: 'M7 8h10a4.5 4.5 0 0 1 4.5 4.5v.5a4 4 0 0 1-7 2.6L13.5 14h-3l-1 1.6a4 4 0 0 1-7-2.6v-.5A4.5 4.5 0 0 1 7 8zM8 10.5v4M6 12.5h4M15.5 11.5h.01M17.5 13.5h.01',
    book: 'M4 19V5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2zM20 19v2H6',
    repeat: 'M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3',
    plane: 'M2 13l20-8-6 16-4-6zM12 15l4-5',
    dots: 'M5 12h.01M12 12h.01M19 12h.01',
    code: 'M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14',
    trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
    // Patrimonio
    vault: 'M3 10h18M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18M12 3l9 5H3z',
    layers: 'M12 3 2 8l10 5 10-5zM2 13l10 5 10-5M2 18l10 5 10-5',
    shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
    refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6',
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
      { id: 'servicios', name: 'Servicios', icon: 'bolt', color: '#1f9e57', subs: [
        { id: 'luz', name: 'Luz', icon: 'bolt' },
        { id: 'agua', name: 'Agua', icon: 'drop' },
        { id: 'gas', name: 'Gas', icon: 'flame' },
        { id: 'internet', name: 'Internet', icon: 'wifi' },
        { id: 'celular', name: 'Celular', icon: 'phone' },
        { id: 'tv', name: 'TV / Cable', icon: 'tv' },
        { id: 'mantenimiento', name: 'Mantenimiento', icon: 'wrench' },
        { id: 'otro-servicio', name: 'Otro', icon: 'dots' }
      ] },
      { id: 'salud', name: 'Salud', icon: 'pulse', color: '#9a9a9e' },
      { id: 'ocio', name: 'Ocio', icon: 'ticket', color: '#a6ffcb' },
      { id: 'suscripciones', name: 'Suscripciones', icon: 'repeat', color: '#2238a8', subs: [
        { id: 'streaming', name: 'Streaming', icon: 'play' },
        { id: 'musica', name: 'Música', icon: 'music' },
        { id: 'gimnasio', name: 'Gimnasio', icon: 'dumbbell' },
        { id: 'apps', name: 'Apps', icon: 'grid' },
        { id: 'nube', name: 'Nube', icon: 'cloud' },
        { id: 'videojuegos', name: 'Videojuegos', icon: 'gamepad' },
        { id: 'otra-suscripcion', name: 'Otra', icon: 'dots' }
      ] },
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
  // Subcategoría (p. ej. Servicios → Luz). Devuelve null si la categoría no tiene o no se eligió.
  const subOf = t => { const c = cat(t.cat); return (c.subs && t.sub && c.subs.find(s => s.id === t.sub)) || null; };
  const txLabel = t => {
    if (t.type === 'invest') { const i = (state.investments || []).find(x => x.id === t.invId); return `${t.dir === 'out' ? 'Retiro' : 'Aportación'} · Patrimonio · ${i ? i.name : t.note || ''}`; }
    const s = subOf(t); return s ? `${s.name} · ${cat(t.cat).name}` : cat(t.cat).name;
  };
  const ACCOUNTS = ['Débito', 'Crédito', 'Efectivo', 'Transferencia'];
  const CURRENCIES = { MXN: 'es-MX', USD: 'en-US', EUR: 'es-ES', COP: 'es-CO', ARS: 'es-AR', CLP: 'es-CL', PEN: 'es-PE' };

  // ---------- Estado ----------
  const STORE = 'domi.v1';
  const LEGACY_STORE = 'fosforo.v1';
  const blank = () => ({ tx: [], budgets: {}, goals: [], investments: [], settings: { currency: 'MXN', theme: 'dark', name: '' } });

  // Tipos de inversión (paleta restringida de la marca)
  const INV_TYPES = [
    { id: 'cetes', name: 'CETES', icon: 'vault', color: '#3bff8a' },
    { id: 'fondos', name: 'Fondos', icon: 'layers', color: '#3d6bff' },
    { id: 'acciones', name: 'Acciones / ETF', icon: 'trend', color: 'var(--cat-ink)' },
    { id: 'afore', name: 'AFORE / Retiro', icon: 'shield', color: '#8aa5ff' },
    { id: 'cripto', name: 'Cripto', icon: 'coin', color: '#5b5b60' },
    { id: 'inmuebles', name: 'Bienes raíces', icon: 'house', color: '#a6ffcb' },
    { id: 'otra-inv', name: 'Otra', icon: 'dots', color: '#3a3a3e' }
  ];
  const invType = id => INV_TYPES.find(t => t.id === id) || INV_TYPES.at(-1);
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

  const ui = { view: 'inicio', month: ym(new Date()), q: '', type: 'all', cat: 'all', draft: null, pat: 'metas' };

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
  const shortDate = d => { const [Y, M, D] = d.split('-').map(Number); return `${D} ${MONTHS[M - 1].slice(0, 3)}${Y !== new Date().getFullYear() ? ' ' + Y : ''}`; };
  // Fecha relativa breve: hoy, ayer, hace N días, o «20 nov»
  const ago = d => {
    const [Y, M, D] = d.split('-').map(Number), then = new Date(Y, M - 1, D), now = new Date(); now.setHours(0, 0, 0, 0);
    const n = Math.round((now - then) / 86400000);
    if (n <= 0) return 'hoy'; if (n === 1) return 'ayer'; if (n < 30) return `hace ${n} días`;
    return then.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '');
  };

  // ---------- Selectores de datos ----------
  const inMonth = (m = ui.month) => state.tx.filter(t => t.date.startsWith(m));
  // Signo de cada movimiento sobre tu dinero disponible.
  // Aportar a una inversión resta del balance, pero NO es gasto; retirar lo regresa.
  const signed = t => t.type === 'income' ? t.amount : t.type === 'invest' ? (t.dir === 'out' ? t.amount : -t.amount) : -t.amount;
  const totals = list => {
    const inc = sum(list.filter(t => t.type === 'income'), t => t.amount);
    const exp = sum(list.filter(t => t.type === 'expense'), t => t.amount);
    const inv = sum(list.filter(t => t.type === 'invest'), t => t.dir === 'out' ? -t.amount : t.amount);
    return { inc, exp, inv, bal: inc - exp - inv };
  };
  // Patrimonio
  const invStats = () => {
    const list = state.investments || [];
    const value = sum(list, i => i.value), contributed = sum(list, i => i.contributed);
    const gain = value - contributed;
    return { list, value, contributed, gain, pct: contributed ? (gain / contributed) * 100 : 0 };
  };
  const goalsSaved = () => sum(state.goals, g => g.saved);
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
    { id: 'patrimonio', label: 'Patrimonio', icon: 'vault' },
    { id: 'ajustes', label: 'Ajustes', icon: 'gear' }
  ];

  const renderNav = () => {
    const side = $('#sideNav');
    if (side) side.innerHTML = NAV.map(n => `<a class="side-link" href="#${n.id}" ${ui.view === n.id ? 'aria-current="page"' : ''}>${icon(n.icon)}${n.label}</a>`).join('');
    const tab = n => `<a class="tab" href="#${n.id}" ${ui.view === n.id ? 'aria-current="page"' : ''}>${icon(n.icon)}<span>${n.label === 'Movimientos' ? 'Historial' : n.label === 'Presupuestos' ? 'Límites' : n.label}</span></a>`;
    $('#tabbar').innerHTML = tab(NAV[0]) + tab(NAV[1]) + `<button class="fab" data-action="add" aria-label="Nuevo movimiento">${icon('plus', 2.4)}</button>` + tab(NAV[2]) + tab(NAV[3]);
    $('#monthLabel').textContent = monthName(ui.month);
    $('#monthSwitch').style.visibility = ['patrimonio', 'ajustes'].includes(ui.view) ? 'hidden' : 'visible';
    const gear = $('#topGear');
    if (gear) { if (ui.view === 'ajustes') gear.setAttribute('aria-current', 'page'); else gear.removeAttribute('aria-current'); }
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

  const donut = (data, size = 140, label = "GASTO TOTAL") => {
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
    return `<svg width="${size}" height="${size}" viewBox="0 0 140 140" role="img" aria-label="${label === "GASTO TOTAL" ? "Gastos por categoría" : "Distribución de inversiones"}"><circle r="${r}" cx="70" cy="70" fill="none" stroke="var(--surface-3)" stroke-width="${sw}"/>${segs}
      <text x="70" y="66" text-anchor="middle" style="font-family:var(--font-mono);font-size:8.5px;letter-spacing:.08em;fill:var(--muted)">${label}</text>
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
    if (t.type === 'invest') {
      const inv = state.investments.find(x => x.id === t.invId);
      const name = inv ? inv.name : (t.note || 'Inversión');
      return `<li class="tx" data-edit="${t.id}" tabindex="0" role="button" aria-label="${esc(name)}">
        <div class="tx-ico invest">${icon(inv ? invType(inv.type).icon : 'trend')}</div>
        <div class="tx-main"><div class="tx-title">${esc(name)}</div><div class="tx-meta"><span>${t.dir === 'out' ? 'Retiro' : 'Aportación'} · Patrimonio · ${esc(t.account)}</span></div></div>
        <div class="tx-amt num invest">${t.dir === 'out' ? '+' : '→ '}${money(t.amount)}</div>
      </li>`;
    }
    const c = cat(t.cat), s = subOf(t);
    const title = t.note || (s ? s.name : c.name);
    const flags = (t.receipt ? icon('receipt') : '');
    const status = t.reimb ? `<span class="status ${t.reimb === 'done' ? 'done' : ''}">${t.reimb === 'done' ? 'Reembolsado' : 'Por reembolsar'}</span>` : '';
    return `<li class="tx" data-edit="${t.id}" tabindex="0" role="button" aria-label="Editar ${esc(title)}">
      <div class="tx-ico ${t.type}">${icon(s ? s.icon : c.icon)}</div>
      <div class="tx-main">
        <div class="tx-title">${esc(title)}${flags ? `<span class="tx-flags">${flags}</span>` : ''}</div>
        <div class="tx-meta"><span>${esc(txLabel(t))} · ${esc(t.account)}</span>${status}</div>
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
  // App nativa: Electron (Mac / Windows) o Capacitor (Android)
  const isElectron = /Electron/.test(navigator.userAgent);
  const isCapacitor = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  const isNative = isElectron || isCapacitor;
  if (isNative) document.documentElement.classList.add('app-native');
  if (isElectron && /Macintosh/.test(navigator.userAgent)) document.documentElement.classList.add('app-mac');
  const DOWNLOAD_URL = 'https://aloshkagarcia-designer.github.io/DOMI-/';
  const standalone = isNative || window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
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
      title = 'Descarga DOMI';
      text = 'App para Mac, Windows y Android, o instálala en tu iPhone.';
      act = `<a class="btn green sm" href="${DOWNLOAD_URL}" target="_blank" rel="noopener">Descargar</a>`;
    }
    return `<div class="install" role="note"><div class="ico"><img src="icons/icon-192.png" alt=""></div><div><b>${title}</b><p>${text}</p></div>
      <div class="acts">${act}<button class="icon-btn" data-action="install-hide" aria-label="Ocultar aviso">${icon('x')}</button></div></div>`;
  };

  const haptic = (p = 12) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* iOS no soporta vibración web */ } };

  const viewInicio = () => {
    const list = inMonth();
    const { inc, exp, inv, bal } = totals(list);
    if (!state.tx.length) {
      return `<div class="page-head"><div><div class="eyebrow">${greeting()}</div><h1 class="h1">Tu dinero.<br><span>Bajo tu dominio.</span></h1></div></div>
      ${installBanner()}${emptyState('Empieza con tu primer movimiento', 'Registra un gasto o ingreso y DOMI construye tus gráficas, presupuestos e insights en automático.', '<button class="btn" data-action="stmt">Importar estado de cuenta</button><button class="btn ghost" data-action="demo">Ver con datos de ejemplo</button>')}`;
    }
    const prev = totals(inMonth(shiftYM(ui.month, -1)));
    const savingRate = inc ? ((inc - exp) / inc) * 100 : 0;  // invertir también es ahorrar
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
        <div class="hero-sub">${inc ? `Ahorras <b class="pos">${pctFmt(Math.max(savingRate, 0))}</b> de lo que ganas este mes${inv > 0 ? ` · <b>${money(inv, { compact: true })}</b> invertidos` : ''}.` : 'Registra tus ingresos para medir tu tasa de ahorro.'}</div>
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

  // ---------- Calendario de gastos ----------
  const kfmt = n => {
    const s = curSymbol();
    if (n >= 1e6) return `${s}${(n / 1e6).toFixed(1).replace('.0', '')}M`;
    if (n >= 1000) return `${s}${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '')}k`;
    return `${s}${Math.round(n)}`;
  };
  const calendarBlock = () => {
    const m = ui.month, n = daysIn(m), list = inMonth(m);
    const exp = Array(n + 1).fill(0), inc = Array(n + 1).fill(0), count = Array(n + 1).fill(0);
    list.forEach(t => { const d = +t.date.slice(8); count[d]++; if (t.type === 'expense') exp[d] += t.amount; if (t.type === 'income') inc[d] += t.amount; });
    const isCur = m === ym(new Date()), td = new Date().getDate();
    const elapsed = isCur ? td : n;
    // Intensidad por cuartiles: un gasto extremo (p. ej. la renta) no apaga el resto del mes
    const qs = exp.slice(1).filter(Boolean).sort((a, b) => a - b);
    const q = p => qs.length ? qs[Math.min(qs.length - 1, Math.floor(p * qs.length))] : 0;
    const [q1, q2, q3] = [q(0.25), q(0.5), q(0.75)];
    let topDay = 0; for (let d = 1; d <= n; d++) if (exp[d] > exp[topDay]) topDay = d;
    const zero = Array.from({ length: elapsed }, (_, i) => i + 1).filter(d => !exp[d]).length;
    const total = sum(exp);
    // Día seleccionado: el que tocaste, o hoy si estás en el mes actual
    let sel = ui.calDay && ui.calDay.startsWith(m) ? +ui.calDay.slice(8) : (isCur ? td : null);
    const first = (parseYM(m).getDay() + 6) % 7;   // semana inicia en lunes
    const cells = [];
    for (let i = 0; i < first; i++) cells.push('<div class="cal-cell blank" aria-hidden="true"></div>');
    for (let d = 1; d <= n; d++) {
      const future = isCur && d > td, v = exp[d];
      const lvl = !v ? 0 : v < q1 ? 1 : v < q2 ? 2 : v < q3 ? 3 : 4;
      const date = `${m}-${pad(d)}`;
      cells.push(`<button type="button" class="cal-cell l${lvl}${future ? ' future' : ''}${isCur && d === td ? ' today' : ''}${sel === d ? ' sel' : ''}" data-day="${date}" aria-label="${d}: ${exp[d] ? 'gastaste ' + money(exp[d]) : 'sin gastos'}${inc[d] ? ', ingreso ' + money(inc[d]) : ''}" aria-pressed="${sel === d}">
        <span class="cal-d">${d}</span>${exp[d] ? `<span class="cal-amt num">${kfmt(exp[d])}</span>` : future || !count[d] ? '' : '<span class="cal-amt zero">—</span>'}${inc[d] ? '<i class="cal-inc" aria-hidden="true"></i>' : ''}
      </button>`);
    }
    const selDate = sel ? `${m}-${pad(sel)}` : null;
    const items = selDate ? sorted(list.filter(t => t.date === selDate)) : [];
    const selNet = sum(items, signed);
    const detail = !selDate ? '<p class="lede cal-hint">Toca un día para ver sus movimientos.</p>'
      : `<div class="day-head cal-day-head"><span class="eyebrow">${esc(dayLabel(selDate))}</span>${items.length ? `<span class="num">${selNet >= 0 ? '+' : '−'}${money(Math.abs(selNet))}</span>` : ''}</div>
        ${items.length ? `<ul class="tx-list">${items.map(txRow).join('')}</ul>` : `<div class="cal-empty">${isCur && sel > td ? 'Este día aún no llega.' : `<b>Día sin gastos.</b> Bien hecho.`}</div>`}`;
    return `<div class="summary-row">
      <div class="card"><div class="eyebrow">Día más caro</div><strong class="num">${topDay ? kfmt(exp[topDay]) : '—'}</strong><small class="cal-sub">${topDay ? `${topDay} ${monthShort(m)}` : 'Sin gastos'}</small></div>
      <div class="card"><div class="eyebrow">Sin gastar</div><strong class="num pos">${zero}</strong><small class="cal-sub">de ${elapsed} días</small></div>
      <div class="card"><div class="eyebrow">Promedio</div><strong class="num">${kfmt(total / elapsed)}</strong><small class="cal-sub">por día</small></div>
    </div>
    <div class="grid cal-grid-wrap">
      <section class="card cal-card" aria-label="Calendario de ${esc(monthName(m))}">
        <div class="cal-week" aria-hidden="true">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(x => `<span>${x}</span>`).join('')}</div>
        <div class="cal-grid">${cells.join('')}</div>
        <div class="cal-legend"><span>Menos</span>${[0, 1, 2, 3, 4].map(l => `<i class="cal-sw l${l}"></i>`).join('')}<span>Más</span><span class="cal-legend-inc"><i class="cal-inc"></i>Ingreso</span></div>
      </section>
      <section class="card cal-detail">${detail}</section>
    </div>`;
  };

  const viewMovimientos = () => {
    let list = inMonth();
    const q = ui.q.trim().toLowerCase();
    if (ui.type === 'reimb') list = state.tx.filter(t => t.reimb);
    else if (ui.type !== 'all') list = list.filter(t => t.type === ui.type);
    if (ui.cat !== 'all') list = list.filter(t => t.cat === ui.cat);
    if (q) list = list.filter(t => (t.note + ' ' + txLabel(t) + ' ' + t.account).toLowerCase().includes(q));
    const { inc, exp, bal } = totals(list);
    const groups = {};
    sorted(list).forEach(t => (groups[t.date] = groups[t.date] || []).push(t));
    const pill = (v, l) => `<button class="pill" data-filter-type="${v}" aria-pressed="${ui.type === v}">${l}</button>`;

    const cal = ui.hview === 'cal';
    const head = `<div class="page-head"><div><div class="eyebrow">${ui.type === 'reimb' && !cal ? 'Todos los meses' : esc(monthName(ui.month))}</div><h1 class="h1">Movimientos<span>.</span></h1></div>
      <div class="head-actions"><button class="btn sm" data-action="stmt">${icon('upload')}Importar</button><button class="btn sm" data-action="export-csv">${icon('download')}Exportar</button></div></div>
    <div class="seg hview" role="tablist" aria-label="Vista">
      <button type="button" role="tab" data-hview="list" aria-pressed="${!cal}" aria-selected="${!cal}">${icon('list')}Lista</button>
      <button type="button" role="tab" data-hview="cal" aria-pressed="${cal}" aria-selected="${cal}">${icon('calendar')}Calendario</button>
    </div>`;
    if (cal) return head + calendarBlock();

    return `${head}
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
      const net = sum(items, signed);
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
        // Desglose por subcategoría (p. ej. Servicios: Luz, Agua, Internet…)
        let breakdown = '';
        if (c.subs) {
          const by = {};
          list.filter(t => t.type === 'expense' && t.cat === id).forEach(t => { const k = subOf(t)?.name || 'Sin especificar'; by[k] = (by[k] || 0) + t.amount; });
          const parts = Object.entries(by).sort((x, y) => y[1] - x[1]);
          if (parts.length) breakdown = `<div class="sub-break">${parts.map(([n, v]) => `<span>${esc(n)} <b class="num">${money(v, { compact: true })}</b></span>`).join('')}</div>`;
        }
        return `<div class="budget" data-budget="${id}" role="button" tabindex="0">
          <div class="budget-top"><div class="tx-ico">${icon(c.icon)}</div><div><div class="tx-title">${esc(c.name)}</div><div class="tx-meta num">${money(s, { compact: true })} de ${money(b, { compact: true })}</div></div>
          <span class="tag ${l}">${l === 'over' ? 'EXCEDIDO' : l === 'warn' ? pctFmt(p) : pctFmt(p)}</span></div>
          <div class="bar ${l}"><i style="width:${Math.min(p, 100)}%"></i></div>
          <div class="budget-foot"><span>${s > b ? `Te pasaste ${money(s - b, { compact: true })}` : `Quedan ${money(b - s, { compact: true })}`}</span><span>${ui.month === ym(new Date()) ? `${daysIn(ui.month) - new Date().getDate()} días restantes` : ''}</span></div>
          ${breakdown}
        </div>`;
      }).join('')}</section></div>`
    : `<div class="card empty"><div class="glyph">${icon('pie')}</div><h3>Sin límites definidos</h3><p>Ponle tope a tus categorías más caras y mantén el control sin pensar.</p><div class="actions"><button class="btn green" data-action="budget">${icon('plus', 2.2)}Crear primer límite</button></div></div>`}`;
  };

  // ---------- Patrimonio (Metas + Inversiones) ----------
  const monthsUntil = date => {
    const d = new Date(date + 'T12:00'), n = new Date();
    return Math.max(1, (d.getFullYear() - n.getFullYear()) * 12 + (d.getMonth() - n.getMonth()));
  };
  const pctSigned = n => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(1)}%`;

  const goalsBlock = () => {
    const g = state.goals;
    if (!g.length) return `<div class="card empty"><div class="glyph">${icon('target')}</div><h3>Tu primera meta</h3><p>Un viaje, un fondo de emergencia, una laptop. Define el monto y abona a tu ritmo.</p><div class="actions"><button class="btn green" data-action="goal">${icon('plus', 2.2)}Crear meta</button></div></div>`;
    return `<div class="goals">${g.map(x => {
      const p = x.target ? (x.saved / x.target) * 100 : 0;
      const done = p >= 100;
      const left = x.target - x.saved;
      const pace = !done && x.deadline ? `≈ ${money(left / monthsUntil(x.deadline), { compact: true })} al mes` : '';
      return `<article class="card goal ${done ? 'done' : ''}">
        <div class="goal-top"><div><div class="eyebrow">${done ? 'Meta cumplida' : x.deadline ? 'Para ' + new Date(x.deadline + 'T12:00').toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }) : 'Sin fecha'}</div><div class="goal-name">${esc(x.name)}</div></div>
          <button class="icon-btn" data-goal-del="${x.id}" aria-label="Eliminar meta">${icon('trash')}</button></div>
        <div class="goal-amt num">${money(x.saved, { compact: true })} <span>/ ${money(x.target, { compact: true })}</span></div>
        <div class="bar"><i style="width:${Math.min(p, 100)}%"></i></div>
        <div class="budget-foot"><span>${done ? '100% completado' : 'Faltan ' + money(left, { compact: true })}</span><span>${pace || pctFmt(p)}</span></div>
        <div class="goal-actions"><button class="btn sm ${done ? '' : 'primary'}" data-goal-add="${x.id}">${icon('plus', 2.2)}Abonar</button><button class="btn sm ghost" data-goal-edit="${x.id}">Editar</button></div>
      </article>`;
    }).join('')}</div>`;
  };

  // Valor total de las inversiones al cierre de cada mes, a partir del historial de valores
  const invSeries = (n = 6) => {
    const months = Array.from({ length: n }, (_, i) => shiftYM(ym(new Date()), i - n + 1));
    return months.map(m => {
      const end = `${m}-31`;
      return { m, v: sum(state.investments, inv => { const h = (inv.history || []).filter(x => x.date <= end); return h.length ? h.at(-1).value : 0; }) };
    });
  };
  const invChart = () => {
    const s = invSeries();
    if (s.filter(x => x.v > 0).length < 2) return '';
    const W = 300, H = 120, top = 10, base = H - 22, max = Math.max(...s.map(x => x.v)), min = Math.min(...s.filter(x => x.v > 0).map(x => x.v)) * 0.9;
    const X = i => 12 + i * ((W - 24) / (s.length - 1));
    const Y = v => v ? base - ((v - min) / Math.max(max - min, 1)) * (base - top) : base;
    const pts = s.map((x, i) => `${X(i)},${Y(x.v)}`);
    return `<section class="card inv-evo"><div class="card-head"><h2 class="h2">Evolución</h2><span class="eyebrow">6 meses</span></div>
      <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Valor de tus inversiones en los últimos 6 meses">
        <defs><linearGradient id="evoFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--green)" stop-opacity=".28"/><stop offset="1" stop-color="var(--green)" stop-opacity="0"/></linearGradient></defs>
        <path d="M${pts.join('L')}L${X(s.length - 1)},${base}L${X(0)},${base}Z" fill="url(#evoFill)"/>
        <path d="M${pts.join('L')}" fill="none" stroke="var(--green)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
        ${s.map((x, i) => `<circle cx="${X(i)}" cy="${Y(x.v)}" r="${i === s.length - 1 ? 4 : 2.5}" fill="${i === s.length - 1 ? 'var(--green)' : 'var(--surface)'}" stroke="var(--green)" stroke-width="1.5"><title>${monthName(x.m)}: ${money(x.v)}</title></circle>`).join('')}
        ${s.map((x, i) => `<text x="${X(i)}" y="${H - 4}" text-anchor="middle" style="${i === s.length - 1 ? 'fill:var(--text);font-weight:600' : ''}">${monthShort(x.m).toUpperCase()}</text>`).join('')}
      </svg></section>`;
  };

  const investBlock = () => {
    const { list, value } = invStats();
    if (!list.length) return `<div class="card empty"><div class="glyph">${icon('trend')}</div><h3>Registra tu primera inversión</h3><p>CETES, fondos, acciones, AFORE o cripto. Anota cuánto pusiste y actualiza su valor cuando quieras.</p><div class="actions"><button class="btn green" data-action="inv-new">${icon('plus', 2.2)}Agregar inversión</button></div></div>`;
    const byType = {};
    list.forEach(i => { byType[i.type] = (byType[i.type] || 0) + i.value; });
    const dist = Object.entries(byType).map(([id, v]) => ({ ...invType(id), value: v })).sort((a, b) => b.value - a.value);
    const rows = [...list].sort((a, b) => b.value - a.value).map(i => {
      const t = invType(i.type), g = i.value - i.contributed, p = i.contributed ? (g / i.contributed) * 100 : 0;
      const upd = i.history && i.history.length ? i.history.at(-1).date : null;  // fecha del último valor registrado
      return `<li class="tx" data-inv="${i.id}" tabindex="0" role="button" aria-label="${esc(i.name)}">
        <div class="tx-ico">${icon(t.icon)}</div>
        <div class="tx-main"><div class="tx-title">${esc(i.name)}</div><div class="tx-meta"><span>${esc(t.name)}${upd ? ' · ' + esc(ago(upd)) : ''}</span></div></div>
        <div class="inv-val"><div class="tx-amt num">${money(i.value, { compact: true })}</div><div class="num inv-pct ${g < 0 ? 'neg' : ''}">${pctSigned(p)}</div></div>
      </li>`;
    }).join('');
    return `<div class="grid inv-grid">
      <section class="card"><div class="card-head"><h2 class="h2">Distribución</h2><span class="eyebrow">${list.length} ${list.length === 1 ? 'posición' : 'posiciones'}</span></div>
        <div class="donut-wrap inv-donut">${donut(dist, 120, 'INVERTIDO')}<ul class="legend">${dist.map(d => `<li><i class="sw" style="background:${d.color}"></i><span>${esc(d.name)}</span><span class="pct">${pctFmt((d.value / value) * 100)}</span><span class="amt num">${money(d.value, { compact: true })}</span></li>`).join('')}</ul></div></section>
      ${invChart()}
      <section class="card span-2"><div class="card-head"><h2 class="h2">Posiciones</h2><button class="link" data-action="inv-new">${icon('plus', 2.2)}Agregar</button></div>
        <ul class="tx-list">${rows}</ul>
        <p class="inv-note">Toca una posición para aportar, retirar o actualizar su valor.</p></section>
    </div>`;
  };

  const viewPatrimonio = () => {
    const st = invStats(), saved = goalsSaved(), total = saved + st.value;
    const { int, cents } = moneySplit(total);
    const tab = ui.pat === 'inversiones' ? 'inversiones' : 'metas';
    const empty = !state.goals.length && !st.list.length;
    return `<div class="page-head"><div><div class="eyebrow">Ahorro e inversión</div><h1 class="h1">Patrimonio<span>.</span></h1></div>
      <button class="btn green sm" data-action="${tab === 'metas' ? 'goal' : 'inv-new'}">${icon('plus', 2.2)}${tab === 'metas' ? 'Nueva meta' : 'Nueva inversión'}</button></div>
    <div class="grid pat-top">
      <section class="hero" aria-label="Patrimonio total">
        <div class="eyebrow">Patrimonio total</div>
        <div class="hero-amount num">${esc(int)}<span class="cents">${esc(cents)}</span></div>
        <div class="hero-sub">${empty ? 'Suma lo que tienes en metas e inversiones.' : st.list.length ? `Tus inversiones ${st.gain >= 0 ? 'han generado' : 'van'} <b class="${st.gain >= 0 ? 'pos' : ''}">${st.gain >= 0 ? '+' : '−'}${money(Math.abs(st.gain), { compact: true })}</b> · <b class="${st.gain >= 0 ? 'pos' : ''}">${pctSigned(st.pct)}</b>` : `Ahorrado en ${state.goals.length} ${state.goals.length === 1 ? 'meta' : 'metas'}.`}</div>
        <div class="hero-stats">
          <div class="hero-stat"><div class="eyebrow"><i class="dot w"></i>Metas</div><strong class="num">${money(saved, { compact: true })}</strong></div>
          <div class="hero-stat"><div class="eyebrow"><i class="dot b"></i>Invertido</div><strong class="num">${money(st.value, { compact: true })}</strong></div>
          <div class="hero-stat"><div class="eyebrow"><i class="dot g"></i>Rendim.</div><strong class="num ${st.gain >= 0 ? 'pos' : ''}">${st.list.length ? pctSigned(st.pct) : '—'}</strong></div>
        </div>
      </section>
    </div>
    <div class="seg pat-seg" role="tablist" aria-label="Sección">
      <button type="button" role="tab" data-pat="metas" aria-pressed="${tab === 'metas'}" aria-selected="${tab === 'metas'}">Metas</button>
      <button type="button" role="tab" data-pat="inversiones" aria-pressed="${tab === 'inversiones'}" aria-selected="${tab === 'inversiones'}">Inversiones</button>
    </div>
    ${tab === 'metas' ? goalsBlock() : investBlock()}`;
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
        <div class="set-row"><div><div class="label">App DOMI</div><div class="hint">${standalone ? 'Instalada en este dispositivo' : platform === 'ios' ? 'iPhone · Safari → Compartir → Agregar a inicio' : platform === 'android' ? 'Android · descarga la app o instálala desde Chrome' : 'Disponible para Mac, Windows, Android e iPhone'}</div></div>${standalone ? '<span class="tag">INSTALADA</span>' : '<button class="btn sm" data-action="install-show">Cómo instalar</button>'}</div>
      </div></section>
      <section class="card"><h2 class="h2" style="margin-bottom:6px">Datos</h2><div class="set-list">
        <div class="set-row"><div><div class="label">Reporte CSV</div><div class="hint">Abre en Excel o Google Sheets</div></div><button class="btn sm" data-action="export-csv">${icon('download')}CSV</button></div>
        <div class="set-row"><div><div class="label">Respaldo completo</div><div class="hint">${state.tx.length} movimientos · ${kb} KB</div></div><button class="btn sm" data-action="export-json">${icon('download')}JSON</button></div>
        <div class="set-row"><div><div class="label">Estado de cuenta</div><div class="hint">Importa el CSV de tu banco</div></div><button class="btn sm" data-action="stmt">${icon('upload')}Importar</button></div>
        <div class="set-row"><div><div class="label">Restaurar respaldo</div><div class="hint">Reemplaza los datos actuales</div></div><button class="btn sm" data-action="import">${icon('upload')}Importar</button></div>
        <div class="set-row"><div><div class="label">Datos de ejemplo</div><div class="hint">Explora la app con 6 meses ficticios</div></div><button class="btn sm" data-action="demo">Cargar</button></div>
        <div class="set-row"><div><div class="label" style="color:var(--danger)">Borrar todo</div><div class="hint">No se puede deshacer</div></div><button class="btn sm danger" data-action="wipe">Borrar</button></div>
      </div></section>
    </div>
    <p class="lede" style="text-align:center;margin-top:28px;font-size:12px">DOMI · local-first · tus datos no salen de este dispositivo</p>`;
  };

  const VIEWS = { inicio: viewInicio, movimientos: viewMovimientos, presupuestos: viewPresupuestos, patrimonio: viewPatrimonio, ajustes: viewAjustes };

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
  const closeSheet = () => { if (sheet.open) sheet.close(); ui.draft = null; ui.imp = null; };
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
      ${cat(d.cat).subs ? `<div class="subcats" role="group" aria-label="Tipo de ${esc(cat(d.cat).name.toLowerCase())}">
        <span class="field-label">¿Qué ${{ servicios: 'servicio', suscripciones: 'suscripción' }[d.cat] || 'tipo'}?</span>
        <div class="sub-chips">${cat(d.cat).subs.map(s => `<button type="button" class="sub-chip" data-sub="${s.id}" aria-pressed="${d.sub === s.id}">${icon(s.icon)}${s.name}</button>`).join('')}</div>
      </div>` : ''}
      <div class="row2" style="margin-top:6px">
        <label><span class="field-label">Fecha</span><input class="input" type="date" name="date" value="${d.date}" required></label>
        <label><span class="field-label">Cuenta</span><select class="input" name="account">${ACCOUNTS.map(a => `<option ${a === d.account ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
      </div>
      <label><span class="field-label">Nota</span><input class="input" name="note" maxlength="60" placeholder="${d.type === 'income' ? 'Ej. Quincena' : d.cat === 'suscripciones' ? 'Ej. Netflix, Spotify, Smart Fit' : d.cat === 'servicios' ? 'Ej. Recibo CFE bimestral' : 'Ej. Súper de la semana'}" value="${esc(d.note || '')}"></label>
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
    if (t && t.type === 'invest') return openSheet(invTxSheet(t));
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

  // ---------- Inversiones: formularios ----------
  const invForm = id => {
    const i = id ? state.investments.find(x => x.id === id) : { name: '', type: ui.invType || 'cetes', contributed: '', value: '' };
    const type = ui.invType || i.type;
    return `${sheetHead(id ? 'Editar inversión' : 'Nueva inversión')}
    <form id="invForm" data-id="${id || ''}" autocomplete="off">
      <label><span class="field-label">Nombre</span><input class="input" name="name" required maxlength="40" placeholder="Ej. CETES 28 días, Fondo GBM+, VOO" value="${esc(i.name)}"></label>
      <span class="field-label">Tipo</span>
      <div class="sub-chips">${INV_TYPES.map(t => `<button type="button" class="sub-chip" data-invtype="${t.id}" aria-pressed="${type === t.id}">${icon(t.icon)}${t.name}</button>`).join('')}</div>
      ${id ? '' : `<div class="row2" style="margin-top:6px">
        <label><span class="field-label">Lo que has puesto</span><input class="input" name="contributed" inputmode="decimal" required placeholder="0"></label>
        <label><span class="field-label">Vale hoy</span><input class="input" name="value" inputmode="decimal" placeholder="Igual"></label>
      </div>
      <button type="button" class="toggle-row" role="switch" aria-checked="${!!ui.invDeduct}" data-action="inv-deduct"><span><b>Sale de mi balance de este mes</b><small>Actívalo si acabas de invertir este dinero. Déjalo apagado si ya lo tenías invertido.</small></span>
        <span class="switch" aria-hidden="true" aria-checked="${!!ui.invDeduct}"></span></button>`}
      <div class="sheet-actions">
        ${id ? `<button type="button" class="btn danger" data-action="inv-del" data-id="${id}" style="flex:0 0 auto;width:52px;padding:0" aria-label="Eliminar inversión">${icon('trash')}</button>` : ''}
        <button class="btn primary">${id ? 'Guardar cambios' : 'Agregar inversión'}</button>
      </div>
    </form>`;
  };

  const invSheet = id => {
    const i = state.investments.find(x => x.id === id);
    const op = ui.invOp || 'add';
    const t = invType(i.type), g = i.value - i.contributed, p = i.contributed ? (g / i.contributed) * 100 : 0;
    const notes = {
      add: ['No cuenta como gasto', 'El dinero sale de tu balance y entra a tu patrimonio. Tu tasa de ahorro sube.'],
      sub: ['Regresa a tu balance', 'El dinero vuelve a estar disponible para gastar este mes.'],
      set: ['Solo actualiza el valor', 'No mueve dinero; registra cuánto vale hoy para medir el rendimiento.']
    };
    return `<div class="sheet-head"><div><h2 class="h2" id="sheetTitle" style="font-size:20px">${esc(i.name)}</h2><div class="tx-meta" style="margin-top:2px">${esc(t.name)}</div></div><button type="button" class="icon-btn" data-action="close" aria-label="Cerrar">${icon('x')}</button></div>
    <div class="inv-stats">
      <div><span class="eyebrow">Aportado</span><b class="num">${money(i.contributed, { compact: true })}</b></div>
      <div><span class="eyebrow">Vale hoy</span><b class="num">${money(i.value, { compact: true })}</b></div>
      <div><span class="eyebrow">Rendimiento</span><b class="num inv-pct ${g < 0 ? 'neg' : ''}">${pctSigned(p)}</b></div>
    </div>
    <form id="invMoveForm" data-id="${id}" autocomplete="off">
      <div class="seg seg3" role="group" aria-label="Operación">
        <button type="button" data-invop="add" aria-pressed="${op === 'add'}">Aportar</button>
        <button type="button" data-invop="sub" aria-pressed="${op === 'sub'}">Retirar</button>
        <button type="button" data-invop="set" aria-pressed="${op === 'set'}">Actualizar valor</button>
      </div>
      <label class="amount-field"><span class="cur">${esc(curSymbol())}</span><span class="sr-only">Monto</span><input name="amount" inputmode="decimal" placeholder="${op === 'set' ? String(Math.round(i.value)) : '0'}" required></label>
      <div class="row2">
        ${op === 'set' ? '' : `<label><span class="field-label">${op === 'add' ? 'Desde' : 'Hacia'}</span><select class="input" name="account">${ACCOUNTS.map(a => `<option>${a}</option>`).join('')}</select></label>`}
        <label ${op === 'set' ? 'style="grid-column:1/-1"' : ''}><span class="field-label">Fecha</span><input class="input" type="date" name="date" value="${today()}" required></label>
      </div>
      <div class="toggle-row note-row"><span><b>${notes[op][0]}</b><small>${notes[op][1]}</small></span></div>
      <div class="sheet-actions">
        <button type="button" class="btn ghost" data-action="inv-edit" data-id="${id}" style="flex:0 0 auto">Editar</button>
        <button class="btn ${op === 'set' ? 'primary' : 'green'}">${op === 'add' ? 'Aportar' : op === 'sub' ? 'Retirar' : 'Guardar valor'}</button>
      </div>
    </form>`;
  };

  // Movimiento de inversión tocado desde el historial
  const invTxSheet = t => {
    const i = state.investments.find(x => x.id === t.invId);
    return `${sheetHead(t.dir === 'out' ? 'Retiro de inversión' : 'Aportación a inversión')}
    <div class="inv-stats" style="grid-template-columns:1fr 1fr">
      <div><span class="eyebrow">Monto</span><b class="num">${money(t.amount)}</b></div>
      <div><span class="eyebrow">Fecha</span><b>${esc(dayLabel(t.date))}</b></div>
    </div>
    <p class="lede" style="margin:14px 0 0">${esc(i ? i.name : t.note || 'Inversión eliminada')} · ${esc(t.account)}. ${t.dir === 'out' ? 'Regresó a tu balance.' : 'Salió de tu balance hacia tu patrimonio; no cuenta como gasto.'}</p>
    <div class="sheet-actions">
      <button type="button" class="btn danger" data-action="invtx-del" data-id="${t.id}">${icon('trash')}Eliminar movimiento</button>
      ${i ? `<button type="button" class="btn primary" data-inv="${i.id}">Ver inversión</button>` : ''}
    </div>`;
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

  // ---------- Importar estado de cuenta (CSV del banco) ----------
  const normTxt = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  // Bancos mexicanos suelen exportar en Windows-1252 (acentos «rotos» si se lee como UTF-8)
  const decodeFile = async file => {
    const buf = await file.arrayBuffer();
    try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); }
    catch { return new TextDecoder('windows-1252').decode(buf); }
  };

  const parseCSV = text => {
    text = text.replace(/^﻿/, '');
    const sample = text.split(/\r?\n/).slice(0, 30);
    const delim = [',', ';', '\t', '|'].map(d => ({ d, n: sample.filter(l => l.split(d).length > 2).length })).sort((a, b) => b.n - a.n)[0].d;
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === delim) { row.push(cell.trim()); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell.trim()); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    if (cell || row.length) { row.push(cell.trim()); rows.push(row); }
    return rows.filter(r => r.some(c => c !== ''));
  };

  const COL_KEYS = {
    date: /^(fecha|date|dia|f\. ?oper)/,
    desc: /(concepto|descripci|description|detalle|movimiento|establecimiento|comercio|leyenda)/,
    debit: /(cargo|retiro|debito|debe|salida|withdraw|debit)/,
    credit: /(abono|deposito|credito|haber|entrada|deposit|credit)/,
    amount: /(importe|monto|amount|cantidad)/
  };
  const detectColumns = rows => {
    for (let i = 0; i < Math.min(rows.length, 25); i++) {
      const h = rows[i].map(normTxt), map = {};
      for (const [k, re] of Object.entries(COL_KEYS)) { const j = h.findIndex((c, idx) => re.test(c) && !Object.values(map).includes(idx)); if (j >= 0) map[k] = j; }
      if (map.date !== undefined && (map.amount !== undefined || map.debit !== undefined || map.credit !== undefined)) {
        if (map.debit !== undefined || map.credit !== undefined) delete map.amount;
        if (map.desc === undefined) map.desc = h.findIndex((c, idx) => !Object.values(map).includes(idx) && !/saldo|balance|referencia|folio/.test(c));
        return { header: i, map, mode: map.amount !== undefined ? 'one' : 'two' };
      }
    }
    return null;
  };

  const MES = { ene: 1, jan: 1, feb: 2, mar: 3, abr: 4, apr: 4, may: 5, jun: 6, jul: 7, ago: 8, aug: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12, dec: 12 };
  const parseDateMX = s => {
    s = normTxt(s); let y, m, d, r;
    if ((r = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/))) [, y, m, d] = r;
    else if ((r = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})/))) [, d, m, y] = r;          // dd/mm/aaaa (México)
    else if ((r = s.match(/^(\d{1,2})[\s\-\/.]*([a-z]{3})[a-z]*\.?[\s\-\/.,]*(\d{2,4})/))) { d = r[1]; m = MES[r[2]]; y = r[3]; }
    else return null;
    y = +y; m = +m; d = +d; if (y < 100) y += 2000;
    if (!m || m > 12 || !d || d > 31) return null;
    return `${y}-${pad(m)}-${pad(d)}`;
  };

  const parseMoneyMX = s => {
    s = String(s || '').trim(); if (!s) return null;
    const neg = /^\(.*\)$/.test(s) || /^\s*-|-\s*$|^\$\s*-/.test(s);
    let t = s.replace(/[^\d.,]/g, '');
    if (!t || !/\d/.test(t)) return null;
    const lc = t.lastIndexOf(','), ld = t.lastIndexOf('.');
    if (lc > -1 && ld > -1) t = lc > ld ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
    else if (lc > -1) t = /,\d{1,2}$/.test(t) ? t.replace(',', '.') : t.replace(/,/g, '');
    const n = parseFloat(t);
    return isFinite(n) ? (neg ? -n : n) : null;
  };

  // Categorización automática por palabras clave de comercios comunes en México
  const RULES = [
    [/uber ?eats|rappi|didi ?food|starbucks|restaur|taqueria|cafe|vips|sanborns|little caesar|domino|kfc|mcdonald|burger|pizza/, 'comida'],
    [/walmart|bodega aurrera|soriana|chedraui|la comer|costco|sams|heb|oxxo|7.?eleven|superama|city market|fresko|super/, 'comida'],
    [/uber|didi|cabify|pemex|gasolin|bp |shell|g500|mobil|televia|pase |iave|metro|estacionam|parking/, 'transporte'],
    [/cfe|comision federal/, 'servicios', 'luz'], [/telmex|totalplay|izzi|megacable|infinitum/, 'servicios', 'internet'],
    [/telcel|at&t|att |movistar|bait|virgin mobile/, 'servicios', 'celular'], [/sacmex|agua|aguas de/, 'servicios', 'agua'],
    [/naturgy|gas natural|gas lp|zeta gas|gas express/, 'servicios', 'gas'], [/sky |dish |star tv/, 'servicios', 'tv'],
    [/netflix|disney|hbo|max\.com|prime video|youtube|paramount|vix|crunchyroll|star\+/, 'suscripciones', 'streaming'],
    [/spotify|apple music|deezer|tidal/, 'suscripciones', 'musica'], [/smart ?fit|sport ?city|gym|gimnasio|anytime fitness|energy fitness/, 'suscripciones', 'gimnasio'],
    [/icloud|google one|google storage|dropbox|onedrive/, 'suscripciones', 'nube'], [/playstation|xbox|steam|nintendo|epic games/, 'suscripciones', 'videojuegos'],
    [/apple\.com|google play|chatgpt|openai|adobe|canva|microsoft|notion/, 'suscripciones', 'apps'],
    [/amazon|mercado ?libre|mercadopago|liverpool|palacio de hierro|coppel|zara|h&m|shein|suburbia|sears|elektra|best buy|nike|adidas/, 'compras'],
    [/farmacia|similares|benavides|del ahorro|guadalajara|hospital|medic|doctor|dental|laboratorio|chopo/, 'salud'],
    [/cinepolis|cinemex|ticketmaster|eticket|bar |antro|boliche/, 'ocio'],
    [/aeromexico|volaris|viva ?aerobus|airbnb|hotel|booking|expedia|despegar|ado /, 'viajes'],
    [/colegiatura|universidad|escuela|udemy|coursera|platzi|domestika/, 'educacion'],
    [/renta|home depot|ikea|mantenimiento condominio|predial/, 'hogar']
  ];
  const INCOME_RULES = [[/nomina|sueldo|salario|payroll/, 'salario'], [/reembolso|devolucion|bonificacion|cashback/, 'reembolso'], [/interes|rendimiento|dividendo/, 'inversion']];
  const ruleKey = desc => normTxt(desc).replace(/\d+/g, '').replace(/[^a-z& ]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40);
  const categorize = (desc, type) => {
    const k = ruleKey(desc), learned = (state.rules || {})[k];
    if (learned && cat(learned.cat) && (CATS[type] || []).some(c => c.id === learned.cat)) return { ...learned };
    const n = ' ' + normTxt(desc) + ' ';
    if (type === 'income') { const r = INCOME_RULES.find(([re]) => re.test(n)); return { cat: r ? r[1] : 'otros-in', sub: null }; }
    const r = RULES.find(([re]) => re.test(n));
    return r ? { cat: r[1], sub: r[2] || null } : { cat: 'otros', sub: null };
  };
  const CARD_PAYMENT = /pago (a |de )?(tarjeta|tdc|tc)|su pago|gracias por su pago|pago recibido|pago .*credito|abono a tarjeta/;
  const cleanDesc = s => {
    let t = String(s || '').replace(/\s+/g, ' ').replace(/\b\d{6,}\b/g, '').replace(/\s+/g, ' ').trim();
    if (t === t.toUpperCase()) t = t.toLowerCase().replace(/(^|[\s*\/\-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()).replace(/\b(De|Del|Y|En|A)\b(?!$)/g, w => w.toLowerCase()).replace(/^(\p{Ll})/u, c => c.toUpperCase()).replace(/\b(Cfe|Spei|Oxxo|Iva|Tdc|Atm|Sat)\b/g, w => w.toUpperCase());
    return t.slice(0, 60) || 'Movimiento importado';
  };

  const buildImportItems = () => {
    const I = ui.imp, { map, mode, invert } = I, items = [];
    I.rows.slice(I.header + 1).forEach((r, idx) => {
      const date = parseDateMX(r[map.date]); if (!date) return;
      const rawDesc = map.desc >= 0 ? r[map.desc] : '';
      let amt, type;
      if (mode === 'one') {
        let v = parseMoneyMX(r[map.amount]); if (v === null || !v) return;
        if (invert) v = -v;
        type = v < 0 ? 'expense' : 'income'; amt = Math.abs(v);
      } else {
        const dv = parseMoneyMX(r[map.debit]), cv = parseMoneyMX(r[map.credit]);
        if (dv) { type = 'expense'; amt = Math.abs(dv); } else if (cv) { type = 'income'; amt = Math.abs(cv); } else return;
      }
      amt = Math.round(amt * 100) / 100;
      const n = normTxt(rawDesc);
      const cardPay = type === 'income' && CARD_PAYMENT.test(n);
      const dup = state.tx.some(t => t.date === date && t.type === type && Math.abs(t.amount - amt) < 0.01);
      const c = categorize(rawDesc, type);
      items.push({ i: idx, date, raw: rawDesc, desc: cleanDesc(rawDesc), amount: amt, type, cat: c.cat, sub: c.sub, dup, cardPay, include: !dup && !cardPay });
    });
    I.items = items.sort((a, b) => b.date.localeCompare(a.date));
  };

  const startImport = async file => {
    const rows = parseCSV(await decodeFile(file));
    if (rows.length < 2) return toast('El archivo está vacío o no es un CSV');
    const det = detectColumns(rows);
    const width = Math.max(...rows.map(r => r.length));
    ui.imp = { name: file.name, rows, width, account: 'Débito', invert: false,
      header: det ? det.header : 0, map: det ? det.map : { date: 0, desc: 1, amount: 2 }, mode: det ? det.mode : 'one', step: det ? 'review' : 'map' };
    buildImportItems();
    if (det && !ui.imp.items.length) ui.imp.step = 'map';
    openSheet(importSheet());
  };

  const catOptions = it => {
    const groups = it.type === 'income' ? CATS.income : CATS.expense;
    return groups.map(c => c.subs
      ? `<optgroup label="${esc(c.name)}"><option value="${c.id}" ${it.cat === c.id && !it.sub ? 'selected' : ''}>${esc(c.name)}</option>${c.subs.map(s => `<option value="${c.id}:${s.id}" ${it.cat === c.id && it.sub === s.id ? 'selected' : ''}>${esc(c.name)} · ${esc(s.name)}</option>`).join('')}</optgroup>`
      : `<option value="${c.id}" ${it.cat === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  };

  const importSheet = () => {
    const I = ui.imp;
    if (I.step === 'map') {
      const headers = I.rows[I.header] || [];
      const opt = (field, allowNone) => `<select class="input" data-impmap="${field}">${allowNone ? `<option value="-1">— Ninguna —</option>` : ''}${Array.from({ length: I.width }, (_, j) => `<option value="${j}" ${I.map[field] === j ? 'selected' : ''}>${esc(headers[j] || 'Columna ' + (j + 1))}</option>`).join('')}</select>`;
      const sample = (I.items || []).slice(0, 3);
      return `${sheetHead('Columnas del archivo')}
      <p class="lede" style="margin:-6px 0 14px">Indica qué columna es cada dato. DOMI lo recordará para este formato.</p>
      <label><span class="field-label">Fila de encabezados</span><select class="input" data-impheader>${I.rows.slice(0, 25).map((r, k) => `<option value="${k}" ${I.header === k ? 'selected' : ''}>Fila ${k + 1}: ${esc(r.slice(0, 4).join(' · ').slice(0, 50))}</option>`).join('')}</select></label>
      <div class="row2"><label><span class="field-label">Fecha</span>${opt('date')}</label><label><span class="field-label">Descripción</span>${opt('desc')}</label></div>
      <span class="field-label">Montos</span>
      <div class="seg" role="group"><button type="button" data-impmode="one" aria-pressed="${I.mode === 'one'}">Una columna</button><button type="button" data-impmode="two" aria-pressed="${I.mode === 'two'}">Cargo y abono</button></div>
      ${I.mode === 'one' ? `<div class="row2" style="margin-top:10px"><label><span class="field-label">Importe</span>${opt('amount')}</label>
        <button type="button" class="toggle-row" role="switch" aria-checked="${I.invert}" data-action="imp-invert" style="margin-top:28px"><span><b>Invertir signo</b><small>Si tus gastos salen positivos</small></span><span class="switch" aria-hidden="true" aria-checked="${I.invert}"></span></button></div>`
      : `<div class="row2" style="margin-top:10px"><label><span class="field-label">Cargos (gastos)</span>${opt('debit', true)}</label><label><span class="field-label">Abonos (ingresos)</span>${opt('credit', true)}</label></div>`}
      <span class="field-label">Vista previa</span>
      <div class="imp-preview">${sample.length ? sample.map(it => `<div><span>${esc(it.date)} · ${esc(it.desc)}</span><b class="num ${it.type}">${it.type === 'income' ? '+' : '−'}${money(it.amount)}</b></div>`).join('') : '<div class="imp-none">No se reconocen movimientos con estas columnas.</div>'}</div>
      <div class="sheet-actions"><button type="button" class="btn primary" data-action="imp-review" ${I.items.length ? '' : 'disabled'}>Ver ${I.items.length} movimientos</button></div>`;
    }
    const inc = I.items.filter(x => x.include);
    const ge = inc.filter(x => x.type === 'expense'), gi = inc.filter(x => x.type === 'income');
    const skipped = I.items.length - inc.length;
    return `${sheetHead('Importar estado de cuenta')}
    <p class="lede" style="margin:-6px 0 12px">${esc(I.name)} · ${I.items.length} movimientos encontrados</p>
    <div class="imp-summary">
      <span><b class="num">${ge.length}</b> ${ge.length === 1 ? 'gasto' : 'gastos'} · <b class="num">${money(sum(ge, x => x.amount), { compact: true })}</b></span>
      <span><b class="num pos">${gi.length}</b> ${gi.length === 1 ? 'ingreso' : 'ingresos'} · <b class="num pos">${money(sum(gi, x => x.amount), { compact: true })}</b></span>
      ${skipped ? `<span class="muted"><b>${skipped}</b> sin marcar</span>` : ''}
    </div>
    <div class="row2 imp-opts">
      <label><span class="field-label">Cuenta</span><select class="input" data-impaccount>${ACCOUNTS.map(a => `<option ${a === I.account ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
      <div><span class="field-label">Columnas</span><button type="button" class="btn block" data-action="imp-map" style="height:48px">Ajustar</button></div>
    </div>
    <div class="imp-bar"><button type="button" class="link" data-action="imp-all">${inc.length === I.items.length ? 'Desmarcar todo' : 'Marcar todo'}</button><span>Revisa la categoría de cada uno</span></div>
    <ul class="imp-list">${I.items.map((it, k) => `<li class="imp-row ${it.include ? '' : 'off'}">
      <button type="button" class="imp-check" data-impi="${k}" aria-pressed="${it.include}" aria-label="Incluir ${esc(it.desc)}">${icon("check", 2.6)}</button>
      <div class="imp-main"><div class="imp-desc">${esc(it.desc)}</div>
        <div class="imp-meta"><span>${esc(shortDate(it.date))}</span>
          <label class="imp-catw">${icon((subOf(it) || cat(it.cat)).icon)}<span>${esc(subOf(it) ? subOf(it).name : cat(it.cat).name)}</span><select data-impcat="${k}" aria-label="Categoría de ${esc(it.desc)}">${catOptions(it)}</select></label>
          ${it.dup ? '<span class="imp-flag">Posible duplicado</span>' : ''}${it.cardPay ? '<span class="imp-flag">Pago de tarjeta</span>' : ''}</div></div>
      <div class="imp-amt num ${it.type}">${it.type === 'income' ? '+' : '−'}${money(it.amount)}</div>
    </li>`).join('')}</ul>
    <p class="inv-note">Los marcados como duplicado o pago de tarjeta no se importan a menos que los actives. Los pagos a tu tarjeta no son ingresos: solo mueven dinero entre tus cuentas.</p>
    <div class="sheet-actions"><button type="button" class="btn ghost" data-action="close" style="flex:0 0 auto">Cancelar</button>
      <button type="button" class="btn green" data-action="imp-commit" ${inc.length ? '' : 'disabled'}>Importar ${inc.length} ${inc.length === 1 ? 'movimiento' : 'movimientos'}</button></div>`;
  };
  const impRedraw = () => { const b = $('#sheetBody'), st = b.scrollTop; openSheet(importSheet()); b.scrollTop = st; };

  const commitImport = () => {
    const I = ui.imp, id = uid(), now = Date.now();
    const chosen = I.items.filter(x => x.include);
    state.rules = state.rules || {};
    const added = chosen.map((it, k) => {
      if (it.manual) state.rules[ruleKey(it.raw)] = { cat: it.cat, sub: it.sub };   // DOMI aprende tus correcciones
      return { id: uid(), type: it.type, cat: it.cat, sub: it.sub, amount: it.amount, date: it.date, account: I.account, note: it.desc, receipt: null, reimb: null, created: now + k, importId: id };
    });
    state.tx.push(...added);
    if (!save()) { state.tx.splice(-added.length); return; }
    haptic(); closeSheet(); ui.imp = null;
    if (added.length) ui.month = added.map(t => t.date).sort().at(-1).slice(0, 7);
    location.hash = 'movimientos'; render();
    toast(`${added.length} movimientos importados`, () => { state.tx = state.tx.filter(t => t.importId !== id); });
  };

  // ---------- Exportar / importar ----------
  const download = (name, content, type) => {
    // Android (app): guarda en caché y abre el menú nativo de compartir
    const P = window.Capacitor && window.Capacitor.Plugins;
    if (isCapacitor && P && P.Filesystem && P.Share) {
      P.Filesystem.writeFile({ path: name, data: content, directory: 'CACHE', encoding: 'utf8' })
        .then(r => P.Share.share({ title: name, url: r.uri, dialogTitle: 'Guardar o compartir' }))
        .catch(() => toast('No se pudo exportar el archivo'));
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const exportCSV = () => {
    const list = ui.view === 'movimientos' && ui.type === 'reimb' && ui.hview !== 'cal' ? state.tx.filter(t => t.reimb) : inMonth();
    if (!list.length) return toast('No hay movimientos para exportar en este periodo.');
    const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [['Fecha', 'Tipo', 'Categoría', 'Subcategoría', 'Cuenta', 'Nota', 'Monto', 'Moneda', 'Reembolso', 'Recibo']]
      .concat(sorted(list).map(t => t.type === 'invest'
        ? [t.date, t.dir === 'out' ? 'Retiro de inversión' : 'Aportación a inversión', 'Patrimonio', state.investments.find(x => x.id === t.invId)?.name || t.note || '', t.account, '', signed(t), state.settings.currency, '', '']
        : [t.date, t.type === 'income' ? 'Ingreso' : 'Gasto', cat(t.cat).name, subOf(t)?.name || '', t.account, t.note, (t.type === 'income' ? 1 : -1) * t.amount, state.settings.currency, t.reimb === 'done' ? 'Reembolsado' : t.reimb ? 'Pendiente' : '', t.receipt ? 'Sí' : '']));
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
      add(D(3), 'expense', 'suscripciones', 219, 'Spotify', 'Crédito', { sub: 'musica' });
      add(D(3), 'expense', 'suscripciones', 650, 'Smart Fit', 'Débito', { sub: 'gimnasio' });
      add(D(4), 'expense', 'suscripciones', 299, 'Netflix', 'Crédito', { sub: 'streaming' });
      add(D(5), 'expense', 'suscripciones', 49, 'iCloud', 'Crédito', { sub: 'nube' });
      if (last >= 6) add(D(6), 'expense', 'servicios', rnd(380, 520), '', 'Débito', { sub: 'luz' });
      if (last >= 7) add(D(7), 'expense', 'servicios', rnd(160, 240), '', 'Débito', { sub: 'agua' });
      if (last >= 8) add(D(8), 'expense', 'servicios', 599, '', 'Débito', { sub: 'internet' });
      if (last >= 11) add(D(11), 'expense', 'servicios', 349, '', 'Crédito', { sub: 'celular' });
      if (last >= 14) add(D(14), 'expense', 'servicios', rnd(280, 420), '', 'Efectivo', { sub: 'gas' });
      for (let d = 1; d <= last; d++) {
        if (Math.random() < 0.55) add(D(d), 'expense', 'comida', rnd(85, 420), ['Café', 'Comida', 'Súper', 'Tacos', 'Cena'][d % 5], d % 3 ? 'Débito' : 'Efectivo');
        if (Math.random() < 0.3) add(D(d), 'expense', 'transporte', rnd(45, 260), d % 2 ? 'Uber' : 'Gasolina', 'Crédito');
        if (Math.random() < 0.08) add(D(d), 'expense', 'compras', rnd(350, 1800), ['Ropa', 'Amazon', 'Farmacia'][d % 3], 'Crédito');
        if (Math.random() < 0.06) add(D(d), 'expense', 'ocio', rnd(180, 900), ['Cine', 'Concierto', 'Bar'][d % 3], 'Crédito');
      }
      if (last >= 12) add(D(12), 'expense', 'salud', rnd(400, 900), 'Consulta', 'Débito');
      if (last >= 18) add(D(18), 'expense', 'viajes', rnd(1200, 2600), 'Comida con cliente', 'Crédito', { reimb: m === 0 ? 'pending' : 'done' });
    }
    // Inversiones con historial mensual (crecimiento suave, cripto con baja)
    const mk = (name, type, startContrib, monthly, growth) => {
      const inv = { id: uid(), name, type, contributed: 0, value: 0, history: [], created: Date.now() };
      for (let m = 5; m >= 0; m--) {
        const d = new Date(now.getFullYear(), now.getMonth() - m, m === 0 ? Math.min(now.getDate(), 20) : 25, 12);
        const add = m === 5 ? startContrib : monthly;
        inv.contributed += add; inv.value = Math.round((inv.value + add) * (1 + growth) * 100) / 100;
        inv.history.push({ date: iso(d), value: inv.value });
      }
      return inv;
    };
    const investments = [
      mk('CETES 28 días', 'cetes', 18000, 1000, 0.009),
      mk('Fondo GBM+', 'fondos', 12000, 800, 0.016),
      mk('VOO · S&P 500', 'acciones', 8000, 500, 0.022),
      mk('AFORE', 'afore', 6200, 150, 0.008),
      mk('Bitcoin', 'cripto', 5200, 0, -0.012)
    ];
    const cetes = investments[0];
    tx.push({ id: uid(), type: 'invest', dir: 'in', invId: cetes.id, amount: 3000, account: 'Débito', date: iso(new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - 2), 12)), note: cetes.name, created: Date.now() });
    state = { ...state, tx, investments, budgets: { comida: 6000, servicios: 2200, transporte: 2500, compras: 2500, ocio: 1500, suscripciones: 1400 },
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
    if (v === 'metas' || v === 'inversiones') { ui.pat = v; history.replaceState(null, '', '#patrimonio'); ui.view = 'patrimonio'; render(); return window.scrollTo({ top: 0 }); }
    ui.view = VIEWS[v] ? v : 'inicio';
    render();
    window.scrollTo({ top: 0 });
  };
  window.addEventListener('hashchange', route);
  window.addEventListener('scroll', () => $('#topbar').classList.toggle('scrolled', scrollY > 4), { passive: true });

  document.addEventListener('click', async e => {
    const t = e.target.closest('[data-action],[data-edit],[data-type],[data-cat],[data-sub],[data-hview],[data-impi],[data-impmode],[data-day],[data-pat],[data-inv],[data-invop],[data-invtype],[data-filter-type],[data-budget],[data-budget-del],[data-goal-add],[data-goal-edit],[data-goal-del],[data-op]');
    if (!t) return;
    const a = t.dataset.action;

    if (t.dataset.edit) return openTx(t.dataset.edit);
    if (t.dataset.type && ui.draft) { ui.draft.type = t.dataset.type; if (t.dataset.type === 'income') { ui.draft.reimb = null; ui.draft.receipt = null; } return redrawTx(); }
    if (t.dataset.cat && ui.draft) {
      const changed = ui.draft.cat !== t.dataset.cat;
      ui.draft.cat = t.dataset.cat;
      if (changed) ui.draft.sub = null;
      // Si la categoría tiene subcategorías (Servicios), se redibuja para mostrarlas
      if (changed && (cat(t.dataset.cat).subs || $('.subcats'))) return redrawTx();
      $$('.chip').forEach(c => c.setAttribute('aria-pressed', c === t)); return;
    }
    if (t.dataset.sub && ui.draft) {
      ui.draft.sub = ui.draft.sub === t.dataset.sub ? null : t.dataset.sub;
      $$('.sub-chip').forEach(c => c.setAttribute('aria-pressed', c.dataset.sub === ui.draft.sub)); return;
    }
    if (t.dataset.filterType) { ui.type = t.dataset.filterType; return render(); }
    if (t.dataset.budget) return openSheet(budgetForm(t.dataset.budget));
    if (t.dataset.budgetDel) { const id = t.dataset.budgetDel, prev = state.budgets[id]; delete state.budgets[id]; save(); closeSheet(); render(); return toast('Límite eliminado', () => { state.budgets[id] = prev; }); }
    if (t.dataset.goalAdd) return openSheet(contribForm(t.dataset.goalAdd));
    if (t.dataset.goalEdit) return openSheet(goalForm(t.dataset.goalEdit));
    if (t.dataset.goalDel) { const i = state.goals.findIndex(g => g.id === t.dataset.goalDel); const [g] = state.goals.splice(i, 1); save(); render(); return toast('Meta eliminada', () => { state.goals.splice(i, 0, g); }); }
    if (t.dataset.op) { $$('[data-op]').forEach(b => b.setAttribute('aria-pressed', b === t)); return; }
    // Patrimonio
    if (t.dataset.pat) { ui.pat = t.dataset.pat; return render(); }
    // Importar estado de cuenta
    if (t.dataset.impi !== undefined && ui.imp) { const it = ui.imp.items[+t.dataset.impi]; it.include = !it.include; return impRedraw(); }
    if (t.dataset.impmode && ui.imp) { ui.imp.mode = t.dataset.impmode; if (ui.imp.mode === 'two') { ui.imp.map.debit ??= -1; ui.imp.map.credit ??= -1; } else ui.imp.map.amount ??= 0; buildImportItems(); return impRedraw(); }
    // Calendario
    if (t.dataset.hview) { ui.hview = t.dataset.hview; return render(); }
    if (t.dataset.day) { ui.calDay = t.dataset.day; render(); const det = $('.cal-detail'); if (det && innerWidth < 1000) det.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); return; }
    if (t.dataset.inv) { ui.invOp = 'add'; return openSheet(invSheet(t.dataset.inv)); }
    if (t.dataset.invop) {
      const f = $('#invMoveForm'); const amt = f ? f.amount.value : '';
      ui.invOp = t.dataset.invop; openSheet(invSheet(f.dataset.id));
      if (amt && ui.invOp !== 'set') $('#invMoveForm').amount.value = amt;
      return;
    }
    if (t.dataset.invtype) { ui.invType = t.dataset.invtype; $$('[data-invtype]').forEach(b => b.setAttribute('aria-pressed', b === t)); return; }

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
      case 'stmt': return $('#stmtInput').click();
      case 'imp-review': ui.imp.step = 'review'; return impRedraw();
      case 'imp-map': ui.imp.step = 'map'; return impRedraw();
      case 'imp-invert': ui.imp.invert = !ui.imp.invert; buildImportItems(); return impRedraw();
      case 'imp-all': { const all = ui.imp.items.every(x => x.include); ui.imp.items.forEach(x => { x.include = !all; }); return impRedraw(); }
      case 'imp-commit': return commitImport();
      case 'inv-new': ui.invType = null; ui.invDeduct = false; return openSheet(invForm());
      case 'inv-edit': ui.invType = null; return openSheet(invForm(t.dataset.id));
      case 'inv-deduct': ui.invDeduct = !ui.invDeduct; t.setAttribute('aria-checked', ui.invDeduct); t.querySelector('.switch').setAttribute('aria-checked', ui.invDeduct); return;
      case 'inv-del': {
        const i = state.investments.findIndex(x => x.id === t.dataset.id);
        const [removed] = state.investments.splice(i, 1); save(); closeSheet(); render();
        return toast('Inversión eliminada', () => { state.investments.splice(i, 0, removed); });
      }
      case 'invtx-del': {
        // Revierte el efecto del movimiento sobre la inversión
        const k = state.tx.findIndex(x => x.id === t.dataset.id); if (k < 0) return;
        const mv = state.tx[k], inv = state.investments.find(x => x.id === mv.invId);
        const snap = inv ? { contributed: inv.contributed, value: inv.value, history: [...(inv.history || [])] } : null;
        if (inv) {
          if (mv.dir === 'out') { inv.value += mv.amount; inv.contributed += mv.basis || mv.amount; }
          else { inv.value = Math.max(0, inv.value - mv.amount); inv.contributed = Math.max(0, inv.contributed - mv.amount); }
          inv.history = [...(inv.history || []), { date: today(), value: inv.value }];
        }
        state.tx.splice(k, 1); save(); closeSheet(); render();
        return toast('Movimiento eliminado', () => { state.tx.splice(k, 0, mv); if (inv) Object.assign(inv, snap); });
      }
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
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-edit],[data-budget],[data-inv]')) { e.preventDefault(); e.target.click(); }
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
    if (ui.imp && e.target.matches('[data-impcat]')) { const it = ui.imp.items[+e.target.dataset.impcat]; const [c, sb] = e.target.value.split(':'); it.cat = c; it.sub = sb || null; it.manual = true; return impRedraw(); }
    if (ui.imp && e.target.matches('[data-impmap]')) { ui.imp.map[e.target.dataset.impmap] = +e.target.value; buildImportItems(); return impRedraw(); }
    if (ui.imp && e.target.matches('[data-impheader]')) { ui.imp.header = +e.target.value; buildImportItems(); return impRedraw(); }
    if (ui.imp && e.target.matches('[data-impaccount]')) { ui.imp.account = e.target.value; return; }
    if (e.target.id === 'setName') { state.settings.name = e.target.value.trim(); save(); toast('Nombre guardado'); }
    if (e.target.id === 'setCur') { state.settings.currency = e.target.value; save(); render(); toast('Moneda actualizada'); }
  });

  $('#receiptInput').addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f || !ui.draft) return;
    try { ui.draft.receipt = await compressImage(f); redrawTx(); }
    catch { toast('No se pudo leer la imagen'); }
  });

  $('#stmtInput').addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    if (/\.(xlsx?|pdf)$/i.test(f.name)) return toast('Descarga el estado de cuenta en formato CSV desde tu banco');
    try { await startImport(f); } catch (err) { toast('No se pudo leer el archivo'); }
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
      const rec = { id: d.id || uid(), type: d.type, cat: d.cat, sub: cat(d.cat).subs ? (d.sub || null) : null, amount, date: d.date || today(), account: d.account, note: d.note.trim(), receipt: d.type === 'expense' ? d.receipt : null, reimb: d.type === 'expense' ? d.reimb : null, created: d.created || Date.now() };
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
    if (f.id === 'invForm') {
      const id = f.dataset.id, name = f.name.value.trim();
      if (!name) return toast('Ponle nombre a tu inversión');
      if (id) {
        const inv = state.investments.find(x => x.id === id);
        Object.assign(inv, { name, type: ui.invType || inv.type });
        save(); closeSheet(); render(); return toast('Inversión actualizada');
      }
      const contributed = parseAmount(f.contributed.value);
      if (!contributed) { f.contributed.focus(); return toast('Escribe cuánto has puesto'); }
      const value = parseAmount(f.value.value) || contributed;
      const inv = { id: uid(), name, type: ui.invType || 'cetes', contributed, value, history: [{ date: today(), value }], created: Date.now() };
      state.investments.push(inv);
      if (ui.invDeduct) state.tx.push({ id: uid(), type: 'invest', dir: 'in', invId: inv.id, amount: contributed, account: 'Débito', date: today(), note: name, created: Date.now() });
      ui.pat = 'inversiones';
      if (!save()) { state.investments.pop(); return; }
      haptic(); closeSheet(); if (location.hash !== '#patrimonio') location.hash = 'patrimonio'; else render();
      return toast('Inversión agregada');
    }
    if (f.id === 'invMoveForm') {
      const inv = state.investments.find(x => x.id === f.dataset.id);
      const amount = parseAmount(f.amount.value), op = ui.invOp || 'add', date = f.date.value || today();
      if (!amount && op !== 'set') { f.amount.focus(); return toast('Escribe un monto mayor a cero'); }
      if (op === 'set') {
        if (!f.amount.value.trim()) { f.amount.focus(); return toast('Escribe cuánto vale hoy'); }
        inv.value = amount;
      } else if (op === 'add') {
        inv.contributed += amount; inv.value += amount;
        state.tx.push({ id: uid(), type: 'invest', dir: 'in', invId: inv.id, amount, account: f.account.value, date, note: inv.name, created: Date.now() });
      } else {
        if (amount > inv.value + 0.001) return toast(`Solo puedes retirar hasta ${money(inv.value)}`);
        // El costo base se reduce en proporción a lo retirado
        const basis = inv.value ? Math.round(inv.contributed * (amount / inv.value) * 100) / 100 : amount;
        inv.contributed = Math.max(0, inv.contributed - basis); inv.value = Math.max(0, inv.value - amount);
        state.tx.push({ id: uid(), type: 'invest', dir: 'out', invId: inv.id, amount, basis, account: f.account.value, date, note: inv.name, created: Date.now() });
      }
      inv.history = [...(inv.history || []), { date, value: inv.value }].sort((a, b) => a.date.localeCompare(b.date));
      save(); haptic(); closeSheet(); render();
      return toast(op === 'set' ? 'Valor actualizado' : op === 'add' ? `Aportaste ${money(amount, { compact: true })} · no cuenta como gasto` : 'Retiro registrado');
    }
  });

  // ---------- Arranque ----------
  // Pide al sistema que no borre los datos de DOMI para liberar espacio
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) { /* no soportado */ }
  route();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    if (!isNative) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();

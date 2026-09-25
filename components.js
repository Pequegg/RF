/* ============================================================
   Componentes UI reutilizables y helpers
   ============================================================ */

const Icons = {
  home: '<svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
  plus: '<svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  list: '<svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
  users: '<svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  chart: '<svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  cash: '<svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>',
  alert: '<svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  logout: '<svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  sun: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
  moon: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  x: '<svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  check: '<svg fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
  image: '<svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
  search: '<svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
};

const EstadoLabel = {
  'pendiente_revision': { text: 'Pendiente revisión', color: 'orange' },
  'aprobada':           { text: 'Aprobada',           color: 'blue' },
  'en_maduracion':      { text: 'En maduración',      color: 'violet' },
  'pagada':             { text: 'Pagada',             color: 'green' },
  'rechazada':          { text: 'Rechazada',          color: 'red' }
};

const CanalIcono = {
  'Mercado Libre': '🛒',
  'Facebook': '📘',
  'WhatsApp': '💬',
  'Tienda local': '🏬'
};

function fmtMoney(n) {
  return '$' + Number(n).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtFecha(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtFechaHora(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function pillEstado(estado) {
  const info = EstadoLabel[estado] || { text: estado, color: 'gray' };
  return `<span class="pill pill-${info.color}">${info.text}</span>`;
}

function toast(msg, type = 'info') {
  const container = document.getElementById('toastContainer') || (() => {
    const c = document.createElement('div');
    c.id = 'toastContainer';
    c.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none';
    document.body.appendChild(c);
    return c;
  })();
  const colors = {
    info:    'bg-blue-500/90',
    success: 'bg-green-500/90',
    error:   'bg-red-500/90',
    warning: 'bg-amber-500/90'
  };
  const el = document.createElement('div');
  el.className = `animate-spring px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-2xl backdrop-blur-xl ${colors[type]}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'all 0.3s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-10px)';
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

function abrirSheet(html) {
  cerrarSheet();
  const container = document.createElement('div');
  container.id = 'sheetOverlay';
  container.className = 'sheet-container animate-fade';
  container.innerHTML = `<div class="sheet animate-sheet p-6" onclick="event.stopPropagation()">
    <button onclick="cerrarSheet()" class="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-500/15 hover:bg-slate-500/25 flex items-center justify-center transition">
      <span class="w-4 h-4 inline-block">${Icons.x}</span>
    </button>
    ${html}
  </div>`;
  container.addEventListener('click', cerrarSheet);
  document.body.appendChild(container);
}

function cerrarSheet() {
  const el = document.getElementById('sheetOverlay');
  if (el) el.remove();
}

function confirmar(msg) {
  return new Promise(resolve => {
    const html = `
      <h3 class="text-xl font-bold mb-3">Confirmar</h3>
      <p class="text-slate-600 dark:text-slate-300 mb-6">${msg}</p>
      <div class="flex gap-3">
        <button id="btnCancel" class="btn-secondary flex-1">Cancelar</button>
        <button id="btnOk" class="btn-danger flex-1">Confirmar</button>
      </div>`;
    abrirSheet(html);
    document.getElementById('btnCancel').onclick = () => { cerrarSheet(); resolve(false); };
    document.getElementById('btnOk').onclick = () => { cerrarSheet(); resolve(true); };
  });
}

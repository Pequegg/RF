/* ============================================================
   App principal: enrutador SPA, layout, navegación
   ============================================================ */

let USUARIO = null;
let RUTA_ACTUAL = 'dashboard';

async function init() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }

  try {
    USUARIO = await apiGet('/api/auth/me');
  } catch (e) {
    location.href = '/login';
    return;
  }

  renderLayout();
  navegar('dashboard');
}

function renderLayout() {
  const esAdmin = USUARIO.rol === 'admin';
  const nav = esAdmin ? [
    { id: 'dashboard',    label: 'Dashboard',   icon: Icons.chart },
    { id: 'ventas',       label: 'Ventas',      icon: Icons.list },
    { id: 'pagos',        label: 'Pagos',       icon: Icons.cash },
    { id: 'disputas',     label: 'Disputas',    icon: Icons.alert },
    { id: 'empleados',    label: 'Empleados',   icon: Icons.users },
  ] : [
    { id: 'dashboard',    label: 'Inicio',      icon: Icons.home },
    { id: 'nueva-venta',  label: 'Nueva venta', icon: Icons.plus },
    { id: 'mis-ventas',   label: 'Mis ventas',  icon: Icons.list },
    { id: 'mis-disputas', label: 'Disputas',    icon: Icons.alert },
  ];

  const app = document.getElementById('app');
  app.innerHTML = `
    <aside class="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 glass border-r border-white/40 dark:border-white/5 flex-col p-4 z-30">
      <div class="flex items-center gap-3 px-2 mb-8">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <span class="w-5 h-5 text-white">${Icons.home}</span>
        </div>
        <div>
          <div class="font-bold text-base leading-tight">Ferretería</div>
          <div class="text-xs text-slate-500 dark:text-slate-400">Comisiones</div>
        </div>
      </div>
      <nav class="flex-1 space-y-1" id="sidebarNav">
        ${nav.map(n => `
          <div class="nav-item" data-route="${n.id}">
            <span class="w-5 h-5">${n.icon}</span>
            <span>${n.label}</span>
          </div>
        `).join('')}
      </nav>
      <div class="border-t border-slate-300/40 dark:border-slate-700/40 pt-3 mt-3">
        <div class="px-3 py-2 mb-2">
          <div class="font-semibold text-sm truncate">${USUARIO.nombre}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400 capitalize">${USUARIO.rol}</div>
        </div>
        <div class="nav-item" onclick="apiLogout()">
          <span class="w-5 h-5">${Icons.logout}</span>
          <span>Cerrar sesión</span>
        </div>
      </div>
    </aside>

    <main class="lg:ml-64 pb-24 lg:pb-8 min-h-screen">
      <header class="sticky top-0 z-20 glass border-b border-white/40 dark:border-white/5 px-4 py-3 lg:px-8 lg:py-4 flex items-center justify-between">
        <div class="lg:hidden flex items-center gap-2">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span class="w-4 h-4 text-white">${Icons.home}</span>
          </div>
          <span class="font-bold">Ferretería</span>
        </div>
        <h1 id="pageTitle" class="hidden lg:block text-2xl font-bold tracking-tight">Dashboard</h1>
        <div class="flex items-center gap-2">
          <button id="themeToggle" class="w-10 h-10 rounded-full glass flex items-center justify-center transition hover:scale-105 active:scale-95">
            <span id="iconTheme" class="w-5 h-5"></span>
          </button>
          <div class="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full glass">
            <div class="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
              ${USUARIO.nombre.charAt(0).toUpperCase()}
            </div>
            <span class="text-sm font-medium">${USUARIO.nombre.split(' ')[0]}</span>
          </div>
        </div>
      </header>

      <section id="view" class="p-4 lg:p-8 max-w-6xl mx-auto"></section>
    </main>

    <nav class="lg:hidden fixed bottom-0 left-0 right-0 z-30 glass border-t border-white/40 dark:border-white/5 px-2 pb-[env(safe-area-inset-bottom)] pt-2">
      <div class="flex justify-around">
        ${nav.slice(0, 5).map(n => `
          <button class="bottom-nav-item flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition" data-route="${n.id}">
            <span class="w-6 h-6">${n.icon}</span>
            <span class="text-[10px] font-medium">${n.label}</span>
          </button>
        `).join('')}
      </div>
    </nav>
  `;

  const updateIcons = () => {
    const dark = document.documentElement.classList.contains('dark');
    document.getElementById('iconTheme').innerHTML = dark ? Icons.sun : Icons.moon;
  };
  updateIcons();
  document.getElementById('themeToggle').onclick = () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    updateIcons();
    if (RUTA_ACTUAL === 'dashboard') navegar('dashboard');
  };

  document.querySelectorAll('.nav-item[data-route], .bottom-nav-item').forEach(el => {
    el.addEventListener('click', () => navegar(el.dataset.route));
  });
}

function setActiveNav(route) {
  document.querySelectorAll('.nav-item[data-route], .bottom-nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.route === route);
  });
}

async function navegar(route) {
  RUTA_ACTUAL = route;
  setActiveNav(route);
  const view = document.getElementById('view');
  const titles = {
    dashboard: USUARIO.rol === 'admin' ? 'Dashboard' : 'Inicio',
    'nueva-venta': 'Nueva venta',
    'mis-ventas': 'Mis ventas',
    'mis-disputas': 'Mis disputas',
    ventas: 'Ventas',
    pagos: 'Pagos de comisiones',
    disputas: 'Disputas',
    empleados: 'Empleados'
  };
  const t = document.getElementById('pageTitle');
  if (t) t.textContent = titles[route] || 'Ferretería';

  view.innerHTML = `<div class="text-center py-20 text-slate-400">Cargando...</div>`;

  try {
    if (USUARIO.rol === 'admin') {
      await AdminViews[route]?.(view);
    } else {
      await VendedorViews[route]?.(view);
    }
  } catch (e) {
    view.innerHTML = `<div class="glass-card p-6 text-center text-red-500">Error: ${e.message}</div>`;
  }
}

window.addEventListener('DOMContentLoaded', init);

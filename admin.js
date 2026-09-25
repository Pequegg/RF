/* ============================================================
   Vistas del rol ADMIN
   ============================================================ */

const AdminViews = {};
let chartTendencia, chartCanal, chartEstados;

AdminViews['dashboard'] = async (view) => {
  const d = await apiGet('/api/stats/dashboard');
  view.innerHTML = `
    <div class="space-y-6 animate-spring">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        ${adminKpi('Total ventas', d.total_ventas, 'blue', Icons.list)}
        ${adminKpi('Comisiones pagadas', fmtMoney(d.comisiones.pagadas), 'green', Icons.cash)}
        ${adminKpi('Comisiones pendientes', fmtMoney(d.comisiones.pendientes), 'orange', Icons.chart)}
        ${adminKpi('Listas para pagar', fmtMoney(d.comisiones.listas_para_pagar), 'violet', Icons.check)}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="glass-card p-6">
          <h3 class="font-bold mb-4">Tendencia últimos 6 meses</h3>
          <canvas id="chartTendencia" height="180"></canvas>
        </div>
        <div class="glass-card p-6">
          <h3 class="font-bold mb-4">Ventas por canal</h3>
          <canvas id="chartCanal" height="180"></canvas>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="glass-card p-6">
          <h3 class="font-bold mb-4">Estados de ventas</h3>
          <canvas id="chartEstados" height="180"></canvas>
        </div>
        <div class="glass-card p-6">
          <h3 class="font-bold mb-4">Top vendedores</h3>
          <div class="space-y-3">
            ${d.top_vendedores.map((v, i) => `
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white flex items-center justify-center font-bold text-sm">${i + 1}</div>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold truncate">${v.nombre}</div>
                  <div class="text-xs text-slate-500">${v.cantidad_ventas} ventas</div>
                </div>
                <div class="font-bold text-green-600 dark:text-green-400">${fmtMoney(v.total_comision)}</div>
              </div>
            `).join('') || '<div class="text-slate-500 text-center py-4">Sin datos</div>'}
          </div>
        </div>
      </div>
    </div>
  `;

  const isDark = document.documentElement.classList.contains('dark');
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? '#cbd5e1' : '#475569';
  Chart.defaults.color = textColor;
  Chart.defaults.font.family = '-apple-system, system-ui, sans-serif';

  chartTendencia?.destroy();
  chartTendencia = new Chart(document.getElementById('chartTendencia'), {
    type: 'line',
    data: {
      labels: d.tendencia.map(x => x.mes),
      datasets: [
        { label: 'Ventas ($)', data: d.tendencia.map(x => x.total),
          borderColor: '#0A84FF', backgroundColor: 'rgba(10,132,255,0.12)',
          tension: 0.4, fill: true, borderWidth: 2.5, pointRadius: 3 },
        { label: 'Comisiones ($)', data: d.tendencia.map(x => x.comisiones),
          borderColor: '#5E5CE6', backgroundColor: 'rgba(94,92,230,0.12)',
          tension: 0.4, fill: true, borderWidth: 2.5, pointRadius: 3 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12, usePointStyle: true } } },
      scales: {
        x: { grid: { color: gridColor }, border: { display: false } },
        y: { grid: { color: gridColor }, border: { display: false }, beginAtZero: true }
      }
    }
  });

  chartCanal?.destroy();
  const canales = Object.keys(d.por_canal);
  chartCanal = new Chart(document.getElementById('chartCanal'), {
    type: 'doughnut',
    data: {
      labels: canales,
      datasets: [{
        data: canales.map(c => d.por_canal[c].total),
        backgroundColor: ['#0A84FF', '#5E5CE6', '#30D158', '#FF9F0A'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '65%',
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12, usePointStyle: true } } }
    }
  });

  chartEstados?.destroy();
  const estadosLabels = Object.keys(d.estados);
  const colores = {
    pendiente_revision: '#FF9F0A', aprobada: '#0A84FF',
    en_maduracion: '#5E5CE6', pagada: '#30D158', rechazada: '#FF453A'
  };
  chartEstados = new Chart(document.getElementById('chartEstados'), {
    type: 'bar',
    data: {
      labels: estadosLabels.map(e => EstadoLabel[e]?.text || e),
      datasets: [{
        data: estadosLabels.map(e => d.estados[e]),
        backgroundColor: estadosLabels.map(e => colores[e] || '#888'),
        borderRadius: 8, borderWidth: 0
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: { grid: { color: gridColor }, border: { display: false }, beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
};

AdminViews['ventas'] = async (view) => {
  const ventas = await apiGet('/api/admin/ventas');
  const empleados = await apiGet('/api/admin/empleados');
  view.innerHTML = `
    <div class="animate-spring space-y-4">
      <div>
        <h2 class="text-2xl font-bold">Ventas registradas</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">${ventas.length} venta(s)</p>
      </div>

      <div class="glass-card p-3 flex flex-wrap gap-2">
        <select id="fVendedor" class="input-ios !w-auto text-sm">
          <option value="">Todos los vendedores</option>
          ${empleados.map(e => `<option value="${e.id}">${e.nombre}</option>`).join('')}
        </select>
        <select id="fEstado" class="input-ios !w-auto text-sm">
          <option value="">Todos los estados</option>
          <option value="pendiente_revision">Pendiente revisión</option>
          <option value="aprobada">Aprobada</option>
          <option value="en_maduracion">En maduración</option>
          <option value="pagada">Pagada</option>
          <option value="rechazada">Rechazada</option>
        </select>
        <select id="fCanal" class="input-ios !w-auto text-sm">
          <option value="">Todos los canales</option>
          <option>Mercado Libre</option><option>Facebook</option>
          <option>WhatsApp</option><option>Tienda local</option>
        </select>
      </div>

      <div id="listaVentasAdmin" class="space-y-3">
        ${ventas.map(v => adminVentaCard(v)).join('')}
      </div>
    </div>
  `;

  const aplicar = () => {
    const fv = document.getElementById('fVendedor').value;
    const fe = document.getElementById('fEstado').value;
    const fc = document.getElementById('fCanal').value;
    const lista = ventas.filter(v =>
      (!fv || String(v.id_vendedor) === fv) && (!fe || v.estado === fe) && (!fc || v.canal === fc)
    );
    document.getElementById('listaVentasAdmin').innerHTML = lista.length
      ? lista.map(v => adminVentaCard(v)).join('')
      : '<div class="glass-card p-8 text-center text-slate-500">Sin resultados.</div>';
    bindAdminVentaCards();
  };
  ['fVendedor','fEstado','fCanal'].forEach(id => document.getElementById(id).onchange = aplicar);
  bindAdminVentaCards();
};

AdminViews['pagos'] = async (view) => {
  const resumen = await apiGet('/api/admin/resumen-pagos');
  const listas = await apiGet('/api/admin/ventas-listas-para-pagar');
  view.innerHTML = `
    <div class="animate-spring space-y-6">
      <div>
        <h2 class="text-2xl font-bold">Pagos de comisiones</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">Resumen por empleado y comisiones listas para pagar</p>
      </div>

      <div class="glass-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-500/5">
              <tr class="text-left text-xs uppercase tracking-wide text-slate-500">
                <th class="p-3">Empleado</th>
                <th class="p-3 text-right">Pendiente</th>
                <th class="p-3 text-right">Madurando</th>
                <th class="p-3 text-right">Listo pagar</th>
                <th class="p-3 text-right">Pagado</th>
                <th class="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${resumen.map(r => `
                <tr class="border-t border-slate-300/30 dark:border-slate-700/30">
                  <td class="p-3 font-semibold">${r.empleado.nombre}</td>
                  <td class="p-3 text-right">${fmtMoney(r.pendiente_revision)}</td>
                  <td class="p-3 text-right">${fmtMoney(r.madurando)}</td>
                  <td class="p-3 text-right font-semibold text-green-600 dark:text-green-400">${fmtMoney(r.listo_para_pagar)}</td>
                  <td class="p-3 text-right">${fmtMoney(r.pagado)}</td>
                  <td class="p-3 text-right font-bold">${fmtMoney(r.total_generado)}</td>
                </tr>
              `).join('') || '<tr><td colspan="6" class="p-8 text-center text-slate-500">Sin empleados</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 class="text-xl font-bold mb-3">Comisiones listas para pagar (${listas.length})</h3>
        <div class="space-y-3">
          ${listas.length ? listas.map(v => `
            <div class="glass-card p-5 flex items-center justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="font-mono text-xs font-semibold text-blue-500">${v.codigo}</div>
                <div class="font-semibold truncate">${v.vendedor_nombre} · ${v.producto}</div>
                <div class="text-xs text-slate-500">${v.canal} · Maduró ${fmtFecha(v.fecha_maduracion)}</div>
              </div>
              <div class="text-right">
                <div class="font-bold text-green-600 dark:text-green-400 text-lg">${fmtMoney(v.comision)}</div>
                <button onclick="marcarPagada('${v.codigo}')" class="btn-success mt-1 !py-1.5 !px-3 text-xs">Marcar pagada</button>
              </div>
            </div>
          `).join('') : '<div class="glass-card p-8 text-center text-slate-500">No hay comisiones listas para pagar.</div>'}
        </div>
      </div>
    </div>
  `;
};

AdminViews['disputas'] = async (view) => {
  const disputas = await apiGet('/api/disputas/todas');
  view.innerHTML = `
    <div class="animate-spring space-y-4">
      <div>
        <h2 class="text-2xl font-bold">Disputas</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">${disputas.filter(d => d.estado === 'abierta').length} abierta(s)</p>
      </div>
      <div class="space-y-3">
        ${disputas.length ? disputas.map(d => `
          <div class="glass-card p-5">
            <div class="flex items-start justify-between gap-3 mb-2">
              <div>
                <div class="font-mono text-sm font-semibold text-blue-500">${d.codigo_venta}</div>
                <div class="text-sm font-semibold">${d.vendedor_nombre}</div>
                <div class="text-xs text-slate-500">${fmtFechaHora(d.fecha)}</div>
              </div>
              <span class="pill ${d.estado === 'abierta' ? 'pill-orange' : 'pill-green'}">${d.estado}</span>
            </div>
            <div class="text-sm mb-3"><strong>Motivo:</strong> ${d.motivo}</div>
            ${d.estado === 'abierta' ? `
              <textarea id="res-${d.id}" rows="2" class="input-ios mb-2" placeholder="Escribe la resolución..."></textarea>
              <button onclick="resolverDisputa(${d.id})" class="btn-primary">Resolver</button>
            ` : `<div class="text-sm text-green-600 dark:text-green-400"><strong>Resolución:</strong> ${d.resolucion}</div>`}
          </div>
        `).join('') : '<div class="glass-card p-8 text-center text-slate-500">Sin disputas.</div>'}
      </div>
    </div>
  `;
};

AdminViews['empleados'] = async (view) => {
  const empleados = await apiGet('/api/admin/empleados');
  view.innerHTML = `
    <div class="animate-spring space-y-4">
      <div>
        <h2 class="text-2xl font-bold">Empleados</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">${empleados.length} registrado(s)</p>
      </div>
      <div class="space-y-3">
        ${empleados.map(e => `
          <div class="glass-card p-5 flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold shrink-0">
                ${e.nombre.charAt(0).toUpperCase()}
              </div>
              <div class="min-w-0">
                <div class="font-semibold truncate">${e.nombre}</div>
                <div class="text-xs text-slate-500">@${e.usuario} · Registrado ${fmtFecha(e.fecha_registro)}</div>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="pill ${e.estado === 'activo' ? 'pill-green' : e.estado === 'pendiente' ? 'pill-orange' : 'pill-gray'}">${e.estado}</span>
              ${e.estado !== 'activo' ? `<button onclick="activarEmp(${e.id})" class="btn-success !py-1.5 !px-3 text-xs">Activar</button>` : ''}
              ${e.estado === 'activo' ? `<button onclick="desactivarEmp(${e.id})" class="btn-secondary !py-1.5 !px-3 text-xs">Desactivar</button>` : ''}
            </div>
          </div>
        `).join('') || '<div class="glass-card p-8 text-center text-slate-500">Sin empleados.</div>'}
      </div>
    </div>
  `;
};

function adminKpi(label, value, color, icon) {
  const colors = {
    blue: 'text-blue-500 bg-blue-500/10', green: 'text-green-500 bg-green-500/10',
    orange: 'text-orange-500 bg-orange-500/10', violet: 'text-violet-500 bg-violet-500/10'
  };
  return `
    <div class="glass-card p-5">
      <div class="flex items-center justify-between mb-3">
        <span class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">${label}</span>
        <span class="w-9 h-9 rounded-xl ${colors[color]} flex items-center justify-center"><span class="w-4 h-4">${icon}</span></span>
      </div>
      <div class="text-2xl font-bold tracking-tight">${value}</div>
    </div>
  `;
}

function adminVentaCard(v) {
  const acciones = {
    pendiente_revision: `
      <button onclick="event.stopPropagation();aprobarVenta('${v.codigo}')" class="btn-success !py-1.5 !px-3 text-xs">✓ Aprobar</button>
      <button onclick="event.stopPropagation();rechazarVenta('${v.codigo}')" class="btn-danger !py-1.5 !px-3 text-xs">✗ Rechazar</button>`,
    aprobada: v.esta_madura ? `
      <button onclick="event.stopPropagation();marcarPagada('${v.codigo}')" class="btn-success !py-1.5 !px-3 text-xs">Marcar pagada</button>` : '',
    en_maduracion: '',
    pagada: `<button onclick="event.stopPropagation();revertirVenta('${v.codigo}')" class="btn-secondary !py-1.5 !px-3 text-xs">Revertir</button>`,
    rechazada: ''
  };
  return `
    <div class="glass-card venta-card-admin p-5" data-codigo="${v.codigo}">
      <div class="flex items-start justify-between gap-3 mb-3">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-lg">${CanalIcono[v.canal] || '📦'}</span>
            <span class="font-mono text-xs font-semibold text-blue-500">${v.codigo}</span>
          </div>
          <div class="font-semibold truncate">${v.producto}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400">${v.vendedor_nombre || ''} · ${v.canal} · ${v.n_orden}</div>
        </div>
        ${pillEstado(v.estado)}
      </div>
      <div class="flex items-center justify-between pt-3 border-t border-slate-300/30 dark:border-slate-700/30">
        <div>
          <div class="text-xs text-slate-500">Monto neto</div>
          <div class="font-semibold">${fmtMoney(v.monto_neto)}</div>
        </div>
        <div class="text-right">
          <div class="text-xs text-slate-500">Comisión</div>
          <div class="font-bold text-green-600 dark:text-green-400">${fmtMoney(v.comision)}</div>
        </div>
      </div>
      <div class="flex items-center justify-between mt-3">
        <div class="text-xs text-slate-400">${fmtFecha(v.fecha_registro)}</div>
        <div class="flex gap-2">${acciones[v.estado] || ''}</div>
      </div>
    </div>
  `;
}

function bindAdminVentaCards() {
  document.querySelectorAll('.venta-card-admin').forEach(c => {
    c.onclick = () => verDetalleVenta(c.dataset.codigo);
  });
}

async function aprobarVenta(codigo) {
  try { await apiPost(`/api/admin/ventas/${codigo}/aprobar`); toast('Venta aprobada', 'success'); navegar(RUTA_ACTUAL); }
  catch (e) { toast(e.message, 'error'); }
}

function rechazarVenta(codigo) {
  abrirSheet(`
    <h3 class="text-xl font-bold mb-1">Rechazar venta</h3>
    <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">${codigo}</p>
    <textarea id="motivoRechazo" rows="3" class="input-ios mb-4" placeholder="Motivo del rechazo (obligatorio)"></textarea>
    <button id="btnRechazar" class="btn-danger w-full">Rechazar venta</button>
  `);
  document.getElementById('btnRechazar').onclick = async () => {
    const motivo = document.getElementById('motivoRechazo').value.trim();
    if (!motivo) return toast('El motivo es obligatorio', 'error');
    try {
      await apiPost(`/api/admin/ventas/${codigo}/rechazar`, { motivo });
      toast('Venta rechazada', 'success');
      cerrarSheet(); navegar(RUTA_ACTUAL);
    } catch (e) { toast(e.message, 'error'); }
  };
}

async function marcarPagada(codigo) {
  const ok = await confirmar(`¿Marcar la comisión de ${codigo} como pagada?`);
  if (!ok) return;
  try { await apiPost(`/api/admin/ventas/${codigo}/pagar`); toast('Comisión pagada', 'success'); navegar(RUTA_ACTUAL); }
  catch (e) { toast(e.message, 'error'); }
}

function revertirVenta(codigo) {
  abrirSheet(`
    <h3 class="text-xl font-bold mb-1">Registrar reversión</h3>
    <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">${codigo}</p>
    <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Monto a revertir ($)</label>
    <input id="montoRev" type="number" step="0.01" class="input-ios mb-3" placeholder="Deja vacío para revertir toda la comisión">
    <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Motivo</label>
    <textarea id="motivoRev" rows="3" class="input-ios mb-4" placeholder="Motivo (devolución, anulación, etc.)"></textarea>
    <button id="btnRev" class="btn-danger w-full">Registrar reversión</button>
  `);
  document.getElementById('btnRev').onclick = async () => {
    const motivo = document.getElementById('motivoRev').value.trim();
    const monto = document.getElementById('montoRev').value;
    if (!motivo) return toast('El motivo es obligatorio', 'error');
    try {
      await apiPost(`/api/admin/ventas/${codigo}/revertir`, { motivo, monto_revertido: monto || null });
      toast('Reversión registrada', 'success');
      cerrarSheet(); navegar(RUTA_ACTUAL);
    } catch (e) { toast(e.message, 'error'); }
  };
}

async function resolverDisputa(id) {
  const res = document.getElementById('res-' + id).value.trim();
  if (!res) return toast('Escribe la resolución', 'error');
  try { await apiPost(`/api/disputas/${id}/resolver`, { resolucion: res }); toast('Disputa resuelta', 'success'); navegar(RUTA_ACTUAL); }
  catch (e) { toast(e.message, 'error'); }
}

async function activarEmp(id) {
  try { await apiPost(`/api/admin/empleados/${id}/activar`); toast('Empleado activado', 'success'); navegar(RUTA_ACTUAL); }
  catch (e) { toast(e.message, 'error'); }
}

async function desactivarEmp(id) {
  const ok = await confirmar('¿Desactivar este empleado?');
  if (!ok) return;
  try { await apiPost(`/api/admin/empleados/${id}/desactivar`); toast('Empleado desactivado', 'success'); navegar(RUTA_ACTUAL); }
  catch (e) { toast(e.message, 'error'); }
}

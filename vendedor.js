/* ============================================================
   Vistas del rol VENDEDOR
   ============================================================ */

const VendedorViews = {};

VendedorViews['dashboard'] = async (view) => {
  const res = await apiGet('/api/ventas/mis-resumen');
  const ventas = await apiGet('/api/ventas/mis-ventas');
  const ultimas = ventas.slice(0, 4);

  view.innerHTML = `
    <div class="space-y-6 animate-spring">
      <div class="glass-card p-6">
        <div class="text-sm text-slate-500 dark:text-slate-400">Hola, ${USUARIO.nombre.split(' ')[0]} 👋</div>
        <div class="text-3xl font-bold mt-1">Resumen de tus comisiones</div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        ${kpiCard('Total generado', fmtMoney(res.total_generado), 'blue', Icons.cash)}
        ${kpiCard('Madurando', fmtMoney(res.madurando), 'violet', Icons.chart)}
        ${kpiCard('Listo para pagar', fmtMoney(res.listo_para_pagar), 'green', Icons.check)}
        ${kpiCard('Ya pagado', fmtMoney(res.pagado), 'gray', Icons.cash)}
      </div>

      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xl font-bold">Últimas ventas</h2>
          <button onclick="navegar('mis-ventas')" class="text-sm font-semibold text-blue-500 hover:underline">Ver todas</button>
        </div>
        <div class="space-y-3">
          ${ultimas.length ? ultimas.map(v => ventaCard(v)).join('') : '<div class="glass-card p-6 text-center text-slate-500">Aún no tienes ventas registradas.</div>'}
        </div>
      </div>
    </div>
  `;
  bindVentaCards();
};

VendedorViews['nueva-venta'] = async (view) => {
  const info = await apiGet('/api/ventas/canales');
  view.innerHTML = `
    <div class="max-w-2xl mx-auto animate-spring">
      <div class="glass-card p-6 lg:p-8">
        <h2 class="text-2xl font-bold mb-1">Registrar nueva venta</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">
          La comisión es del ${(info.comision_porcentaje * 100).toFixed(0)}% del monto neto. Adjunta evidencias obligatorias.
        </p>

        <form id="formVenta" class="space-y-5">
          <div>
            <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Canal de venta</label>
            <select name="canal" required class="input-ios">
              <option value="">Selecciona un canal…</option>
              ${info.canales.map(c => `<option value="${c}">${CanalIcono[c] || ''} ${c} · madura ${info.dias_maduracion[c]} días</option>`).join('')}
            </select>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">N° de orden</label>
              <input name="n_orden" required class="input-ios" placeholder="Ej: ML-12345">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Monto neto ($)</label>
              <input name="monto_neto" type="number" step="0.01" min="0.01" required class="input-ios" placeholder="0.00">
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Producto(s)</label>
            <input name="producto" required class="input-ios" placeholder="Ej: Taladro Bosch 500W + brocas">
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Foto del comprobante</label>
              <input type="file" name="foto_comprobante" accept="image/*,.pdf" required
                class="block w-full text-sm text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-blue-500/10 file:text-blue-600 dark:file:text-blue-400 file:font-semibold hover:file:bg-blue-500/20 cursor-pointer">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Evidencia de tu aporte</label>
              <input type="file" name="evidencia_aporte" accept="image/*,.pdf" required
                class="block w-full text-sm text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-violet-500/10 file:text-violet-600 dark:file:text-violet-400 file:font-semibold hover:file:bg-violet-500/20 cursor-pointer">
            </div>
          </div>

          <div class="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 text-sm text-slate-600 dark:text-slate-300">
            💡 La venta quedará en <strong>pendiente de revisión</strong> hasta que el administrador la apruebe.
            La comisión se calcula y madura según el canal.
          </div>

          <button type="submit" class="btn-primary w-full">Registrar venta</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('formVenta').onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Enviando…';
    try {
      const fd = new FormData(e.target);
      const res = await apiPostForm('/api/ventas', fd);
      toast('Venta registrada: ' + res.venta.codigo, 'success');
      navegar('mis-ventas');
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false; btn.textContent = 'Registrar venta';
    }
  };
};

VendedorViews['mis-ventas'] = async (view) => {
  const ventas = await apiGet('/api/ventas/mis-ventas');
  view.innerHTML = `
    <div class="animate-spring space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 class="text-2xl font-bold">Mis ventas</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400">${ventas.length} venta(s) en total</p>
        </div>
        <button onclick="navegar('nueva-venta')" class="btn-primary">
          + Nueva venta
        </button>
      </div>

      <div class="glass-card p-3 flex flex-wrap gap-2">
        <select id="filtroEstado" class="input-ios !w-auto text-sm">
          <option value="">Todos los estados</option>
          <option value="pendiente_revision">Pendiente revisión</option>
          <option value="aprobada">Aprobada</option>
          <option value="en_maduracion">En maduración</option>
          <option value="pagada">Pagada</option>
          <option value="rechazada">Rechazada</option>
        </select>
        <select id="filtroCanal" class="input-ios !w-auto text-sm">
          <option value="">Todos los canales</option>
          <option>Mercado Libre</option><option>Facebook</option>
          <option>WhatsApp</option><option>Tienda local</option>
        </select>
      </div>

      <div id="listaVentas" class="space-y-3">
        ${ventas.length ? ventas.map(v => ventaCard(v)).join('') : '<div class="glass-card p-8 text-center text-slate-500">No hay ventas registradas aún.</div>'}
      </div>
    </div>
  `;

  const aplicarFiltros = () => {
    const est = document.getElementById('filtroEstado').value;
    const can = document.getElementById('filtroCanal').value;
    const lista = ventas.filter(v => (!est || v.estado === est) && (!can || v.canal === can));
    document.getElementById('listaVentas').innerHTML = lista.length
      ? lista.map(v => ventaCard(v)).join('')
      : '<div class="glass-card p-8 text-center text-slate-500">Sin resultados.</div>';
    bindVentaCards();
  };
  document.getElementById('filtroEstado').onchange = aplicarFiltros;
  document.getElementById('filtroCanal').onchange = aplicarFiltros;
  bindVentaCards();
};

VendedorViews['mis-disputas'] = async (view) => {
  const disputas = await apiGet('/api/disputas/mis-disputas');
  view.innerHTML = `
    <div class="animate-spring space-y-4">
      <div>
        <h2 class="text-2xl font-bold">Mis disputas</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">Reclamos sobre ventas rechazadas o mal calculadas</p>
      </div>
      <div id="listaDisputas" class="space-y-3">
        ${disputas.length ? disputas.map(d => `
          <div class="glass-card p-5">
            <div class="flex items-start justify-between gap-3 mb-2">
              <div>
                <div class="font-mono text-sm font-semibold text-blue-500">${d.codigo_venta}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400">${fmtFechaHora(d.fecha)}</div>
              </div>
              <span class="pill ${d.estado === 'abierta' ? 'pill-orange' : 'pill-green'}">${d.estado}</span>
            </div>
            <div class="text-sm"><strong>Motivo:</strong> ${d.motivo}</div>
            ${d.resolucion ? `<div class="mt-2 text-sm text-green-600 dark:text-green-400"><strong>Resolución:</strong> ${d.resolucion}</div>` : ''}
          </div>
        `).join('') : '<div class="glass-card p-8 text-center text-slate-500">No tienes disputas.</div>'}
      </div>
    </div>
  `;
};

function kpiCard(label, value, color, icon) {
  const colors = {
    blue:   'text-blue-500 bg-blue-500/10',
    violet: 'text-violet-500 bg-violet-500/10',
    green:  'text-green-500 bg-green-500/10',
    gray:   'text-slate-500 bg-slate-500/10'
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

function ventaCard(v) {
  return `
    <div class="glass-card venta-card p-5" data-codigo="${v.codigo}">
      <div class="flex items-start justify-between gap-3 mb-3">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-lg">${CanalIcono[v.canal] || '📦'}</span>
            <span class="font-mono text-xs font-semibold text-blue-500">${v.codigo}</span>
          </div>
          <div class="font-semibold truncate">${v.producto}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400">${v.canal} · Orden ${v.n_orden}</div>
        </div>
        ${pillEstado(v.estado)}
      </div>
      <div class="flex items-center justify-between pt-3 border-t border-slate-300/30 dark:border-slate-700/30">
        <div>
          <div class="text-xs text-slate-500 dark:text-slate-400">Monto neto</div>
          <div class="font-semibold">${fmtMoney(v.monto_neto)}</div>
        </div>
        <div class="text-right">
          <div class="text-xs text-slate-500 dark:text-slate-400">Comisión</div>
          <div class="font-bold text-green-600 dark:text-green-400">${fmtMoney(v.comision)}</div>
        </div>
      </div>
      <div class="text-xs text-slate-400 dark:text-slate-500 mt-2">${fmtFecha(v.fecha_registro)}</div>
    </div>
  `;
}

function bindVentaCards() {
  document.querySelectorAll('.venta-card').forEach(card => {
    card.onclick = () => verDetalleVenta(card.dataset.codigo);
  });
}

async function verDetalleVenta(codigo) {
  const v = await apiGet('/api/ventas/' + codigo);
  const puedeDisputar = USUARIO.rol === 'vendedor' && v.id_vendedor === USUARIO.id && v.estado !== 'pagada';
  abrirSheet(`
    <div class="pt-2">
      <div class="flex items-center gap-2 mb-1">
        <span class="text-2xl">${CanalIcono[v.canal] || '📦'}</span>
        <span class="font-mono text-sm font-semibold text-blue-500">${v.codigo}</span>
      </div>
      <h3 class="text-2xl font-bold mb-1">${v.producto}</h3>
      <div class="text-sm text-slate-500 dark:text-slate-400 mb-4">${v.canal} · Orden ${v.n_orden}</div>
      <div class="flex gap-2 mb-5">${pillEstado(v.estado)}</div>

      <div class="grid grid-cols-2 gap-3 mb-5">
        <div class="bg-slate-500/5 rounded-2xl p-3">
          <div class="text-xs text-slate-500">Monto neto</div>
          <div class="text-lg font-bold">${fmtMoney(v.monto_neto)}</div>
        </div>
        <div class="bg-green-500/5 rounded-2xl p-3">
          <div class="text-xs text-slate-500">Comisión (5%)</div>
          <div class="text-lg font-bold text-green-600 dark:text-green-400">${fmtMoney(v.comision)}</div>
        </div>
      </div>

      <div class="space-y-2 text-sm mb-5">
        <div class="flex justify-between"><span class="text-slate-500">Registrada:</span><span>${fmtFechaHora(v.fecha_registro)}</span></div>
        ${v.fecha_maduracion ? `<div class="flex justify-between"><span class="text-slate-500">Madura:</span><span>${fmtFecha(v.fecha_maduracion)}</span></div>` : ''}
        ${v.fecha_pago ? `<div class="flex justify-between"><span class="text-slate-500">Pagada:</span><span>${fmtFecha(v.fecha_pago)}</span></div>` : ''}
        ${v.vendedor_nombre ? `<div class="flex justify-between"><span class="text-slate-500">Vendedor:</span><span>${v.vendedor_nombre}</span></div>` : ''}
      </div>

      ${v.motivo_rechazo ? `
        <div class="bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl p-3 text-sm mb-5">
          <strong>Motivo:</strong> ${v.motivo_rechazo}
        </div>` : ''}

      ${v.foto_comprobante ? `
        <div class="mb-2">
          <div class="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Comprobante</div>
          <a href="/uploads/${v.foto_comprobante}" target="_blank">
            <img src="/uploads/${v.foto_comprobante}" class="w-full rounded-2xl border border-slate-300/30 dark:border-slate-700/30">
          </a>
        </div>` : ''}
      ${v.evidencia_aporte ? `
        <div class="mb-5">
          <div class="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Evidencia de aporte</div>
          <a href="/uploads/${v.evidencia_aporte}" target="_blank">
            <img src="/uploads/${v.evidencia_aporte}" class="w-full rounded-2xl border border-slate-300/30 dark:border-slate-700/30">
          </a>
        </div>` : ''}

      ${puedeDisputar ? `
        <button onclick="abrirDisputa('${v.codigo}')" class="btn-secondary w-full">Abrir disputa</button>
      ` : ''}
    </div>
  `);
}

function abrirDisputa(codigoVenta) {
  abrirSheet(`
    <h3 class="text-xl font-bold mb-1">Abrir disputa</h3>
    <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Venta ${codigoVenta}</p>
    <textarea id="motivoDisputa" rows="4" class="input-ios mb-4" placeholder="Explica el motivo del reclamo..."></textarea>
    <button id="btnEnviarDisputa" class="btn-primary w-full">Enviar disputa</button>
  `);
  document.getElementById('btnEnviarDisputa').onclick = async () => {
    const motivo = document.getElementById('motivoDisputa').value.trim();
    if (!motivo) return toast('Escribe el motivo', 'error');
    try {
      await apiPost('/api/disputas', { codigo_venta: codigoVenta, motivo });
      toast('Disputa abierta', 'success');
      cerrarSheet();
      navegar(RUTA_ACTUAL);
    } catch (e) { toast(e.message, 'error'); }
  };
}

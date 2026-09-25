/* ============================================================
   Cliente API: wrappers de fetch con manejo de errores
   ============================================================ */

async function apiGet(url) {
  const r = await fetch(url, { credentials: 'include' });
  if (r.status === 401) { location.href = '/login'; return; }
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Error de red');
  return data;
}

async function apiPost(url, body) {
  const r = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  });
  if (r.status === 401) { location.href = '/login'; return; }
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Error de red');
  return data;
}

async function apiPostForm(url, formData) {
  const r = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    body: formData
  });
  if (r.status === 401) { location.href = '/login'; return; }
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Error de red');
  return data;
}

async function apiLogout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  location.href = '/login';
}

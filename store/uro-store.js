/* ============================================================
   UroCloud — server-backed central database.
   Drop-in replacement for the original Firebase sync module.
   Talks to this app's own backend at /api/data, which persists
   everything to a real SQLite database (see ../../server.js).

   Implements the same window.UroCloud interface the app expects:
   getConfig / connect / push / disconnect / onStatus / onData / isLive.
============================================================ */
(function () {
  const API = '/api/data';
  const POLL_MS = 4000;   // pick up changes other devices made

  let live = false;
  let lastJson = null;    // last dataset seen/sent — breaks sync loops
  let pollTimer = null;
  let pushTimer = null;

  const listeners = { status: [], data: [] };
  function emit(type, payload) {
    (listeners[type] || []).forEach(fn => { try { fn(payload); } catch (e) {} });
  }

  function normalize(d) {
    return {
      items: d.items || [], txns: d.txns || [],
      equipment: d.equipment || [], po: d.po || [],
    };
  }
  function isEmpty(d) {
    return (!d.items || !d.items.length)
        && (!d.txns || !d.txns.length)
        && (!d.equipment || !d.equipment.length)
        && (!d.po || !d.po.length);
  }

  async function fetchData() {
    const r = await fetch(API, { headers: { 'cache-control': 'no-cache' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  async function connect() {
    emit('status', { state: 'connecting' });
    try {
      const d = await fetchData();
      live = true;
      if (isEmpty(d)) {
        // Brand-new database — let the app seed it with its current data.
        emit('status', { state: 'live', empty: true });
      } else {
        const data = normalize(d);
        lastJson = JSON.stringify(data);
        emit('status', { state: 'live', by: d._by || '', at: d._updatedAt || 0 });
        emit('data', data);
      }
      startPolling();
      return true;
    } catch (e) {
      live = false;
      emit('status', { state: 'error', message: e.message });
      return false;
    }
  }

  function startPolling() {
    clearInterval(pollTimer);
    pollTimer = setInterval(async () => {
      if (!live) return;
      try {
        const d = await fetchData();
        if (isEmpty(d)) return;          // never broadcast emptiness (avoids seed race)
        const data = normalize(d);
        const json = JSON.stringify(data);
        if (json !== lastJson) {         // a real remote change
          lastJson = json;
          emit('status', { state: 'live', by: d._by || '', at: d._updatedAt || 0 });
          emit('data', data);
        }
      } catch (e) {
        emit('status', { state: 'error', message: e.message });
      }
    }, POLL_MS);
  }

  // Debounced whole-dataset write. Skips if identical to what we last saw.
  function push(data) {
    const payload = normalize(data);
    const json = JSON.stringify(payload);
    if (json === lastJson) return;
    lastJson = json;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      fetch(API, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(Object.assign({}, payload, {
          _by: data.by || '', _updatedAt: Date.now(),
        })),
      })
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); })
        .catch(err => emit('status', { state: 'error', message: err.message }));
    }, 400);
  }

  function disconnect() {
    live = false;
    clearInterval(pollTimer);
    emit('status', { state: 'off' });
  }

  window.UroCloud = {
    // Truthy config => the app auto-connects to the central DB on load.
    getConfig: () => ({ server: true }),
    saveConfig: () => {},
    clearConfig: () => {},
    parseConfig: (t) => (t ? { server: true } : null),
    connect, disconnect, push,
    onStatus(fn) { listeners.status.push(fn); },
    onData(fn) { listeners.data.push(fn); },
    isLive: () => live,
  };
})();

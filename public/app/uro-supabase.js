/* ============================================================
   Supabase-backed auth + central database
   ------------------------------------------------------------
   Replaces the local Node/SQLite store for the deployed app.

   Exposes:
     window.UroAuth  — sign up / sign in / sign out / session
     window.UroCloud — same data-sync interface main.jsx already uses
                       (connect / push / onStatus / onData / isLive),
                       backed by one jsonb row in Postgres with RLS.

   With no Supabase config it stays inert and the login screen shows a
   friendly "not configured yet" message.
============================================================ */
(function () {
  const URL_ = window.SUPABASE_URL;
  const KEY = window.SUPABASE_ANON_KEY;
  const configured = !!(URL_ && KEY && !/^YOUR_/.test(URL_) && !/^YOUR_/.test(KEY));

  let client = null;
  if (configured && window.supabase && typeof window.supabase.createClient === 'function') {
    client = window.supabase.createClient(URL_, KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }

  /* ---------------- local auth (credentials from config.js) ---------------- */
  const UroAuth = {
    configured: !!(window.URO_USERS && window.URO_USERS.length),
    async getUser() {
      try {
        const s = sessionStorage.getItem('uro_session');
        return s ? JSON.parse(s) : null;
      } catch { return null; }
    },
    onChange(fn) { /* session-based — no realtime push */ },
    async signIn(username, password) {
      const users = window.URO_USERS || [];
      const found = users.find(u =>
        u.username.toLowerCase() === String(username).toLowerCase() && u.password === password
      );
      if (!found) throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      const profile = {
        id: found.username,
        name: found.name,
        role: found.role,
        initials: (found.name[0] || '?').toUpperCase(),
      };
      sessionStorage.setItem('uro_session', JSON.stringify(profile));
      return profile;
    },
    async signOut() {
      sessionStorage.removeItem('uro_session');
    },
  };

  /* ---------------- data sync ---------------- */
  const ROW_ID = 1;
  let live = false, lastJson = null, pushTimer = null, channel = null;
  const dataL = [], statusL = [];
  function emit(type, payload) {
    (type === 'data' ? dataL : statusL).forEach(fn => { try { fn(payload); } catch (e) {} });
  }
  function normalize(d) {
    d = d || {};
    return { items: d.items || [], txns: d.txns || [], equipment: d.equipment || [], po: d.po || [] };
  }
  function isEmpty(d) {
    return !d.items.length && !d.txns.length && !d.equipment.length && !d.po.length;
  }

  async function connect() {
    if (!client) { emit('status', { state: 'error', message: 'ยังไม่ได้ตั้งค่า Supabase' }); return false; }
    emit('status', { state: 'connecting' });
    try {
      const { data, error } = await client
        .from('uro_data').select('data, updated_by').eq('id', ROW_ID).maybeSingle();
      if (error) throw error;
      live = true;
      const d = normalize(data && data.data);
      if (isEmpty(d)) {
        emit('status', { state: 'live', empty: true });   // let the app seed it
      } else {
        lastJson = JSON.stringify(d);
        emit('status', { state: 'live', by: (data && data.updated_by) || '' });
        emit('data', d);
      }
      subscribe();
      return true;
    } catch (e) {
      live = false;
      emit('status', { state: 'error', message: e.message || String(e) });
      return false;
    }
  }

  function subscribe() {
    if (!client || channel) return;
    try {
      channel = client.channel('uro_data_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'uro_data' }, payload => {
          const d = normalize(payload.new && payload.new.data);
          if (isEmpty(d)) return;
          const json = JSON.stringify(d);
          if (json !== lastJson) {
            lastJson = json;
            emit('status', { state: 'live', by: (payload.new && payload.new.updated_by) || '' });
            emit('data', d);
          }
        })
        .subscribe();
    } catch (e) { /* realtime optional — push/pull still works */ }
  }

  function push(dataObj) {
    if (!client || !live) return;
    const payload = normalize(dataObj);
    const json = JSON.stringify(payload);
    if (json === lastJson) return;
    lastJson = json;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(async () => {
      try {
        const { error } = await client.from('uro_data')
          .update({ data: payload, updated_by: dataObj.by || '', updated_at: new Date().toISOString() })
          .eq('id', ROW_ID);
        if (error) throw error;
      } catch (e) {
        emit('status', { state: 'error', message: e.message || String(e) });
      }
    }, 400);
  }

  function disconnect() {
    live = false; lastJson = null;
    if (channel) { try { client.removeChannel(channel); } catch (e) {} channel = null; }
    emit('status', { state: 'off' });
  }

  window.UroAuth = UroAuth;
  window.UroCloud = {
    getConfig: () => (client ? { supabase: true } : null),
    saveConfig() {}, clearConfig() {}, parseConfig(t) { return t ? { supabase: true } : null; },
    connect, disconnect, push,
    onStatus(fn) { statusL.push(fn); },
    onData(fn) { dataL.push(fn); },
    isLive: () => live,
  };
})();

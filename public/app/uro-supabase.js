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

  /* ---------------- auth ---------------- */
  function initialsOf(s) {
    s = String(s || '').trim();
    if (!s) return 'U';
    const p = s.split(/[\s@._-]+/).filter(Boolean);
    const r = ((p[0] && p[0][0]) || '') + ((p[1] && p[1][0]) || '');
    return (r || s[0]).toUpperCase();
  }
  function mapUser(u) {
    if (!u) return null;
    const name = (u.user_metadata && u.user_metadata.name) || u.email || 'ผู้ใช้';
    return { id: u.id, email: u.email, name, role: 'ผู้ใช้', initials: initialsOf(name) };
  }

  const UroAuth = {
    configured: !!client,
    async getUser() {
      if (!client) return null;
      const { data } = await client.auth.getSession();
      return data.session ? mapUser(data.session.user) : null;
    },
    onChange(fn) {
      if (!client) return;
      client.auth.onAuthStateChange((_event, session) => {
        fn(session ? mapUser(session.user) : null);
      });
    },
    async signIn(email, password) {
      if (!client) throw new Error('ยังไม่ได้ตั้งค่า Supabase (แก้ไฟล์ app/config.js)');
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw new Error(translateAuthError(error.message));
      return mapUser(data.user);
    },
    async signUp(email, password, name) {
      if (!client) throw new Error('ยังไม่ได้ตั้งค่า Supabase (แก้ไฟล์ app/config.js)');
      const { data, error } = await client.auth.signUp({
        email, password, options: { data: { name: name || email } },
      });
      if (error) throw new Error(translateAuthError(error.message));
      // If email confirmation is OFF, a session is returned and the user is logged in.
      return { user: data.user ? mapUser(data.user) : null, needsConfirm: !data.session };
    },
    async signOut() { if (client) await client.auth.signOut(); },
  };

  function translateAuthError(msg) {
    msg = String(msg || '');
    if (/Invalid login credentials/i.test(msg)) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
    if (/already registered|already exists/i.test(msg)) return 'อีเมลนี้ถูกใช้สมัครแล้ว';
    if (/Password should be at least/i.test(msg)) return 'รหัสผ่านสั้นเกินไป (อย่างน้อย 6 ตัวอักษร)';
    if (/Email not confirmed/i.test(msg)) return 'ยังไม่ได้ยืนยันอีเมล — ตรวจสอบกล่องจดหมาย';
    if (/valid email|invalid format/i.test(msg)) return 'รูปแบบอีเมลไม่ถูกต้อง';
    return msg;
  }

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

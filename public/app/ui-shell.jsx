/* Shared components — sidebar, header, stat cards, chart, etc. */
const { useState, useEffect, useMemo, useRef } = React;

/* ---------- helpers ---------- */
function cx(...xs) { return xs.filter(Boolean).join(' '); }
function fmt(n) { return n.toLocaleString('en-US'); }
function statusOf(item) {
  if (item.qty <= 0) return 'out';
  if (item.qty < item.min) return 'low';
  if (item.qty < item.min * 1.4) return 'warn';
  return 'ok';
}
const STATUS_TEXT = { ok: 'ปกติ', warn: 'ใกล้ขั้นต่ำ', low: 'ใกล้หมด', out: 'หมด' };

/* ---------- Logo mark ---------- */
function LogoMark({ size = 36 }) {
  // Original mark — abstract "U" with a counting tick. Not a brand logo.
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="44" height="44" rx="12" fill="var(--accent)"/>
      <path d="M16 14 V28 a8 8 0 0 0 16 0 V14" stroke="white" strokeWidth="3.2" strokeLinecap="round" fill="none"/>
      <circle cx="34" cy="14" r="3.2" fill="white"/>
    </svg>
  );
}

/* ---------- Icons (24px, stroked) ---------- */
const I = {
  dash:   <path d="M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6ZM13 3v6h8V3h-8Z"/>,
  box:    <path d="M3 7l9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7M12 11v10"/>,
  in:     <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"/>,
  out:    <path d="M12 21V9m0 0l-4 4m4-4l4 4M4 3h16"/>,
  rep:    <path d="M4 4h12l4 4v12H4zM16 4v4h4M8 13h8M8 17h6M8 9h4"/>,
  cat:    <path d="M3 7h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 17h7v4H3z"/>,
  user:   <path d="M12 12a4 4 0 100-8 4 4 0 000 8Zm-8 9a8 8 0 0116 0"/>,
  bell:   <path d="M6 16V11a6 6 0 1112 0v5l2 2H4l2-2Zm4 4a2 2 0 004 0"/>,
  menu:   <path d="M3 6h18M3 12h18M3 18h18"/>,
  search: <path d="M11 19a8 8 0 100-16 8 8 0 000 16Zm6-2l4 4"/>,
  plus:   <path d="M12 5v14M5 12h14"/>,
  minus:  <path d="M5 12h14"/>,
  qr:     <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14v3M14 20h3v1M20 20v1"/>,
  filter: <path d="M4 5h16l-6 8v6l-4 2v-8L4 5Z"/>,
  cal:    <path d="M3 6h18v15H3zM3 10h18M8 3v4M16 3v4"/>,
  chev:   <path d="M9 6l6 6-6 6"/>,
  close:  <path d="M6 6l12 12M18 6L6 18"/>,
  dot:    <circle cx="12" cy="12" r="3"/>,
  alert:  <path d="M12 3l10 18H2L12 3Zm0 7v5m0 3v.5"/>,
  check:  <path d="M5 12l4 4 10-10"/>,
  edit:   <path d="M4 20h4l10-10-4-4L4 16v4ZM14 6l4 4"/>,
  trash:  <path d="M4 7h16M9 7V4h6v3m-8 0l1 13h10l1-13"/>,
  refresh:<path d="M4 12a8 8 0 0114-5l2-2v6h-6l2-2A6 6 0 006 12M20 12a8 8 0 01-14 5l-2 2v-6h6l-2 2a6 6 0 0014-3"/>,
  download:<path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"/>,
  upload: <path d="M12 21V9m0 0l-4 4m4-4l4 4M4 3h16"/>,
  scan:   <path d="M4 8V4h4M16 4h4v4M4 16v4h4M16 20h4v-4M3 12h18"/>,
  gear:   <path d="M12 9a3 3 0 100 6 3 3 0 000-6Zm8 3l2-1-2-3-2 1a8 8 0 00-2-1V5l-3-1-1 2-3 0-1-2-3 1v2a8 8 0 00-2 1l-2-1-2 3 2 1a8 8 0 000 2l-2 1 2 3 2-1a8 8 0 002 1v2l3 1 1-2 3 0 1 2 3-1v-2a8 8 0 002-1l2 1 2-3-2-1a8 8 0 000-2Z"/>,
  truck:  <path d="M3 7h11v9H3zM14 11h4l3 3v2h-7zM7 19a2 2 0 100-4 2 2 0 000 4Zm10 0a2 2 0 100-4 2 2 0 000 4Z"/>,
  clock:  <path d="M12 21a9 9 0 100-18 9 9 0 000 18Zm0-13v5l3 2"/>,
  sheet:  <path d="M4 4h16v16H4zM4 9h16M4 14h16M9 4v16M15 4v16"/>,
  shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z"/>,
  pkg:    <path d="M12 3l9 5v8l-9 5-9-5V8l9-5Zm0 0v18M21 8l-9 5-9-5"/>,
  phone:  <path d="M5 4h4l2 5-3 2a12 12 0 005 5l2-3 5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2Z"/>,
  building:<path d="M4 21V5a2 2 0 012-2h8a2 2 0 012 2v16M4 21h16M9 7h2M9 11h2M9 15h2M16 11h2v10"/>,
  logout: <path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 17l-5-5 5-5M5 12h12"/>,
  lock:   <path d="M6 11h12v9H6zM9 11V8a3 3 0 016 0v3M12 15v2"/>,
  cloud:  <path d="M6 18a4 4 0 010-8 5 5 0 019.6-1.3A3.5 3.5 0 0118 18H6Z"/>,
  cloudoff: <path d="M3 3l18 18M6 18a4 4 0 01-.9-7.9M9 5.6A5 5 0 0115.6 8.7 3.5 3.5 0 0118.9 14M9 18h8"/>,
};
function Icon({ k, size = 18, stroke = 1.8, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
         className={className} aria-hidden="true">{I[k]}</svg>
  );
}

/* ---------- Sidebar ---------- */
const NAV = [
  { id: 'dashboard', label: 'แดชบอร์ด',     icon: 'dash' },
  { id: 'items',     label: 'พัสดุ',          icon: 'box'  },
  { id: 'equipment', label: 'ครุภัณฑ์',       icon: 'gear' },
  { id: 'stockout',  label: 'รายการใช้/ตัดสต๊อก', icon: 'out'  },
  { id: 'stockin',   label: 'รับเข้า',         icon: 'in'   },
  { id: 'remaining', label: 'พัสดุคงเหลือ',    icon: 'alert'},
  { id: 'po',        label: 'ติดตาม OD',       icon: 'truck'},
  { id: 'reports',   label: 'รายงาน',          icon: 'rep'  },
];

function Sidebar({ active, onNav, open, onClose, collapsed, user, onLogout }) {
  return (
    <>
      {open && <div className="scrim" onClick={onClose}/>}
      <aside className={cx('sidebar', open && 'is-open', collapsed && 'is-collapsed')}>
        <div className="sb-brand">
          <LogoMark size={collapsed ? 32 : 38}/>
          {!collapsed && (
            <div className="sb-brand-text">
              <div className="sb-brand-1">Uro All Around</div>
              <div className="sb-brand-2">ระบบจัดการพัสดุ · แผนกผ่าตัด Uro</div>
            </div>
          )}
          <button className="sb-close" onClick={onClose} aria-label="ปิดเมนู"><Icon k="close" size={20}/></button>
        </div>

        <div className="sb-user">
          <div className="sb-avatar">{user?.initials || 'ปย'}</div>
          {!collapsed && (
            <div className="sb-user-text">
              <div className="sb-user-name">{user?.name || 'พว. ปิยะพงษ์'}</div>
              <div className="sb-user-role">{user?.role || 'Admin'}</div>
            </div>
          )}
        </div>

        <nav className="sb-nav">
          {NAV.map(n => (
            <button key={n.id}
              className={cx('sb-nav-item', active === n.id && 'is-active')}
              onClick={() => { onNav(n.id); onClose && onClose(); }}>
              <Icon k={n.icon} size={20}/>
              {!collapsed && <span>{n.label}</span>}
              {!collapsed && active === n.id && <span className="sb-active-bar" aria-hidden="true"/>}
            </button>
          ))}
        </nav>

        {!collapsed && (
          <div className="sb-footer">
            <button className="sb-logout" onClick={onLogout}>
              <Icon k="logout" size={18}/><span>ออกจากระบบ</span>
            </button>
            <div className="sb-foot-sub">เข้าสู่ระบบในฐานะ <b>{user?.name || 'พว. ปิยะพงษ์'}</b></div>
          </div>
        )}
      </aside>
    </>
  );
}

/* ---------- Topbar ---------- */
function Topbar({ onMenu, query, setQuery, onAddIn, onAddOut, user, onLogout, onSettings, cloud }) {
  const cs = cloud?.state || 'off';
  const cloudMeta = {
    live:       { cls:'is-live', dot:true,  label:'คลาวด์' },
    connecting: { cls:'is-wait', dot:true,  label:'กำลังเชื่อม…' },
    error:      { cls:'is-err',  dot:false, label:'คลาวด์ขัดข้อง' },
    off:        { cls:'is-off',  dot:false, label:'เฉพาะเครื่องนี้' },
  }[cs] || { cls:'is-off', dot:false, label:'เฉพาะเครื่องนี้' };
  return (
    <header className="topbar">
      <button className="tb-menu" onClick={onMenu} aria-label="เปิดเมนู"><Icon k="menu" size={22}/></button>

      <div className="tb-search">
        <Icon k="search" size={18}/>
        <input value={query} onChange={e => setQuery(e.target.value)}
               placeholder="ค้นหารหัส / ชื่อพัสดุ / ล็อต…"/>
        <button className="tb-scan" title="สแกน QR/Barcode"><Icon k="scan" size={18}/></button>
      </div>

      <div className="tb-actions">
        <button className="btn btn-ghost" onClick={onAddIn}><Icon k="in" size={16}/><span>รับเข้า</span></button>
        <button className="btn btn-primary" onClick={onAddOut}><Icon k="out" size={16}/><span>เบิกออก</span></button>
        <button className={cx('cloud-pill', cloudMeta.cls)} title="สถานะฐานข้อมูลกลาง — คลิกเพื่อตั้งค่า" onClick={onSettings}>
          {cloudMeta.dot ? <span className="cloud-dot"></span> : <Icon k={cs==='error'?'alert':'cloudoff'} size={14}/>}
          <span className="cloud-pill-t">{cloudMeta.label}</span>
        </button>
        <button className="tb-icon" title="ตั้งค่า / ข้อมูล" onClick={onSettings}><Icon k="gear" size={20}/></button>
        <button className="tb-icon" title="แจ้งเตือน">
          <Icon k="bell" size={20}/>
          <span className="tb-badge">4</span>
        </button>
        <div className="tb-user">
          <div className="tb-avatar">{user?.initials || 'ปย'}</div>
          <div className="tb-user-text">
            <div className="tb-user-name">{user?.name || 'พว. ปิยะพงษ์'}</div>
            <div className="tb-user-role">Admin</div>
          </div>
          <button className="tb-icon" title="ออกจากระบบ" onClick={onLogout}><Icon k="logout" size={18}/></button>
        </div>
      </div>
    </header>
  );
}

/* ---------- Stat card ---------- */
function StatCard({ tone = 'accent', big, label, sub, trend, icon }) {
  return (
    <div className={cx('stat', `stat-${tone}`)}>
      <div className="stat-top">
        <div className="stat-icon"><Icon k={icon} size={22}/></div>
        {trend && <div className="stat-trend">{trend}</div>}
      </div>
      <div className="stat-big">{big}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

/* ---------- Status pill ---------- */
function StatusPill({ s }) {
  return <span className={cx('pill', `pill-${s}`)}><span className="pill-dot"/>{STATUS_TEXT[s]}</span>;
}

/* ---------- Sparkline-bar chart (no library) ---------- */
function BurnChart({ data, cats }) {
  const totals = data.map(d => cats.reduce((s, c) => s + (d[c.id] || 0), 0));
  const max = Math.max(...totals, 1);
  return (
    <div className="chart">
      <div className="chart-grid">
        {[1, 0.75, 0.5, 0.25, 0].map((p, i) => (
          <div key={i} className="chart-grid-row">
            <span className="chart-yl">{Math.round(max * p)}</span>
            <span className="chart-gline"/>
          </div>
        ))}
      </div>
      <div className="chart-bars">
        {data.map((d, i) => {
          const total = totals[i];
          let acc = 0;
          return (
            <div key={i} className="chart-col">
              <div className="chart-stack" style={{ height: `${(total / max) * 100}%` }} title={`รวม ${total}`}>
                {cats.map(c => {
                  const v = d[c.id] || 0;
                  if (!v) return null;
                  const h = (v / total) * 100;
                  acc += h;
                  return (
                    <div key={c.id} className="chart-seg"
                         style={{ height: `${h}%`, background: `oklch(0.62 0.13 ${c.hue})` }}
                         title={`${c.name}: ${v}`}/>
                  );
                })}
              </div>
              <div className="chart-xl">{d.day}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Donut (category share) ---------- */
function Donut({ slices, size = 168, thickness = 22, centerLabel, centerSub }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bd)" strokeWidth={thickness}/>
        {slices.map((s, i) => {
          const len = (s.value / total) * c;
          const off = c - acc;
          acc += len;
          return (
            <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
                    stroke={s.color} strokeWidth={thickness}
                    strokeDasharray={`${len} ${c}`} strokeDashoffset={off}
                    transform={`rotate(-90 ${size/2} ${size/2})`}/>
          );
        })}
        <text x="50%" y="48%" textAnchor="middle" className="donut-center">{centerLabel}</text>
        <text x="50%" y="60%" textAnchor="middle" className="donut-center-sub">{centerSub}</text>
      </svg>
      <ul className="donut-legend">
        {slices.map((s, i) => (
          <li key={i}>
            <span className="dot" style={{ background: s.color }}/>
            <span className="lab">{s.label}</span>
            <span className="val">{fmt(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Toast ---------- */
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={cx('toast', `toast-${toast.tone || 'ok'}`)}>
      <Icon k={toast.tone === 'err' ? 'alert' : 'check'} size={18}/>
      <span>{toast.msg}</span>
    </div>
  );
}

/* ---------- Login screen (Supabase auth, sign-in only) ---------- */
function LoginScreen() {
  const [email, setEmail] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const hasAuth = typeof UroAuth !== 'undefined' && UroAuth.configured;

  function clearMsgs() { setErr(''); }

  async function submit(e) {
    if (e) e.preventDefault();
    clearMsgs();
    if (!hasAuth) { setErr('ยังไม่ได้ตั้งค่า Supabase — ดูไฟล์ app/config.js'); return; }
    if (!email.trim() || !p) { setErr('กรุณากรอกอีเมลและรหัสผ่าน'); return; }
    setBusy(true);
    try {
      await UroAuth.signIn(email.trim(), p);
      // onAuthStateChange drives the app into the dashboard
    } catch (e2) {
      setErr(e2.message || String(e2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-stage">
      <div className="login-aside">
        <div className="login-aside-top">
          <LogoMark size={46}/>
          <div>
            <div className="login-brand-1">Uro All Around</div>
            <div className="login-brand-2">ระบบจัดการพัสดุ แผนกผ่าตัด Uro</div>
          </div>
        </div>
        <div className="login-aside-mid">
          <h2>จัดการคลังพัสดุ<br/>ห้องผ่าตัดทั้งระบบ</h2>
          <ul className="login-feats">
            <li><Icon k="box" size={16}/>นับสต๊อก · แจ้งเตือนใกล้หมด/หมดอายุ</li>
            <li><Icon k="truck" size={16}/>ติดตามใบสั่งซื้อ (OD) แบบเรียลไทม์</li>
            <li><Icon k="rep" size={16}/>รายงานการเคลื่อนไหว · ทะเบียนครุภัณฑ์</li>
          </ul>
        </div>
        <div className="login-aside-foot">โรงพยาบาล · แผนกศัลยกรรมระบบทางเดินปัสสาวะ</div>
      </div>

      <div className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div className="login-mark-sm"><LogoMark size={40}/></div>
          <h1 className="login-title">เข้าสู่ระบบ</h1>
          <p className="login-sub">ลงชื่อเข้าใช้เพื่อจัดการพัสดุห้องผ่าตัด Uro</p>

          <label className="lbl">อีเมล
            <div className="input-wrap">
              <Icon k="user" size={16}/>
              <input type="email" value={email} onChange={e=>{setEmail(e.target.value); clearMsgs();}} placeholder="name@hospital.go.th" autoFocus/>
            </div>
          </label>
          <label className="lbl">รหัสผ่าน
            <div className="input-wrap">
              <Icon k="lock" size={16}/>
              <input type={show?'text':'password'} value={p} onChange={e=>{setP(e.target.value); clearMsgs();}} placeholder="รหัสผ่าน"/>
              <button type="button" className="login-eye" onClick={()=>setShow(s=>!s)}>{show?'ซ่อน':'แสดง'}</button>
            </div>
          </label>

          {err && <div className="login-err"><Icon k="alert" size={14}/>{err}</div>}

          <button type="submit" className="btn btn-primary lg login-btn" disabled={busy}>
            <Icon k="logout" size={16}/><span>{busy ? 'กำลังดำเนินการ…' : 'เข้าสู่ระบบ'}</span>
          </button>

          <p className="login-note" style={{marginTop:'12px', fontSize:'13px', color:'var(--ink-3)', textAlign:'center'}}>
            ติดต่อ Admin เพื่อสร้างบัญชี
          </p>
        </form>
        <div className="login-copy">Uro All Around · ระบบจัดการพัสดุห้องผ่าตัด</div>
      </div>
    </div>
  );
}

/* ---------- Cloud (central database) section ---------- */
function CloudSection({ cloud, onConnect, onDisconnect }) {
  const [cfg, setCfg] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const cs = cloud?.state || 'off';
  const live = cs === 'live';
  const meta = {
    live:       { cls:'ok',   txt:'เชื่อมต่อแล้ว · ข้อมูลซิงค์เรียลไทม์' },
    connecting: { cls:'wait', txt:'กำลังเชื่อมต่อ…' },
    error:      { cls:'err',  txt:'เชื่อมต่อไม่สำเร็จ — ' + (cloud?.message || 'ตรวจสอบ config') },
    off:        { cls:'off',  txt:'ยังไม่ได้เชื่อมต่อ — ข้อมูลเก็บในเครื่องนี้เท่านั้น' },
  }[cs] || { cls:'off', txt:'ยังไม่ได้เชื่อมต่อ' };

  return (
    <div className="set-group">
      <div className="set-group-t"><Icon k="cloud" size={16}/> ฐานข้อมูลกลาง (หลายคนใช้พร้อมกัน)</div>
      <div className={cx('cloud-status', meta.cls)}>
        <span className="cloud-status-dot"></span>
        <span>{meta.txt}</span>
      </div>

      {live ? (
        <div className="set-actions">
          <p className="set-note" style={{marginTop:0}}><Icon k="ok" size={13}/> เชื่อมต่อกับ Supabase — ทุกเครื่องที่ล็อกอินจะเห็นข้อมูลชุดเดียวกัน อัปเดตให้กันแบบเรียลไทม์</p>
          <button className="btn btn-danger" onClick={onDisconnect}><Icon k="cloudoff" size={15}/><span>ตัดการเชื่อมต่อ</span></button>
        </div>
      ) : (
        <div className="set-actions">
          <p className="set-note"><Icon k="alert" size={13}/> ยังไม่ได้ตั้งค่า Supabase — ดูไฟล์ <code>README.md</code> และ <code>public/app/config.js</code></p>
        </div>
      )}
    </div>
  );
}

/* ---------- Settings / Data modal ---------- */
function SettingsModal({ user, items, txns, equipment, cloud, onCloudConnect, onCloudDisconnect, onStartFresh, onRestoreSample, onImportData, onClose }) {
  const fileRef = useRef(null);

  function exportBackup() {
    const data = { version: 1, exportedAt: new Date().toISOString(), items, txns, equipment };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uro-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  function onPickFile(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || !Array.isArray(data.items)) throw new Error('bad');
        onImportData(data);
      } catch (err) {
        window.alert('ไฟล์ไม่ถูกต้อง — ต้องเป็นไฟล์สำรองข้อมูล (.json) ที่ส่งออกจากระบบนี้');
      }
    };
    reader.readAsText(f);
    e.target.value = '';
  }

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title"><Icon k="gear" size={20}/>ตั้งค่า · จัดการข้อมูล</div>
          <button className="tb-scan" onClick={onClose}><Icon k="close" size={20}/></button>
        </div>
        <div className="modal-body">
          {typeof CloudSection === 'function' && (
            <CloudSection cloud={cloud} onConnect={onCloudConnect} onDisconnect={onCloudDisconnect}/>
          )}
          <div className="set-group">
            <div className="set-group-t">ข้อมูลในระบบ</div>
            <div className="set-stats">
              <div><b>{items.length}</b><span>พัสดุ</span></div>
              <div><b>{txns.length}</b><span>ประวัติเคลื่อนไหว</span></div>
              <div><b>{equipment.length}</b><span>ครุภัณฑ์</span></div>
            </div>
            <p className="set-note"><Icon k="alert" size={13}/> แนะนำให้สำรองข้อมูลเก็บไว้เป็นระยะ แม้จะต่อคลาวด์ไว้แล้ว</p>
          </div>

          <div className="set-group">
            <div className="set-group-t"><Icon k="user" size={16}/> จัดการสมาชิก (Admin invite-only)</div>
            <p className="set-note"><Icon k="info" size={13}/> จัดการผู้ใช้ได้ที่ Supabase Dashboard → Authentication → Users</p>
            <p className="set-note" style={{marginTop:'8px'}}><b>วิธี:</b></p>
            <ol style={{marginLeft:'20px', fontSize:'13px', color:'var(--ink-3)', lineHeight:'1.6'}}>
              <li>Supabase Dashboard → <b>Authentication</b> → <b>Users</b></li>
              <li>คลิก <b>Invite user</b> → ใส่อีเมล → ส่งหรือสร้างรหัสผ่านเอง</li>
              <li>ผู้ใช้จะได้รับอีเมล (หรือสามารถล็อกอินได้ทันที)</li>
              <li>เพื่อลบ/รีเซ็ตรหัสผ่าน ให้ใช้ปุ่มเมนูในแต่ละแถว Users</li>
            </ol>
          </div>

          <div className="set-group">
            <div className="set-group-t">สำรอง / กู้คืนข้อมูล</div>
            <div className="set-actions">
              <button className="btn" onClick={exportBackup}><Icon k="rep" size={15}/><span>ส่งออกไฟล์สำรอง (.json)</span></button>
              <button className="btn" onClick={()=>fileRef.current && fileRef.current.click()}><Icon k="in" size={15}/><span>นำเข้าไฟล์สำรอง</span></button>
              <input ref={fileRef} type="file" accept="application/json,.json" style={{display:'none'}} onChange={onPickFile}/>
            </div>
          </div>

          <div className="set-group">
            <div className="set-group-t">เริ่มต้นใช้งานจริง</div>
            <p className="set-note">ลบข้อมูลตัวอย่างทั้งหมดเพื่อเริ่มกรอกพัสดุจริงจากศูนย์ หรือคืนค่าข้อมูลตัวอย่างเพื่อทดลองใช้</p>
            <div className="set-actions">
              <button className="btn btn-danger" onClick={onStartFresh}><Icon k="trash" size={15}/><span>ล้างข้อมูลตัวอย่าง · เริ่มกรอกจริง</span></button>
              <button className="btn" onClick={onRestoreSample}><Icon k="box" size={15}/><span>คืนค่าข้อมูลตัวอย่าง</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  cx, fmt, statusOf, STATUS_TEXT,
  Icon, LogoMark, Sidebar, Topbar, StatCard, StatusPill, BurnChart, Donut, Toast,
  NAV, LoginScreen, SettingsModal, CloudSection,
});

/* Main app — routing state, theme tweaks, mobile drawer */
const CONSUMABLE_KEYWORDS = [
  'dj stent','u-cath','flexible urs','trus bx','gw hydro','gw sensor','ตลับหมึก',
  'single-use digital flexible cystoscope','hemolock สีทอง','hemolock สีม่วง',
  'hemolock สีเขียว','port 10 mm','pcn set','ligasure laparoscope sealer',
  'tvt set','access sheath','port balloon','gw แข็ง','versaport v2',
  'polydiaxanone','polydioxanone',
];
function tagItemType(i) {
  if (i.type) return i;
  const n = (i.name || '').toLowerCase();
  return { ...i, type: CONSUMABLE_KEYWORDS.some(k => n.includes(k)) ? 'consumable' : 'main' };
}
const { useState: useState_, useEffect: useEffect_, useMemo: useMemo_, useRef: useRef_ } = React;

/* ---- persistence: keep real data in the browser between visits ---- */
const DATA_VERSION = 1;
function loadPersisted(key, fallback) {
  try {
    const raw = localStorage.getItem('uro_data_' + key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (e) { return fallback; }
}
function savePersisted(key, value) {
  try { localStorage.setItem('uro_data_' + key, JSON.stringify(value)); } catch (e) {}
}

/* ---- dashboard analytics: derived from real OUT transactions ---- */
const TH_DAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function parseTxnDate(s) {
  if (!s) return null;
  const d = new Date(String(s).slice(0, 10) + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

// Build the 7-day burndown, 12-month and 5-year trends from withdrawals (OUT).
// Value is qty × current unit price. Everything is zero until real data exists.
function computeAnalytics(txns, items, cats) {
  const priceByCode = {}, catByCode = {};
  (items || []).forEach(i => { priceByCode[i.code] = i.price || 0; catByCode[i.code] = i.cat; });
  const out = (txns || []).filter(t => t.type === 'OUT');

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = [];
  for (let k = 6; k >= 0; k--) {
    const d = new Date(today); d.setDate(today.getDate() - k);
    const row = { day: TH_DAYS[d.getDay()] };
    cats.forEach(c => { row[c.id] = 0; });
    days.push({ time: d.getTime(), row });
  }

  const monthMap = {}, yearMap = {};
  out.forEach(t => {
    const d = parseTxnDate(t.date); if (!d) return;
    const q = Math.abs(t.qty || 0);
    const val = q * (priceByCode[t.code] || 0);
    const dd = new Date(d); dd.setHours(0, 0, 0, 0);
    const slot = days.find(b => b.time === dd.getTime());
    const cat = catByCode[t.code];
    if (slot && cat) slot.row[cat] = (slot.row[cat] || 0) + q;
    const mk = d.getFullYear() + '-' + d.getMonth();
    (monthMap[mk] = monthMap[mk] || { total: 0, value: 0 });
    monthMap[mk].total += q; monthMap[mk].value += val;
    (yearMap[d.getFullYear()] = yearMap[d.getFullYear()] || { total: 0, value: 0 });
    yearMap[d.getFullYear()].total += q; yearMap[d.getFullYear()].value += val;
  });

  const now = new Date();
  const month = [];
  for (let k = 11; k >= 0; k--) {
    const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
    const e = monthMap[d.getFullYear() + '-' + d.getMonth()] || { total: 0, value: 0 };
    month.push({ label: TH_MONTHS[d.getMonth()] + String((d.getFullYear() + 543) % 100).padStart(2, '0'),
                 total: e.total, value: e.value });
  }
  const year = [];
  for (let k = 4; k >= 0; k--) {
    const y = now.getFullYear() - k;
    const e = yearMap[y] || { total: 0, value: 0 };
    year.push({ label: String(y + 543), total: e.total, value: e.value });
  }
  return { burn: days.map(b => b.row), month, year };
}

function App() {
  // Tweakable design tokens
  const TWEAKS = /*EDITMODE-BEGIN*/{
    "accent": "#0F3D6E",
    "sidebar": "dark",
    "density": "comfortable",
    "radius": 14
  }/*EDITMODE-END*/;

  const t = (typeof useTweaks === 'function') ? useTweaks(TWEAKS) : [TWEAKS, ()=>{}];
  const tweaks = t[0] || TWEAKS;
  const setTweak = t[1] || (()=>{});

  const [route, setRoute] = useState_('dashboard');
  const [user, setUser] = useState_(null);
  const [authChecked, setAuthChecked] = useState_(false);
  const [loginLoading, setLoginLoading] = useState_(false);
  const [loginError, setLoginError] = useState_('');
  const [query, setQuery] = useState_('');
  const [drawer, setDrawer] = useState_(false);
  // Start empty — no demo/mock data. Real data is entered by the user and
  // lives in the central database. (Use Settings → "คืนค่าข้อมูลตัวอย่าง"
  // to load the demo dataset on purpose.)
  const [items, setItems] = useState_(() => loadPersisted('items', []).map(tagItemType));
  const [txns, setTxns] = useState_(() => loadPersisted('txns', []));
  const [equipment, setEquipment] = useState_(() => loadPersisted('equipment', []));
  const [pos, setPos] = useState_(() => loadPersisted('po', []));
  const [vendors, setVendors] = useState_(() => {
    const saved = loadPersisted('vendors', null);
    if (saved !== null) return saved;
    // Seed from existing items on first load
    const storedItems = loadPersisted('items', []);
    const seen = new Map();
    storedItems.forEach(i => { if (i.supplier && !seen.has(i.supplier)) seen.set(i.supplier, i.tel || ''); });
    return Array.from(seen.entries()).map(([name, tel], idx) => ({ id: `V-seed-${idx}`, name, tel }));
  });
  const [prefillCode, setPrefillCode] = useState_('');
  const [toast, setToast] = useState_(null);
  const [settingsOpen, setSettingsOpen] = useState_(false);

  // ---- central database (Supabase) sync ----
  const hasCloud = typeof UroCloud !== 'undefined';
  const [cloud, setCloud] = useState_({ state: 'off' });
  const applyingRemote = useRef_(false);
  const dataRef = useRef_({ items, txns, equipment, po: pos, vendors, by: user?.name });
  useEffect_(() => { dataRef.current = { items, txns, equipment, po: pos, vendors, by: user?.name }; });

  // Persist real data whenever it changes
  useEffect_(() => { savePersisted('items', items); }, [items]);
  useEffect_(() => { savePersisted('txns', txns); }, [txns]);
  useEffect_(() => { savePersisted('equipment', equipment); }, [equipment]);
  useEffect_(() => { savePersisted('po', pos); }, [pos]);
  useEffect_(() => { savePersisted('vendors', vendors); }, [vendors]);

  // Session check + auth state listener
  useEffect_(() => {
    const auth = (typeof UroAuth !== 'undefined') ? UroAuth : null;
    if (!auth || !auth.configured) { setAuthChecked(true); return; }
    auth.getUser().then(u => { setUser(u || null); setAuthChecked(true); });
    auth.onChange(u => setUser(u || null));
  }, []);

  // Register the central-database listeners once, on mount
  useEffect_(() => {
    if (!hasCloud) return;
    UroCloud.onStatus(st => {
      setCloud(st);
      // First time the database is empty: seed it with current data
      if (st.state === 'live' && st.empty) UroCloud.push(dataRef.current);
    });
    UroCloud.onData(d => {
      applyingRemote.current = true;
      setItems((d.items || []).map(tagItemType));
      setTxns(d.txns || []);
      if (Array.isArray(d.equipment)) setEquipment(d.equipment);
      if (Array.isArray(d.po)) setPos(d.po);
      if (Array.isArray(d.vendors)) setVendors(d.vendors);
    });
  }, []);

  // Connect to the database only while signed in (RLS requires auth)
  useEffect_(() => {
    if (!hasCloud) return;
    if (user) { setCloud({ state: 'connecting' }); UroCloud.connect(); }
    else { UroCloud.disconnect(); }
  }, [user]);

  // Push local changes up to the cloud (unless the change came FROM the cloud)
  useEffect_(() => {
    if (!hasCloud || !UroCloud.isLive()) return;
    if (applyingRemote.current) { applyingRemote.current = false; return; }
    UroCloud.push({ items, txns, equipment, po: pos, vendors, by: user?.name });
  }, [items, txns, equipment, pos]);

  // Apply tokens to :root
  useEffect_(() => {
    const r = document.documentElement;
    r.style.setProperty('--accent', tweaks.accent);
    r.style.setProperty('--radius', tweaks.radius + 'px');
    r.dataset.sidebar = tweaks.sidebar;
    r.dataset.density = tweaks.density;
  }, [tweaks]);

  async function logout() {
    if (typeof UroAuth !== 'undefined') await UroAuth.signOut();
    setUser(null);
    setRoute('dashboard');
  }

  async function handleLogin(username, password) {
    setLoginLoading(true);
    setLoginError('');
    try {
      const u = await UroAuth.signIn(username, password);
      setUser(u);
    } catch(e) {
      setLoginError(e.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoginLoading(false);
    }
  }

  const canEdit = !!(user && user.role !== 'viewer');

  function showToast(msg, tone='ok') {
    setToast({ msg, tone });
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast(null), 2400);
  }

  function adjust(code, delta) {
    setItems(arr => arr.map(i => i.code === code ? { ...i, qty: Math.max(0, i.qty + delta) } : i));
    const it = items.find(i=>i.code===code);
    showToast(`ปรับสต๊อก ${it?.name || code} ${delta>0?'+':'−'}${Math.abs(delta)} ${it?.unit||''}`);
  }

  function go(r, prefill='') { setRoute(r); setPrefillCode(prefill); setDrawer(false); }

  // Wipe all data so real data can be entered from a clean slate
  function startFresh() {
    if (!window.confirm('ล้างข้อมูลทั้งหมด และเริ่มกรอกข้อมูลจริง?\n(ลบพัสดุ ประวัติการเคลื่อนไหว ครุภัณฑ์ และใบสั่งซื้อทั้งหมด)\n\nข้อมูลจะลบจากทั้ง Local + Cloud')) return;
    setItems([]); setTxns([]); setEquipment([]); setPos([]); setVendors([]);
    // Push empty data to Supabase
    if (hasCloud) UroCloud.push({ items: [], txns: [], equipment: [], po: [], vendors: [] });
    setSettingsOpen(false);
    showToast('ล้างข้อมูลแล้ว — เริ่มกรอกข้อมูลจริงได้เลย');
    setRoute('items');
  }
  // Restore the demo data set (optional — for trying the system out)
  function restoreSample() {
    if (!window.confirm('โหลดข้อมูลตัวอย่างทั้งหมด? ข้อมูลปัจจุบันจะถูกเขียนทับ')) return;
    setItems(URO_ITEMS.map(tagItemType)); setTxns(URO_TXNS); setEquipment(URO_EQUIPMENT); setPos(URO_PO);
    showToast('โหลดข้อมูลตัวอย่างแล้ว');
  }
  // Restore from a backup file
  function importData(data) {
    setItems((data.items || []).map(tagItemType));
    setTxns(data.txns || []);
    if (Array.isArray(data.equipment)) setEquipment(data.equipment);
    if (Array.isArray(data.po)) setPos(data.po);
    if (Array.isArray(data.vendors)) setVendors(data.vendors);
    setSettingsOpen(false);
    showToast('นำเข้าไฟล์สำรองข้อมูลเรียบร้อยแล้ว');
  }

  // Connect / disconnect the central database
  function cloudConnect(cfgText) {
    const cfg = UroCloud.parseConfig(cfgText);
    if (!cfg) { showToast('รูปแบบ config ไม่ถูกต้อง — วางค่าจาก Firebase ให้ครบ', 'err'); return; }
    UroCloud.saveConfig(cfg);
    UroCloud.connect(cfg);
    showToast('กำลังเชื่อมต่อฐานข้อมูลกลาง…');
  }
  function cloudDisconnect() {
    if (!window.confirm('ตัดการเชื่อมต่อฐานข้อมูลกลาง? เครื่องนี้จะกลับไปเก็บข้อมูลในเครื่องอย่างเดียว')) return;
    UroCloud.clearConfig();
    UroCloud.disconnect();
    showToast('ตัดการเชื่อมต่อฐานข้อมูลกลางแล้ว');
  }

  function commitBatch(kind, batch) {
    const sign = kind === 'IN' ? +1 : -1;
    setItems(arr => arr.map(i => {
      const b = batch.find(x => x.code === i.code);
      if (!b) return i;
      const next = { ...i, qty: Math.max(0, i.qty + sign*b.qty) };
      if (kind === 'IN') {
        if (b.od) next.lot = b.od;
        if (b.exp) next.exp = b.exp;
      }
      return next;
    }));
    const now = new Date();
    const ds = now.toISOString().slice(0,10) + ' ' + now.toTimeString().slice(0,5);
    const newTxns = batch.map((b, i) => ({
      id: `TX-${now.getFullYear().toString().slice(2)}${(now.getMonth()+1).toString().padStart(2,'0')}-${(Math.floor(Math.random()*900)+100)}`,
      date: ds,
      type: kind,
      code: b.code, name: b.name, qty: b.qty, unit: b.unit,
      by: b.by || user?.name || 'ผู้ใช้',
      note: kind === 'IN'
        ? ([b.od && `OD ${b.od}`, b.exp && `Exp ${b.exp}`].filter(Boolean).join(' · ') || '—')
        : (b.note || '—'),
    }));
    setTxns(arr => [...newTxns, ...arr]);
    showToast(`บันทึก${kind==='IN'?'รับเข้า':'เบิกออก'} ${batch.length} รายการเรียบร้อย`);
    setRoute('dashboard');
  }

  function addItem(d) {
    const it = { ...d, lot: d.lot||'—', exp: d.exp||'—' };
    setItems(arr => [it, ...arr]);
    showToast(`เพิ่ม "${d.name}" เข้าคลังแล้ว`);
  }
  function editItem(d) {
    setItems(arr => arr.map(i => i.code === d.code ? { ...i, ...d } : i));
    showToast(`แก้ไข "${d.name}" เรียบร้อย`);
  }
  function deleteItem(code) {
    setItems(arr => arr.filter(i => i.code !== code));
    showToast('ลบรายการออกจากคลังแล้ว');
  }
  function addVendor(v) {
    setVendors(arr => [...arr, v]);
  }

  function addEquipment(d) {
    setEquipment(arr => [{ ...d }, ...arr]);
    showToast(`เพิ่มครุภัณฑ์ "${d.name}" เรียบร้อย`);
  }
  function editEquipment(d) {
    setEquipment(arr => arr.map(e => e.eq_no === d.eq_no ? { ...e, ...d } : e));
    showToast(`แก้ไขครุภัณฑ์ "${d.name}" เรียบร้อย`);
  }
  function deleteEquipment(eq_no) {
    setEquipment(arr => arr.filter(e => e.eq_no !== eq_no));
    showToast('ลบครุภัณฑ์ออกจากทะเบียนแล้ว');
  }
  function handlePOReceive(odNo, receivedDate, lineItems, expDate) {
    setPos(arr => arr.map(p => p.od_no === odNo ? { ...p, status:'RECEIVED', received_date: receivedDate } : p));
    const batch = (lineItems || [])
      .filter(li => li.code && items.find(i => i.code === li.code))
      .map(li => {
        const it = items.find(i => i.code === li.code);
        return { code: li.code, name: li.name || it.name, qty: Number(li.qty)||1, unit: li.unit || it.unit, od: odNo, exp: expDate || '' };
      });
    if (batch.length > 0) {
      setItems(arr => arr.map(i => {
        const b = batch.find(x => x.code === i.code);
        if (!b) return i;
        const next = { ...i, qty: i.qty + b.qty, lot: odNo };
        if (b.exp) next.exp = b.exp;
        return next;
      }));
      const now = new Date();
      const ds = now.toISOString().slice(0,10) + ' ' + now.toTimeString().slice(0,5);
      const newTxns = batch.map(b => ({
        id: `TX-${now.getFullYear().toString().slice(2)}${(now.getMonth()+1).toString().padStart(2,'0')}-${(Math.floor(Math.random()*900)+100)}`,
        date: ds, type: 'IN', code: b.code, name: b.name, qty: b.qty, unit: b.unit,
        by: user?.name || 'ผู้ใช้',
        note: [b.exp && `Exp ${b.exp}`, `OD ${odNo}`, `รับของ ${receivedDate}`].filter(Boolean).join(' · '),
      }));
      setTxns(arr => [...newTxns, ...arr]);
      showToast(`รับของ OD ${odNo} · เติมสต๊อก ${batch.length} รายการแล้ว`);
    } else {
      showToast(`ยืนยันรับของ OD ${odNo} เรียบร้อย`);
    }
  }

  function importItems(rows) {
    setItems(arr => {
      const merged = [...arr];
      rows.forEach(r => {
        if (!r.code) return;
        const idx = merged.findIndex(m => m.code === r.code);
        const norm = { ...r, lot: r.lot || '—', exp: r.exp || '—' };
        if (idx >= 0) merged[idx] = { ...merged[idx], ...norm };
        else merged.unshift(norm);
      });
      return merged;
    });
    showToast(`นำเข้าจาก Google Sheet ${rows.length} รายการ`);
  }

  // Dashboard charts derived from real transactions (empty until data exists)
  const analytics = useMemo_(() => computeAnalytics(txns, items, URO_CATEGORIES), [txns, items]);

  const screen = (() => {
    switch (route) {
      case 'dashboard':
        return <Dashboard items={items} txns={txns}
                          burn={analytics.burn} month={analytics.month} year={analytics.year}
                          cats={URO_CATEGORIES}
                          onGo={go} onStockIn={c=>go('stockin',c)} onStockOut={c=>go('stockout',c)}/>;
      case 'items':
        return <ItemsScreen items={items} cats={URO_CATEGORIES} query={query} canEdit={canEdit}
                            onCount={adjust} onStockIn={c=>go('stockin',c)} onStockOut={c=>go('stockout',c)}
                            onAdd={addItem} onEdit={editItem} onDelete={deleteItem} onImport={importItems}
                            vendors={vendors} onAddVendor={addVendor}
                            typeFilter="main" pageLabel="พัสดุอุปกรณ์หลัก"/>;
      case 'consumables':
        return <ItemsScreen items={items} cats={URO_CATEGORIES} query={query} canEdit={canEdit}
                            onCount={adjust} onStockIn={c=>go('stockin',c)} onStockOut={c=>go('stockout',c)}
                            onAdd={addItem} onEdit={editItem} onDelete={deleteItem} onImport={importItems}
                            vendors={vendors} onAddVendor={addVendor}
                            typeFilter="consumable" pageLabel="พัสดุสิ้นเปลือง"/>;
      case 'equipment':
        return <EquipmentScreen equipment={equipment} canEdit={canEdit}
                            onAddEquipment={addEquipment} onEditEquipment={editEquipment} onDeleteEquipment={deleteEquipment}
                            vendors={vendors} onAddVendor={addVendor}/>;
      case 'remaining':
        return <RemainingScreen items={items} cats={URO_CATEGORIES} onStockIn={c=>go('stockin',c)}/>;
      case 'po':
        return <POScreen pos={pos} onChange={setPos} canEdit={canEdit} items={items} onReceive={handlePOReceive}/>;
      case 'stockin':
        return <StockMoveScreen kind="IN" items={items} cats={URO_CATEGORIES} user={user}
                                prefill={prefillCode} onSubmit={b=>commitBatch('IN', b)}/>;
      case 'stockout':
        return <StockMoveScreen kind="OUT" items={items} cats={URO_CATEGORIES} user={user}
                                prefill={prefillCode} onSubmit={b=>commitBatch('OUT', b)}/>;
      case 'reports':
        return <ReportsScreen items={items} txns={txns} cats={URO_CATEGORIES}/>;
      case 'smcguide':
        return <SMCGuideScreen user={user}/>;
      case 'guide':
        return <GuideScreen/>;
      default: return null;
    }
  })();

  if (!authChecked) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)' }}>
      <span style={{ color:'var(--ink-3)', fontSize:'14px' }}>กำลังโหลด…</span>
    </div>
  );

  if (!user) return (
    <LoginScreen onLogin={handleLogin} loading={loginLoading} error={loginError}/>
  );

  return (
    <div className="app" data-screen-label={`Screen / ${NAV.find(n=>n.id===route)?.label || route}`}>
      <Sidebar active={route} onNav={go} open={drawer} onClose={()=>setDrawer(false)} collapsed={false} user={user} onLogout={logout}/>
      <div className="main">
        <Topbar onMenu={()=>setDrawer(true)} query={query} setQuery={setQuery}
                onAddIn={()=>go('stockin')} onAddOut={()=>go('stockout')} onReports={()=>go('reports')} user={user} onLogout={logout}
                cloud={cloud} onSettings={()=>setSettingsOpen(true)} items={items} onGo={go}/>
        <div className="content">{screen}</div>
      </div>
      <BottomNav active={route} onNav={go}/>
      {settingsOpen && (
        <SettingsModal user={user} items={items} txns={txns} equipment={equipment}
          cloud={cloud} onCloudConnect={cloudConnect} onCloudDisconnect={cloudDisconnect}
          onStartFresh={startFresh} onRestoreSample={restoreSample} onImportData={importData}
          onClose={()=>setSettingsOpen(false)}/>
      )}
      <Toast toast={toast}/>
      <TweakControls tweaks={tweaks} setTweak={setTweak} onStartFresh={startFresh} onRestoreSample={restoreSample}/>
    </div>
  );
}

function TweakControls({ tweaks, setTweak, onStartFresh, onRestoreSample }) {
  if (typeof TweaksPanel !== 'function') return null;
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="ธีม">
        <TweakColor label="สีหลัก (Accent)" value={tweaks.accent}
          options={['#0F3D6E','#0E7C66','#7A1F3D','#1F2937','#0EA5E9','#B45309']}
          onChange={v=>setTweak('accent', v)}/>
        <TweakRadio label="แถบด้านข้าง" value={tweaks.sidebar}
          options={[{value:'dark',label:'มืด'},{value:'light',label:'สว่าง'}]}
          onChange={v=>setTweak('sidebar', v)}/>
        <TweakRadio label="ความหนาแน่น" value={tweaks.density}
          options={[{value:'compact',label:'กระชับ'},{value:'comfortable',label:'ปกติ'}]}
          onChange={v=>setTweak('density', v)}/>
        <TweakSlider label="ความโค้งมุม" value={tweaks.radius} min={4} max={22} step={1}
          onChange={v=>setTweak('radius', v)}/>
      </TweakSection>
      <TweakSection label="ข้อมูล">
        <p style={{fontSize:'12px',color:'var(--ink-3)',margin:'0 0 4px',lineHeight:1.5}}>
          ข้อมูลถูกบันทึกไว้ในเครื่องนี้โดยอัตโนมัติ รีเฟรชแล้วไม่หาย
        </p>
        {typeof TweakButton === 'function' ? (
          <>
            <TweakButton label="ล้างข้อมูลตัวอย่าง · เริ่มกรอกจริง" onClick={onStartFresh}/>
            <TweakButton label="คืนค่าข้อมูลตัวอย่าง" onClick={onRestoreSample}/>
          </>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
            <button className="btn" onClick={onStartFresh}>ล้างข้อมูลตัวอย่าง · เริ่มกรอกจริง</button>
            <button className="btn" onClick={onRestoreSample}>คืนค่าข้อมูลตัวอย่าง</button>
          </div>
        )}
      </TweakSection>
    </TweaksPanel>
  );
}

function LoginScreen({ onLogin, loading, error }) {
  const [uname, setUname] = useState_('');
  const [pass, setPass] = useState_('');
  const [showReg, setShowReg] = useState_(false);
  const [regName, setRegName] = useState_('');
  const [regEmail, setRegEmail] = useState_('');
  const [regDept, setRegDept] = useState_('');
  const [regLoading, setRegLoading] = useState_(false);
  const [regError, setRegError] = useState_('');
  const [regDone, setRegDone] = useState_(false);

  function submit(e) {
    e.preventDefault();
    if (!uname.trim() || !pass) return;
    onLogin(uname.trim(), pass);
  }

  function submitReg(e) {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) return;
    setRegDone(true);
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'linear-gradient(135deg, #0a2847 0%, #0F3D6E 60%, #1a5fa8 100%)',
      padding:'20px',
    }}>
      <div style={{
        width:'100%', maxWidth:'400px',
        background:'#fff', borderRadius:'20px',
        boxShadow:'0 24px 80px rgba(0,0,0,.35)',
        overflow:'hidden',
      }}>
        {/* Brand header */}
        <div style={{ padding:'36px 32px 28px', textAlign:'center', borderBottom:'1px solid #f0f2f8' }}>
          <LogoMark size={56}/>
          <div style={{ marginTop:'16px', fontSize:'22px', fontWeight:700, color:'#0F172A', letterSpacing:'-0.4px' }}>
            Uro All Around
          </div>
          <div style={{ marginTop:'5px', fontSize:'13px', color:'#64748B' }}>
            ระบบจัดการพัสดุ · แผนกผ่าตัด Uro
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit} style={{ padding:'28px 32px 32px' }}>
          <div style={{ marginBottom:'20px', fontSize:'15px', fontWeight:600, color:'#1F2937' }}>
            เข้าสู่ระบบ
          </div>

          <div className="lbl" style={{ marginBottom:'14px' }}>
            ชื่อผู้ใช้
            <div className="input-wrap">
              <Icon k="user" size={15}/>
              <input
                value={uname} onChange={e=>setUname(e.target.value)}
                autoFocus autoComplete="username" placeholder="เช่น Baheang"
              />
            </div>
          </div>

          <div className="lbl" style={{ marginBottom:'20px' }}>
            รหัสผ่าน
            <div className="input-wrap">
              <Icon k="lock" size={15}/>
              <input
                type="password" value={pass} onChange={e=>setPass(e.target.value)}
                autoComplete="current-password" placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div style={{
              marginBottom:'16px', padding:'10px 14px', borderRadius:'10px',
              background:'#fef2f2', color:'#dc2626', fontSize:'13px',
              display:'flex', alignItems:'center', gap:'8px', border:'1px solid #fecaca',
            }}>
              <Icon k="alert" size={15}/>
              <span>{error}</span>
            </div>
          )}

          <button
            className="btn btn-primary" type="submit"
            disabled={loading || !uname.trim() || !pass}
            style={{ width:'100%', justifyContent:'center', padding:'12px 16px', fontSize:'15px', borderRadius:'12px' }}
          >
            {loading ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
          </button>

          <div style={{ marginTop:'16px', textAlign:'center' }}>
            <button type="button" onClick={()=>setShowReg(true)}
              style={{ background:'none', border:'none', color:'#0F3D6E', fontSize:'13px', cursor:'pointer', textDecoration:'underline', padding:'4px 8px' }}>
              ยังไม่มีบัญชี? ขอสมัครใช้งาน
            </button>
          </div>
        </form>
      </div>

      {/* Sign-up request modal */}
      {showReg && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'20px' }}
          onClick={()=>{ if (!regLoading) { setShowReg(false); setRegDone(false); setRegError(''); } }}>
          <div style={{ background:'#fff', borderRadius:'20px', width:'100%', maxWidth:'420px', boxShadow:'0 24px 80px rgba(0,0,0,.4)', overflow:'hidden' }}
            onClick={e=>e.stopPropagation()}>
            <div style={{ padding:'24px 28px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontSize:'18px', fontWeight:700, color:'#0F172A' }}>ขอสมัครใช้งาน</div>
              <button type="button" onClick={()=>{ setShowReg(false); setRegDone(false); setRegError(''); }}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#64748B', padding:'4px', fontSize:'20px', lineHeight:1 }}>✕</button>
            </div>

            {regDone ? (
              <div style={{ padding:'24px 28px 28px' }}>
                <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'14px', padding:'18px', marginBottom:'18px' }}>
                  <div style={{ fontSize:'13px', color:'#166534', fontWeight:700, marginBottom:'10px' }}>
                    ✅ กรุณาส่งข้อมูลนี้ให้ Admin ทาง Line หรือ Email
                  </div>
                  <div style={{ fontSize:'13px', color:'#14532d', lineHeight:1.8, fontFamily:'monospace', background:'#dcfce7', borderRadius:'8px', padding:'10px 12px' }}>
                    <div>ชื่อ: {regName.trim()}</div>
                    <div>Email: {regEmail.trim()}</div>
                    {regDept.trim() && <div>แผนก: {regDept.trim()}</div>}
                  </div>
                  <div style={{ display:'flex', gap:'8px', marginTop:'12px', flexWrap:'wrap' }}>
                    <button type="button"
                      style={{ flex:1, minWidth:'100px', padding:'9px 12px', borderRadius:'10px', border:'1px solid #86efac', background:'#fff', color:'#166534', fontSize:'13px', fontWeight:600, cursor:'pointer' }}
                      onClick={()=>{
                        const txt = `ขอสมัครใช้งาน Uro All Around\nชื่อ: ${regName.trim()}\nEmail: ${regEmail.trim()}${regDept.trim() ? '\nแผนก: '+regDept.trim() : ''}`;
                        navigator.clipboard.writeText(txt).catch(()=>{});
                      }}>
                      คัดลอกข้อความ
                    </button>
                    <button type="button"
                      style={{ flex:1, minWidth:'100px', padding:'9px 12px', borderRadius:'10px', border:'1px solid #86efac', background:'#fff', color:'#166534', fontSize:'13px', fontWeight:600, cursor:'pointer' }}
                      onClick={()=>{
                        const sub = encodeURIComponent('ขอสมัครใช้งาน Uro All Around');
                        const body = encodeURIComponent(`ชื่อ: ${regName.trim()}\nEmail: ${regEmail.trim()}${regDept.trim() ? '\nแผนก: '+regDept.trim() : ''}`);
                        window.open(`mailto:uroipissor@gmail.com?subject=${sub}&body=${body}`);
                      }}>
                      ส่ง Email
                    </button>
                  </div>
                </div>
                <div style={{ fontSize:'12px', color:'#94a3b8', textAlign:'center', lineHeight:1.6, marginBottom:'16px' }}>
                  Admin จะเพิ่มบัญชีผู้ใช้และแจ้ง username / รหัสผ่านให้ทาง Line
                </div>
                <button type="button" onClick={()=>{ setShowReg(false); setRegDone(false); setRegName(''); setRegEmail(''); setRegDept(''); }}
                  style={{ width:'100%', padding:'11px', borderRadius:'12px', border:'none', background:'#0F3D6E', color:'#fff', fontSize:'14px', fontWeight:600, cursor:'pointer' }}>
                  ปิด
                </button>
              </div>
            ) : (
              <form onSubmit={submitReg} style={{ padding:'20px 28px 28px' }}>
                <p style={{ fontSize:'13px', color:'#64748B', marginBottom:'20px', lineHeight:1.6 }}>
                  กรอกข้อมูลด้านล่าง Admin จะเพิ่มบัญชีและแจ้ง username / รหัสผ่านให้ทาง Line
                </p>
                <div className="lbl" style={{ marginBottom:'14px' }}>
                  ชื่อ-นามสกุล *
                  <div className="input-wrap">
                    <Icon k="user" size={15}/>
                    <input value={regName} onChange={e=>setRegName(e.target.value)} placeholder="เช่น พว. สมชาย ใจดี" required/>
                  </div>
                </div>
                <div className="lbl" style={{ marginBottom:'14px' }}>
                  Email
                  <div className="input-wrap">
                    <Icon k="phone" size={15}/>
                    <input value={regEmail} onChange={e=>setRegEmail(e.target.value)} placeholder="email@example.com" required/>
                  </div>
                </div>
                <div className="lbl" style={{ marginBottom:'20px' }}>
                  แผนก / ตำแหน่ง
                  <div className="input-wrap">
                    <Icon k="building" size={15}/>
                    <input value={regDept} onChange={e=>setRegDept(e.target.value)} placeholder="เช่น พยาบาลห้องผ่าตัด Uro"/>
                  </div>
                </div>
                <button type="submit" disabled={!regName.trim() || !regEmail.trim()}
                  style={{ width:'100%', padding:'12px', borderRadius:'12px', border:'none', background:'#0F3D6E', color:'#fff', fontSize:'15px', fontWeight:600, cursor:'pointer', opacity:(!regName.trim() || !regEmail.trim()) ? 0.6 : 1 }}>
                  ถัดไป →
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);

/* Main app — routing state, theme tweaks, mobile drawer */
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
  // Public access — no login required. `user` is a dummy object for compatibility.
  const [user] = useState_({ id: 'guest', email: 'guest@local', name: 'Guest' });
  const [query, setQuery] = useState_('');
  const [drawer, setDrawer] = useState_(false);
  // Start empty — no demo/mock data. Real data is entered by the user and
  // lives in the central database. (Use Settings → "คืนค่าข้อมูลตัวอย่าง"
  // to load the demo dataset on purpose.)
  const [items, setItems] = useState_(() => loadPersisted('items', []));
  const [txns, setTxns] = useState_(() => loadPersisted('txns', []));
  const [equipment, setEquipment] = useState_(() => loadPersisted('equipment', []));
  const [pos, setPos] = useState_(() => loadPersisted('po', []));
  const [prefillCode, setPrefillCode] = useState_('');
  const [toast, setToast] = useState_(null);
  const [settingsOpen, setSettingsOpen] = useState_(false);

  // ---- central database (Supabase) sync ----
  const hasCloud = typeof UroCloud !== 'undefined';
  const [cloud, setCloud] = useState_({ state: 'off' });
  const applyingRemote = useRef_(false);
  const dataRef = useRef_({ items, txns, equipment, po: pos, by: user?.name });
  useEffect_(() => { dataRef.current = { items, txns, equipment, po: pos, by: user?.name }; });

  // Persist real data whenever it changes
  useEffect_(() => { savePersisted('items', items); }, [items]);
  useEffect_(() => { savePersisted('txns', txns); }, [txns]);
  useEffect_(() => { savePersisted('equipment', equipment); }, [equipment]);
  useEffect_(() => { savePersisted('po', pos); }, [pos]);

  // No auth required — public access

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
      setItems(d.items || []);
      setTxns(d.txns || []);
      if (Array.isArray(d.equipment)) setEquipment(d.equipment);
      if (Array.isArray(d.po)) setPos(d.po);
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
    UroCloud.push({ items, txns, equipment, po: pos, by: user?.name });
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
    setRoute('dashboard');
  }

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
    setItems([]); setTxns([]); setEquipment([]); setPos([]);
    // Push empty data to Supabase
    if (hasCloud) UroCloud.push({ items: [], txns: [], equipment: [], po: [] });
    setSettingsOpen(false);
    showToast('ล้างข้อมูลแล้ว — เริ่มกรอกข้อมูลจริงได้เลย');
    setRoute('items');
  }
  // Restore the demo data set (optional — for trying the system out)
  function restoreSample() {
    if (!window.confirm('โหลดข้อมูลตัวอย่างทั้งหมด? ข้อมูลปัจจุบันจะถูกเขียนทับ')) return;
    setItems(URO_ITEMS); setTxns(URO_TXNS); setEquipment(URO_EQUIPMENT); setPos(URO_PO);
    showToast('โหลดข้อมูลตัวอย่างแล้ว');
  }
  // Restore from a backup file
  function importData(data) {
    setItems(data.items || []);
    setTxns(data.txns || []);
    if (Array.isArray(data.equipment)) setEquipment(data.equipment);
    if (Array.isArray(data.po)) setPos(data.po);
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
    const it = { ...d, lot:'—', exp:'—' };
    setItems(arr => [it, ...arr]);
    showToast(`เพิ่ม "${d.name}" เข้าคลังแล้ว`);
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
        return <ItemsScreen items={items} cats={URO_CATEGORIES} query={query}
                            onCount={adjust} onStockIn={c=>go('stockin',c)} onStockOut={c=>go('stockout',c)}
                            onAdd={addItem} onImport={importItems}/>;
      case 'equipment':
        return <EquipmentScreen equipment={equipment}/>;
      case 'remaining':
        return <RemainingScreen items={items} cats={URO_CATEGORIES} onStockIn={c=>go('stockin',c)}/>;
      case 'po':
        return <POScreen pos={pos} onChange={setPos}/>;
      case 'stockin':
        return <StockMoveScreen kind="IN" items={items} cats={URO_CATEGORIES} user={user}
                                prefill={prefillCode} onSubmit={b=>commitBatch('IN', b)}/>;
      case 'stockout':
        return <StockMoveScreen kind="OUT" items={items} cats={URO_CATEGORIES} user={user}
                                prefill={prefillCode} onSubmit={b=>commitBatch('OUT', b)}/>;
      case 'reports':
        return <ReportsScreen items={items} txns={txns} cats={URO_CATEGORIES}/>;
      default: return null;
    }
  })();

  return (
    <div className="app" data-screen-label={`Screen / ${NAV.find(n=>n.id===route)?.label || route}`}>
      <Sidebar active={route} onNav={go} open={drawer} onClose={()=>setDrawer(false)} collapsed={false} user={user} onLogout={logout}/>
      <div className="main">
        <Topbar onMenu={()=>setDrawer(true)} query={query} setQuery={setQuery}
                onAddIn={()=>go('stockin')} onAddOut={()=>go('stockout')} user={user} onLogout={logout}
                cloud={cloud} onSettings={()=>setSettingsOpen(true)}/>
        <div className="content">{screen}</div>
      </div>
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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);

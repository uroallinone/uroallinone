/* Screens — Dashboard, Items, Categories, StockIn, StockOut, Reports */
const { useState: useS, useEffect: useE, useMemo: useM, useRef: useR } = React;

/* ===== Mobile Dashboard (≤720px) ===== */
function MobileDashboard({ items, txns, onGo }) {
  const outCount  = items.filter(i => statusOf(i) === 'out').length;
  const lowCount  = items.filter(i => statusOf(i) === 'low' || statusOf(i) === 'warn').length;
  const today = new Date().toLocaleDateString('th-TH', { weekday:'long', day:'numeric', month:'long' });

  const recentOuts = txns
    .filter(t => t.type === 'OUT')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const MENUS = [
    { id:'stockout',    label:'เบิกใช้',     icon:'out',     grad:'linear-gradient(135deg,#f97316,#ef4444)' },
    { id:'items',       label:'พัสดุหลัก',   icon:'box',     grad:'linear-gradient(135deg,#3b82f6,#1d4ed8)' },
    { id:'consumables', label:'สิ้นเปลือง',  icon:'pkg',     grad:'linear-gradient(135deg,#10b981,#059669)' },
    { id:'remaining',   label:'คงเหลือ',     icon:'alert',   grad:'linear-gradient(135deg,#f59e0b,#d97706)', badge: outCount+lowCount||null },
    { id:'po',          label:'OD',          icon:'truck',   grad:'linear-gradient(135deg,#06b6d4,#0891b2)' },
    { id:'smcguide',    label:'SMC',         icon:'receipt', grad:'linear-gradient(135deg,#6366f1,#4f46e5)' },
    { id:'transplant',  label:'Transplant',  icon:'xplant',  grad:'linear-gradient(135deg,#8b5cf6,#6d28d9)' },
    { id:'equipment',   label:'ครุภัณฑ์',    icon:'gear',    grad:'linear-gradient(135deg,#64748b,#334155)' },
  ];

  return (
    <div className="mhv2-wrap">
      {/* Hero header */}
      <div className="mhv2-hero">
        <div className="mhv2-date">{today}</div>
        <div className="mhv2-title">ภาพรวมพัสดุ</div>
        <div className="mhv2-statbar">
          <div className="mhv2-pill">
            <span className="mhv2-pill-n">{items.length}</span>
            <span className="mhv2-pill-l">รายการ</span>
          </div>
          {outCount > 0 && (
            <div className="mhv2-pill mhv2-pill--red">
              <span className="mhv2-pill-n">{outCount}</span>
              <span className="mhv2-pill-l">หมดสต๊อก</span>
            </div>
          )}
          {lowCount > 0 && (
            <div className="mhv2-pill mhv2-pill--amber">
              <span className="mhv2-pill-n">{lowCount}</span>
              <span className="mhv2-pill-l">ใกล้หมด</span>
            </div>
          )}
        </div>
      </div>

      {/* Icon grid — first thing user sees */}
      <div className="mhv2-grid">
        {MENUS.map(m => (
          <button key={m.id} className="mhv2-icon-btn" onClick={()=>onGo(m.id)}>
            <div className="mhv2-icon-box" style={{background:m.grad}}>
              <Icon k={m.icon} size={30} stroke={1.8}/>
              {m.badge ? <span className="mhv2-badge">{m.badge}</span> : null}
            </div>
            <div className="mhv2-icon-lbl">{m.label}</div>
          </button>
        ))}
      </div>

      {/* Recent usage — compact */}
      <section className="mhv2-card">
        <div className="mhv2-card-head">
          <span>📋 เบิกล่าสุด</span>
          <button onClick={()=>onGo('stockout')}>เบิกใหม่ →</button>
        </div>
        {recentOuts.length === 0
          ? <div className="mhv2-empty">ยังไม่มีรายการเบิก</div>
          : recentOuts.map(t => (
            <div key={t.id} className="mhv2-row">
              <div>
                <div className="mhv2-row-name">{t.name}</div>
                <div className="mhv2-row-meta">{(t.date||'').slice(5,10).replace('-','/')} · {t.by||''}</div>
              </div>
              <div className="mhv2-row-qty">−{Math.abs(t.qty)} {t.unit}</div>
            </div>
          ))
        }
      </section>
    </div>
  );
}

/* ===== Dashboard ===== */
function Dashboard({ items, txns, burn, month, year, cats, onGo, onStockIn, onStockOut }) {
  const [isMobile, setIsMobile] = useS(() => window.matchMedia('(max-width:720px)').matches);
  const [range, setRange] = useS('day');  // day | month | year

  useE(() => {
    const mq = window.matchMedia('(max-width:720px)');
    const fn = e => setIsMobile(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  const counts = useM(() => {
    let ok=0, warn=0, low=0, out=0, total=items.length;
    items.forEach(it => {
      const s = statusOf(it);
      if (s==='ok') ok++; else if (s==='warn') warn++; else if (s==='low') low++; else out++;
    });
    const totalQty = items.reduce((a,b)=>a+b.qty,0);
    const totalValue = items.reduce((a,b)=>a + (b.qty * (b.price||0)),0);
    return { ok, warn, low, out, total, totalQty, totalValue };
  }, [items]);

  const catSlices = cats.map(c => ({
    label: c.name,
    color: `oklch(0.65 0.13 ${c.hue})`,
    value: items.filter(i=>i.cat===c.id).reduce((s,i)=>s+i.qty,0),
  }));

  const lowItems = items.filter(i => statusOf(i) !== 'ok').slice(0, 6);

  // Summary header for the selected range
  const rangeSummary = useM(() => {
    if (range === 'day') {
      const total = burn.reduce((s,d)=>s + cats.reduce((a,c)=>a+(d[c.id]||0),0), 0);
      return { label: '7 วันที่ผ่านมา', total };
    }
    if (range === 'month') {
      const total = month.reduce((s,m)=>s+m.total,0);
      const value = month.reduce((s,m)=>s+m.value,0);
      return { label: '12 เดือนล่าสุด', total, value };
    }
    const total = year.reduce((s,y)=>s+y.total,0);
    const value = year.reduce((s,y)=>s+y.value,0);
    return { label: '5 ปีย้อนหลัง', total, value };
  }, [range, burn, month, year, cats]);

  if (isMobile) return <MobileDashboard items={items} txns={txns} onGo={onGo}/>;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">แดชบอร์ดสต๊อก</div>
          <h1 className="page-title">ภาพรวมพัสดุ — แผนกผ่าตัด Uro</h1>
          <div className="page-sub">ข้อมูลเรียลไทม์จากฐานข้อมูลกลาง · {new Date().toLocaleDateString('th-TH', { day:'numeric', month:'long', year:'numeric' })}</div>
        </div>
        <div className="page-head-actions">
          <div className="seg">
            <button className={cx('seg-btn', range==='day' && 'is-on')} onClick={()=>setRange('day')}>รายวัน</button>
            <button className={cx('seg-btn', range==='month' && 'is-on')} onClick={()=>setRange('month')}>รายเดือน</button>
            <button className={cx('seg-btn', range==='year' && 'is-on')} onClick={()=>setRange('year')}>รายปี</button>
          </div>
          <button className="btn btn-ghost"><Icon k="refresh" size={16}/><span>รีเฟรช</span></button>
          <button className="btn btn-primary"><Icon k="download" size={16}/><span>ส่งออก</span></button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard tone="accent" icon="box"   big={fmt(counts.total)}    label="รายการพัสดุทั้งหมด" sub={`รวม ${fmt(counts.totalQty)} ชิ้น/หน่วย`}/>
        <StatCard tone="ok"     icon="check" big={fmt(counts.ok)}        label="สต๊อกปกติ"           sub="คงเหลือเหนือขั้นต่ำ"/>
        <StatCard tone="warn"   icon="alert" big={fmt(counts.low+counts.warn)} label="ใกล้หมด / เตือน" sub={`${counts.low} ใกล้หมด · ${counts.warn} เตือน`} trend="ต้องเติม"/>
        <StatCard tone="bad"    icon="dot"   big={fmt(counts.out)}       label="หมด"                  sub="สั่งซื้อด่วน"/>
      </div>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <div>
              <div className="card-title">{range==='day' ? 'การเบิกใช้ 7 วันที่ผ่านมา' : range==='month' ? 'แนวโน้มการใช้รายเดือน (12 เดือน)' : 'แนวโน้มการใช้รายปี (5 ปี)'}</div>
              <div className="card-sub">
                {range==='day' && 'แยกตามหมวดหมู่ · หน่วยที่เบิกออก'}
                {range==='month' && `รวม ${fmt(rangeSummary.total)} หน่วย · มูลค่า ${fmt(rangeSummary.value)} บาท`}
                {range==='year' && `รวม ${fmt(rangeSummary.total)} หน่วย · มูลค่า ${fmt(rangeSummary.value)} บาท`}
              </div>
            </div>
            {range==='day' ? (
              <div className="legend">
                {cats.map(c => (
                  <span key={c.id} className="legend-item">
                    <span className="dot" style={{ background: `oklch(0.62 0.13 ${c.hue})` }}/>{c.name}
                  </span>
                ))}
              </div>
            ) : (rangeSummary.delta ? (
              <span className="trend-pill">{rangeSummary.delta}</span>
            ) : null)}
          </div>
          {range==='day'   && <BurnChart data={burn} cats={cats}/>}
          {range==='month' && <TrendBars data={month}/>}
          {range==='year'  && <TrendBars data={year} big/>}
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <div className="card-title">สัดส่วนสต๊อกตามหมวด</div>
              <div className="card-sub">นับเป็นจำนวนหน่วยรวม</div>
            </div>
          </div>
          <Donut
            slices={catSlices}
            centerLabel={fmt(counts.totalQty)}
            centerSub="หน่วยทั้งหมด"
          />
        </section>
      </div>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <div>
              <div className="card-title">รายการต้องเติมสต๊อก</div>
              <div className="card-sub">เรียงตามความเร่งด่วน</div>
            </div>
            <button className="btn btn-link" onClick={()=>onGo('items')}>ดูทั้งหมด <Icon k="chev" size={14}/></button>
          </div>
          <ul className="lowlist">
            {lowItems.map(it => {
              const s = statusOf(it);
              const cat = cats.find(c=>c.id===it.cat);
              return (
                <li key={it.code}>
                  <div className="lowlist-l">
                    <div className="cat-tag" style={{ background: `oklch(0.95 0.04 ${cat.hue})`, color: `oklch(0.35 0.12 ${cat.hue})` }}>
                      {cat.en}
                    </div>
                    <div>
                      <div className="lowlist-name">{it.name}</div>
                      <div className="lowlist-meta">{it.code} · ที่เก็บ {it.loc}</div>
                    </div>
                  </div>
                  <div className="lowlist-r">
                    <div className="lowlist-qty">
                      <b>{it.qty}</b><span> / {it.min} {it.unit}</span>
                    </div>
                    <StatusPill s={s}/>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <div className="card-title">เคลื่อนไหวล่าสุด</div>
              <div className="card-sub">รับเข้า · เบิกออก · ปรับยอด</div>
            </div>
            <button className="btn btn-link" onClick={()=>onGo('reports')}>รายงานเต็ม <Icon k="chev" size={14}/></button>
          </div>
          <ul className="txnlist">
            {txns.slice(0,6).map(t => (
              <li key={t.id}>
                <div className={cx('txn-type', `txn-${t.type.toLowerCase()}`)}>
                  <Icon k={t.type==='IN'?'in':t.type==='OUT'?'out':'edit'} size={16}/>
                  <span>{t.type==='IN'?'รับ':t.type==='OUT'?'เบิก':'ปรับ'}</span>
                </div>
                <div className="txn-mid">
                  <div className="txn-name">{t.name}</div>
                  <div className="txn-meta">{t.code} · {t.by} · <span className="muted">{t.note}</span></div>
                </div>
                <div className="txn-right">
                  <div className={cx('txn-qty', t.type==='OUT' && 'is-neg', t.type==='IN' && 'is-pos')}>
                    {t.type==='OUT'?'−':t.type==='IN'?'+':''}{Math.abs(t.qty)} {t.unit}
                  </div>
                  <div className="txn-date">{t.date.slice(5).replace('-','/').replace(' ','  ')}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/* ===== Items list ===== */
function ItemsScreen({ items, cats, query, canEdit, onCount, onStockIn, onStockOut, onAdd, onEdit, onDelete, onImport, vendors=[], onAddVendor, typeFilter, pageLabel }) {
  const [cat, setCat] = useS('all');
  const [status, setStatus] = useS('all');
  const [showAdd, setShowAdd] = useS(false);
  const [showImport, setShowImport] = useS(false);
  const [editItem, setEditItem] = useS(null);
  const [localQ, setLocalQ] = useS('');

  const effectiveQ = localQ || query;
  const typeItems = typeFilter ? items.filter(i => i.type === typeFilter) : items;
  const filtered = typeItems.filter(i => {
    if (cat !== 'all' && i.cat !== cat) return false;
    if (status !== 'all' && statusOf(i) !== status) return false;
    if (effectiveQ) {
      const q = effectiveQ.toLowerCase();
      if (!(i.name.toLowerCase().includes(q) ||
            i.code.toLowerCase().includes(q) ||
            (i.ipiss||'').toLowerCase().includes(q) ||
            (i.lot||'').toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const totalValue = filtered.reduce((s,i)=>s + i.qty * (i.price||0), 0);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">{pageLabel || 'พัสดุ'} · Materials</div>
          <h1 className="page-title">{pageLabel || 'คลังพัสดุ Uro'} · {fmt(filtered.length)} รายการ</h1>
          <div className="page-sub">มูลค่าคงเหลือ <b>{fmt(totalValue)} บาท</b> · ระบุ <b>เลข IPISS</b> ทุกรายการ · กำหนดจำนวนคงเหลือขั้นต่ำเพื่อแจ้งเตือนอัตโนมัติ</div>
        </div>
        <div className="page-head-actions">
          <button className="btn btn-ghost"><Icon k="qr" size={16}/><span>สแกน QR</span></button>
          {canEdit && <button className="btn btn-ghost" onClick={()=>setShowImport(true)}><Icon k="sheet" size={16}/><span>นำเข้าจาก Google Sheet</span></button>}
          {canEdit && <button className="btn btn-primary" onClick={()=>setShowAdd(true)}><Icon k="plus" size={16}/><span>เพิ่มรายการ</span></button>}
        </div>
      </div>

      <div className="ic-search-bar">
        <Icon k="search" size={16}/>
        <input
          value={localQ}
          onChange={e => setLocalQ(e.target.value)}
          placeholder="ค้นหาชื่อ / รหัส / IPISS…"
        />
        {localQ && <button className="ic-search-clear" onClick={()=>setLocalQ('')}>✕</button>}
      </div>

      <div className="chips-row">
        <Chip active={cat==='all'} onClick={()=>setCat('all')}>ทั้งหมด ({typeItems.length})</Chip>
        {cats.map(c => (
          <Chip key={c.id} active={cat===c.id} onClick={()=>setCat(c.id)} hue={c.hue}>
            {c.name} ({typeItems.filter(i=>i.cat===c.id).length})
          </Chip>
        ))}
        <div className="chip-sep"/>
        {['all','ok','warn','low','out'].map(s => (
          <Chip key={s} active={status===s} onClick={()=>setStatus(s)} small>
            {s==='all'?'ทุกสถานะ':STATUS_TEXT[s]}
          </Chip>
        ))}
      </div>

      <section className="card" style={{padding:0,overflow:'hidden'}}>
        {filtered.length === 0
          ? <div className="ic-empty">ไม่พบรายการที่ตรงกับเงื่อนไข</div>
          : (() => {
            const CAT_ICONS = { scope:'scan', cath:'in', stent:'gear', drape:'shield', consum:'pkg' };
            const grouped = cats
              .map(c => ({ cat: c, items: filtered.filter(i => i.cat === c.id) }))
              .filter(g => g.items.length > 0);
            const renderCard = (it, cat) => {
              const s = statusOf(it);
              const ratio = Math.min(1, it.qty / (it.min * 2.2 || 1));
              const bg  = `oklch(0.92 0.08 ${cat.hue})`;
              const fg  = `oklch(0.27 0.17 ${cat.hue})`;
              const bar = `oklch(0.60 0.15 ${cat.hue})`;
              const icon = CAT_ICONS[cat.id] || 'box';
              const qtyColor = s==='out'?'var(--bad)':s==='low'?'#C2410C':s==='warn'?'var(--warn)':'var(--ok)';
              return (
                <div key={it.code} className={cx('ic-card', `s-${s}`)}>
                  <div className="ic-bar" style={{background:bar}}/>
                  <div className="ic-head">
                    <div className="ic-sq" style={{background:bg,color:fg}}>
                      <Icon k={icon} size={18}/>
                      <span>{(cat.en||'').split(' ')[0].slice(0,5).toUpperCase()}</span>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div className="cat-tag sm" style={{background:bg,color:fg}}>{cat.en}</div>
                    </div>
                    <StatusPill s={s}/>
                  </div>
                  <div className="ic-name">{it.name}</div>
                  <div className="ic-codes">
                    <span className="ipiss" style={{fontSize:'10px',padding:'1px 5px'}}>{it.ipiss}</span>
                    <span className="mono" style={{fontSize:'10px',color:'var(--ink-4)'}}>· {it.code}</span>
                    {it.loc && <span style={{fontSize:'10px',color:'var(--ink-4)'}}>· {it.loc}</span>}
                  </div>
                  <div className="ic-lot">OD {it.lot} · Exp {it.exp}</div>
                  <div className="ic-div"/>
                  <div className="ic-stats">
                    <div>
                      <div className="ic-stat-lbl">ราคา/หน่วย</div>
                      <span className="ic-stat-big">{fmt(it.price||0)}</span>
                      <span className="ic-stat-unit">฿</span>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div className="ic-stat-lbl">คงเหลือ</div>
                      <span className={cx('ic-stat-big', s==='out'&&'bad')}>{fmt(it.qty)}</span>
                      <span className="ic-stat-unit">{it.unit}</span>
                    </div>
                    <div className="ic-bar-wrap">
                      <div className="qty-bar">
                        <span style={{width:`${ratio*100}%`,background:qtyColor}}/>
                        <span className="qty-min" style={{left:`${(it.min/(it.min*2.2||1))*100}%`}} title={`ขั้นต่ำ ${it.min}`}/>
                      </div>
                      <div className="ic-min-lbl">ขั้นต่ำ {it.min} {it.unit}</div>
                    </div>
                  </div>
                  <div className="ic-div"/>
                  <div className="ic-vendor">
                    <span className="vendor-co" style={{fontSize:'11px'}}><Icon k="building" size={11}/>{it.supplier||'—'}</span>
                    {it.tel && <a className="vendor-tel" style={{fontSize:'10.5px',padding:'2px 7px'}} href={`tel:${it.tel.replace(/-/g,'')}`}><Icon k="phone" size={11}/>{it.tel}</a>}
                  </div>
                  {canEdit && (
                    <div className="ic-actions">
                      <button className="stepper" onClick={()=>onCount(it.code,-1)}><Icon k="minus" size={13}/></button>
                      <button className="stepper" onClick={()=>onCount(it.code,+1)}><Icon k="plus" size={13}/></button>
                      <button className="btn btn-mini btn-ghost" onClick={()=>onStockIn(it.code)}>รับ</button>
                      <button className="btn btn-mini btn-primary" onClick={()=>onStockOut(it.code)}>เบิก</button>
                      <div style={{marginLeft:'auto',display:'flex',gap:'4px'}}>
                        <button className="btn btn-mini btn-ghost" onClick={()=>setEditItem(it)}>✏️</button>
                        <button className="btn btn-mini btn-danger" onClick={()=>{if(window.confirm(`ลบ "${it.name}" ออกจากคลัง?`))onDelete(it.code);}}>🗑️</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            };
            return (
              <div className="ic-groups">
                {grouped.map(({ cat, items }) => {
                  const bg  = `oklch(0.92 0.08 ${cat.hue})`;
                  const fg  = `oklch(0.27 0.17 ${cat.hue})`;
                  const bar = `oklch(0.60 0.15 ${cat.hue})`;
                  const icon = CAT_ICONS[cat.id] || 'box';
                  return (
                    <div key={cat.id} className="ic-group">
                      <div className="ic-group-head" style={{borderLeftColor:bar}}>
                        <div className="ic-sq" style={{background:bg,color:fg,width:'34px',height:'34px',borderRadius:'9px',fontSize:'7.5px'}}>
                          <Icon k={icon} size={15}/>
                          <span>{(cat.en||'').split(' ')[0].slice(0,4).toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="ic-group-name">{cat.name}</div>
                          <div className="ic-group-sub">{cat.en} · {items.length} รายการ</div>
                        </div>
                      </div>
                      <div className="ic-grid">
                        {items.map(it => renderCard(it, cat))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()
        }
        <div className="tfoot">
          <span>แสดง {filtered.length} จาก {typeItems.length} รายการ · มูลค่ารวม {fmt(totalValue)} บาท</span>
          <div className="pager">
            <button className="pg">‹</button>
            <button className="pg pg-on">1</button>
            <button className="pg">2</button>
            <button className="pg">›</button>
          </div>
        </div>
      </section>

      {showAdd && <AddItemModal cats={cats} vendors={vendors} onAddVendor={onAddVendor} defaultType={typeFilter||'main'} onClose={()=>setShowAdd(false)} onSave={(d)=>{ onAdd(d); setShowAdd(false); }}/>}
      {showImport && <ImportSheetModal onClose={()=>setShowImport(false)} onImport={(rows)=>{ onImport(rows); setShowImport(false); }}/>}
      {editItem && <EditItemModal cats={cats} item={editItem} vendors={vendors} onAddVendor={onAddVendor} onClose={()=>setEditItem(null)} onSave={(d)=>{ onEdit(d); setEditItem(null); }}/>}
    </div>
  );
}

/* ===== Vendor combobox — searchable dropdown with inline add ===== */
function VendorCombobox({ vendors, value, onChange, onChangeTel, onAdd, placeholder }) {
  const [open, setOpen] = useS(false);
  const [newName, setNewName] = useS('');
  const [newTel, setNewTel] = useS('');
  const triggerRef = useR(null);
  const popRef = useR(null);
  const rect = useAnchoredPopover(open, triggerRef);

  useE(() => {
    function onDoc(e) {
      if (triggerRef.current?.contains(e.target)) return;
      if (popRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const q = (value||'').toLowerCase().trim();
  const filtered = q
    ? vendors.filter(v => v.name.toLowerCase().includes(q) || (v.tel||'').includes(q))
    : vendors;

  function pick(v) { onChange(v.name); onChangeTel(v.tel||''); setOpen(false); }

  function addNew() {
    if (!newName.trim()) return;
    const v = { id: 'V-' + Date.now(), name: newName.trim(), tel: newTel.trim() };
    onAdd(v); onChange(v.name); onChangeTel(v.tel);
    setNewName(''); setNewTel(''); setOpen(false);
  }

  return (
    <>
      <div ref={triggerRef} className="input-wrap">
        <Icon k="building" size={15}/>
        <input value={value} onChange={e=>{ onChange(e.target.value); setOpen(true); }}
          onFocus={()=>setOpen(true)} placeholder={placeholder||"เลือกหรือพิมพ์ชื่อบริษัท…"}/>
      </div>
      {open && rect && ReactDOM.createPortal(
        <div ref={popRef} style={{
          position:'fixed', top: rect.bottom+4, left: rect.left, width: Math.max(rect.width, 300), zIndex:1100,
          background:'#fff', border:'1px solid var(--bd)', borderRadius:'12px',
          boxShadow:'0 16px 40px rgba(15,23,42,.22)',
        }}>
          <div style={{ maxHeight:'160px', overflowY:'auto', padding:'6px' }}>
            {filtered.length === 0 ? (
              <div style={{ padding:'10px 12px', fontSize:'13px', color:'var(--ink-4)' }}>
                {q ? 'ไม่พบ — เพิ่มผู้จำหน่ายใหม่ด้านล่าง' : 'ยังไม่มีผู้จำหน่าย — เพิ่มด้านล่าง'}
              </div>
            ) : filtered.map(v => (
              <div key={v.id} onMouseDown={()=>pick(v)} style={{ padding:'8px 10px', borderRadius:'8px', cursor:'pointer', fontSize:'13px' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{ fontWeight:600, color:'var(--ink)' }}>{v.name}</div>
                {v.tel && <div style={{ color:'var(--ink-4)', fontSize:'11.5px' }}>{v.tel}</div>}
              </div>
            ))}
          </div>
          <div style={{ borderTop:'1px solid var(--bd)', padding:'8px' }}>
            <div style={{ fontSize:'11.5px', color:'var(--ink-4)', fontWeight:600, marginBottom:'6px' }}>+ เพิ่มผู้จำหน่ายใหม่</div>
            <div style={{ display:'flex', gap:'4px' }}>
              <input style={{ flex:1, border:'1px solid var(--bd)', borderRadius:'6px', padding:'5px 8px', fontSize:'12.5px', outline:'none', color:'var(--ink)' }}
                value={newName} onChange={e=>setNewName(e.target.value)} placeholder="ชื่อบริษัท"
                onKeyDown={e=>{ if(e.key==='Enter') addNew(); }}/>
              <input style={{ width:'110px', border:'1px solid var(--bd)', borderRadius:'6px', padding:'5px 8px', fontSize:'12.5px', outline:'none', color:'var(--ink)' }}
                value={newTel} onChange={e=>setNewTel(e.target.value)} placeholder="เบอร์โทร"
                onKeyDown={e=>{ if(e.key==='Enter') addNew(); }}/>
              <button type="button" className="btn btn-primary sm" onMouseDown={addNew} style={{ flexShrink:0 }}>
                <Icon k="check" size={13}/>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/* ===== Add item modal ===== */
function AddItemModal({ cats, onClose, onSave, vendors=[], onAddVendor, defaultType='main' }) {
  const [d, setD] = useS({ ipiss:'', name:'', cat:'cath', unit:'ชิ้น', qty:0, min:0, price:0, supplier:'', tel:'', type: defaultType });
  function set(k, v) { setD(o => ({ ...o, [k]: v })); }
  const ok = d.ipiss && d.name;
  return (
    <ModalShell title="เพิ่มรายการพัสดุใหม่" onClose={onClose} icon="plus">
      <div className="form">
        <label className="lbl">เลข IPISS *
          <div className="input-wrap"><input value={d.ipiss} onChange={e=>set('ipiss',e.target.value)} placeholder="7110-XXX-XXXX/2569"/></div>
        </label>
        <label className="lbl">ชื่อพัสดุ *
          <div className="input-wrap"><input value={d.name} onChange={e=>set('name',e.target.value)} placeholder="เช่น Foley 2-way 16 Fr"/></div>
        </label>
        <div className="form-row">
          <label className="lbl">หมวดหมู่
            <div className="input-wrap"><select value={d.cat} onChange={e=>set('cat',e.target.value)} className="bare-select">
              {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          </label>
          <label className="lbl">หน่วยนับ
            <div className="input-wrap"><input value={d.unit} onChange={e=>set('unit',e.target.value)} placeholder="ชิ้น / เส้น / ถุง"/></div>
          </label>
        </div>
        <div className="form-row">
          <label className="lbl">จำนวนเริ่มต้น
            <div className="input-wrap"><input type="number" value={d.qty} onChange={e=>set('qty',Number(e.target.value))}/></div>
          </label>
          <label className="lbl">ขั้นต่ำสำหรับแจ้งเตือน
            <div className="input-wrap"><input type="number" value={d.min} onChange={e=>set('min',Number(e.target.value))}/></div>
          </label>
        </div>
        <label className="lbl">ราคา/หน่วย (บาท)
          <div className="input-wrap"><input type="number" value={d.price} onChange={e=>set('price',Number(e.target.value))}/></div>
        </label>
        <div className="form-row">
          <label className="lbl">บริษัทคู่ค้า / ผู้จำหน่าย
            <VendorCombobox vendors={vendors} value={d.supplier}
              onChange={v=>set('supplier',v)} onChangeTel={v=>set('tel',v)}
              onAdd={onAddVendor} placeholder="เช่น Bard, Olympus"/>
          </label>
          <label className="lbl">เบอร์โทรติดต่อ
            <div className="input-wrap"><Icon k="phone" size={15}/><input value={d.tel} onChange={e=>set('tel',e.target.value)} placeholder="02-XXX-XXXX"/></div>
          </label>
        </div>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" disabled={!ok} onClick={()=>onSave({ ...d, code: 'URO-' + Date.now(), loc: '' })}><Icon k="check" size={14}/><span>บันทึก</span></button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ===== Edit item modal ===== */
function EditItemModal({ cats, item, onClose, onSave, vendors=[], onAddVendor }) {
  const [d, setD] = useS({ ...item });
  function set(k, v) { setD(o => ({ ...o, [k]: v })); }
  const ok = d.ipiss && d.name;
  return (
    <ModalShell title="แก้ไขรายการพัสดุ" onClose={onClose} icon="edit">
      <div className="form">
        <label className="lbl">เลข IPISS *
          <div className="input-wrap"><input value={d.ipiss} onChange={e=>set('ipiss',e.target.value)}/></div>
        </label>
        <label className="lbl">ชื่อพัสดุ *
          <div className="input-wrap"><input value={d.name} onChange={e=>set('name',e.target.value)}/></div>
        </label>
        <div className="form-row">
          <label className="lbl">หมวดหมู่
            <div className="input-wrap"><select value={d.cat} onChange={e=>set('cat',e.target.value)} className="bare-select">
              {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          </label>
          <label className="lbl">หน่วยนับ
            <div className="input-wrap"><input value={d.unit} onChange={e=>set('unit',e.target.value)}/></div>
          </label>
        </div>
        <div className="form-row">
          <label className="lbl">จำนวนคงเหลือ
            <div className="input-wrap"><input type="number" value={d.qty} onChange={e=>set('qty',Number(e.target.value))}/></div>
          </label>
          <label className="lbl">ขั้นต่ำสำหรับแจ้งเตือน
            <div className="input-wrap"><input type="number" value={d.min} onChange={e=>set('min',Number(e.target.value))}/></div>
          </label>
        </div>
        <label className="lbl">ราคา/หน่วย (บาท)
          <div className="input-wrap"><input type="number" value={d.price||0} onChange={e=>set('price',Number(e.target.value))}/></div>
        </label>
        <div className="form-row">
          <label className="lbl">วันหมดอายุ (YYYY-MM-DD)
            <div className="input-wrap"><input value={d.exp||''} onChange={e=>set('exp',e.target.value)} placeholder="2027-12-31"/></div>
          </label>
          <label className="lbl">Lot / เลข OD
            <div className="input-wrap"><input value={d.lot||''} onChange={e=>set('lot',e.target.value)}/></div>
          </label>
        </div>
        <div className="form-row">
          <label className="lbl">บริษัทคู่ค้า / ผู้จำหน่าย
            <VendorCombobox vendors={vendors} value={d.supplier||''}
              onChange={v=>set('supplier',v)} onChangeTel={v=>set('tel',v)}
              onAdd={onAddVendor}/>
          </label>
          <label className="lbl">เบอร์โทรติดต่อ
            <div className="input-wrap"><Icon k="phone" size={15}/><input value={d.tel||''} onChange={e=>set('tel',e.target.value)}/></div>
          </label>
        </div>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" disabled={!ok} onClick={()=>onSave(d)}><Icon k="check" size={14}/><span>บันทึกการแก้ไข</span></button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ===== Google Sheet import modal ===== */
function ImportSheetModal({ onClose, onImport }) {
  const [url, setUrl] = useS('');
  const [csv, setCsv] = useS('');
  const [tab, setTab] = useS('url');
  const sample = `ipiss,code,name,cat,unit,qty,min,price,loc,supplier,tel
7110-101-9001/2569,URO-CA-110,Foley 2-way 18 Fr,cath,เส้น,80,40,80,B-03,Bard,02-693-2244
6515-501-9002/2569,URO-CN-510,Sterile Gauze 4x4,consum,ห่อ,250,100,12,F-03,3M,02-260-8577`;

  function parseCsv(text) {
    const lines = text.trim().split(/\r?\n/);
    const headers = lines.shift().split(',').map(s=>s.trim());
    return lines.map(line => {
      const cells = line.split(',').map(s=>s.trim());
      const o = {};
      headers.forEach((h,i)=>o[h]=cells[i]);
      ['qty','min','price'].forEach(k => { if (o[k] != null) o[k] = Number(o[k]); });
      return o;
    });
  }

  function doImport() {
    const text = tab==='csv' ? csv : sample;  // demo: URL → use sample, CSV → parsed
    onImport(parseCsv(text));
  }

  return (
    <ModalShell title="นำเข้าพัสดุจาก Google Sheet" onClose={onClose} icon="sheet" wide>
      <div className="tabs">
        <button className={cx('tab', tab==='url' && 'is-on')} onClick={()=>setTab('url')}>ลิงก์ Google Sheet</button>
        <button className={cx('tab', tab==='csv' && 'is-on')} onClick={()=>setTab('csv')}>วาง CSV</button>
      </div>

      {tab==='url' && (
        <div className="form">
          <div className="howto">
            <div className="howto-step"><b>1.</b> ใน Google Sheet ไปที่ <i>ไฟล์ → แชร์ → เผยแพร่ทางเว็บ</i> เลือกชีตที่ต้องการ ฟอร์แมต <b>CSV</b></div>
            <div className="howto-step"><b>2.</b> คัดลอกลิงก์มาวางที่ช่องด้านล่าง คอลัมน์ที่ต้องมี: <code>ipiss, code, name, cat, unit, qty, min, price, loc, supplier, tel</code></div>
          </div>
          <label className="lbl">ลิงก์ Google Sheet (CSV)
            <div className="input-wrap">
              <Icon k="sheet" size={16}/>
              <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"/>
            </div>
          </label>
          <div className="import-preview">
            <div className="muted sm">ตัวอย่างข้อมูลที่จะนำเข้า (สาธิต)</div>
            <pre className="codeblock">{sample}</pre>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
            <button className="btn btn-primary" onClick={doImport}><Icon k="upload" size={14}/><span>นำเข้า 2 รายการตัวอย่าง</span></button>
          </div>
        </div>
      )}

      {tab==='csv' && (
        <div className="form">
          <label className="lbl">วางข้อมูล CSV (บรรทัดแรก = หัวคอลัมน์)
            <textarea className="textarea" rows="10" value={csv} onChange={e=>setCsv(e.target.value)} placeholder={sample}/>
          </label>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
            <button className="btn btn-primary" disabled={!csv.trim()} onClick={doImport}><Icon k="upload" size={14}/><span>นำเข้า</span></button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

/* ===== Reusable modal shell ===== */
function ModalShell({ title, icon, onClose, children, wide }) {
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className={cx('modal', wide && 'modal-wide')} onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title"><Icon k={icon||'edit'} size={18}/>{title}</div>
          <button className="icon-btn" onClick={onClose}><Icon k="close" size={14}/></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function Chip({ children, active, onClick, hue, small }) {
  const style = active && hue != null
    ? { background: `oklch(0.92 0.06 ${hue})`, borderColor: `oklch(0.7 0.13 ${hue})`, color: `oklch(0.32 0.13 ${hue})` }
    : {};
  return (
    <button className={cx('chip', active && 'is-on', small && 'is-sm')} style={style} onClick={onClick}>
      {children}
    </button>
  );
}

/* ===== Categories ===== */
function CategoriesScreen({ cats, items }) {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">หมวดหมู่</div>
          <h1 className="page-title">หมวดพัสดุ Uro</h1>
          <div className="page-sub">จัดกลุ่มพัสดุ คุรุภัณฑ์ และอุปกรณ์สิ้นเปลือง</div>
        </div>
      </div>
      <div className="cat-grid">
        {cats.map(c => {
          const list = items.filter(i=>i.cat===c.id);
          const qty = list.reduce((s,i)=>s+i.qty,0);
          const low = list.filter(i=>statusOf(i)!=='ok').length;
          return (
            <div key={c.id} className="cat-card" style={{ '--h': c.hue }}>
              <div className="cat-card-top">
                <div className="cat-glyph" style={{ background: `oklch(0.92 0.06 ${c.hue})`, color: `oklch(0.35 0.13 ${c.hue})` }}>
                  {c.en.slice(0,2).toUpperCase()}
                </div>
                <div className="cat-card-rt">
                  <div className="cat-name">{c.name}</div>
                  <div className="cat-en">{c.en}</div>
                </div>
              </div>
              <div className="cat-stats">
                <div><b>{list.length}</b><span>รายการ</span></div>
                <div><b>{fmt(qty)}</b><span>คงเหลือ</span></div>
                <div className={low?'bad':''}><b>{low}</b><span>ต้องเติม</span></div>
              </div>
              <div className="cat-foot">
                <span>ที่เก็บ {list[0]?.loc?.split('-')[0]}-XX</span>
                <button className="btn btn-link sm">ดูรายการ <Icon k="chev" size={12}/></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===== StockIn / StockOut shared form ===== */
// Months until a CE 'YYYY-MM-DD' date; null if unparseable
function monthsUntil(s) {
  if (!s) return null;
  const [y,m,d] = s.split('-').map(Number);
  if (!y) return null;
  const dt = new Date(y, (m||1)-1, d||1);
  return (dt - new Date()) / (86400000 * 30.4375);
}
function StockMoveScreen({ kind, items, cats, prefill, onSubmit, user }) {
  const isIn = kind === 'IN';
  const who = user?.name || 'พว. ปิยะพงษ์';
  const [code, setCode] = useS(prefill || '');
  const [qty, setQty] = useS(1);
  const [od, setOd] = useS('');
  const [exp, setExp] = useS('');
  const [note, setNote] = useS('');
  const [batch, setBatch] = useS([]);

  useE(() => { if (prefill) setCode(prefill); }, [prefill]);
  const item = items.find(i => i.code === code);
  const expM = isIn ? monthsUntil(exp) : null;

  function addToBatch() {
    if (!item || !qty) return;
    if (isIn) {
      setBatch(b => [...b, { code: item.code, name: item.name, qty: Number(qty), unit: item.unit, od, exp }]);
    } else {
      setBatch(b => [...b, { code: item.code, name: item.name, qty: Number(qty), unit: item.unit, note, by: who }]);
    }
    setCode(''); setQty(1); setOd(''); setExp(''); setNote('');
  }

  function clearForm() { setCode(''); setQty(1); setOd(''); setExp(''); setNote(''); }

  function submit() {
    if (!batch.length) return;
    onSubmit(batch);
    setBatch([]);
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">{isIn ? 'รับเข้า' : 'เบิกออก'}</div>
          <h1 className="page-title">{isIn ? 'บันทึกรับเข้าพัสดุ' : 'บันทึกการเบิกออก'}</h1>
          <div className="page-sub">{isIn ? 'อัปเดตสต๊อกหลังรับของจากฝ่ายพัสดุ/ผู้จำหน่าย' : 'บันทึกการเบิกเข้าเคสผ่าตัด · แสกน QR เพื่อความรวดเร็ว'}</div>
        </div>
      </div>

      <div className="grid-2 grid-2-stick">
        <section className="card">
          <div className="card-head">
            <div className="card-title">{isIn ? 'เพิ่มรายการรับเข้า' : 'เพิ่มรายการเบิก'}</div>
            <button className="btn btn-ghost sm"><Icon k="scan" size={14}/><span>สแกน QR</span></button>
          </div>
          <div className="form">
            <label className="lbl">รหัสพัสดุ / ชื่อพัสดุ
              <div className="input-wrap">
                <Icon k="search" size={16}/>
                <input list="codes" value={code} onChange={e=>setCode(e.target.value)} placeholder="พิมพ์รหัส หรือชื่อ…"/>
                <datalist id="codes">
                  {items.map(i => <option key={i.code} value={i.code}>{i.name}</option>)}
                </datalist>
              </div>
            </label>
            {item && (
              <div className="item-preview">
                <div>
                  <div className="td-name-main">{item.name}</div>
                  <div className="muted sm">{item.code} · ที่เก็บ {item.loc} · คงเหลือ <b>{item.qty}</b> {item.unit}</div>
                </div>
                <StatusPill s={statusOf(item)}/>
              </div>
            )}

            {isIn ? (
              <>
                <div className="form-row">
                  <label className="lbl">จำนวน
                    <div className="qty-stepper">
                      <button onClick={()=>setQty(q=>Math.max(1, Number(q)-1))}><Icon k="minus" size={14}/></button>
                      <input type="number" value={qty} onChange={e=>setQty(e.target.value)} min="1"/>
                      <button onClick={()=>setQty(q=>Number(q)+1)}><Icon k="plus" size={14}/></button>
                    </div>
                  </label>
                  <label className="lbl">เลขที่ OD
                    <div className="input-wrap">
                      <Icon k="truck" size={15}/>
                      <input value={od} onChange={e=>setOd(e.target.value)} placeholder="OD-2569-XXXX"/>
                    </div>
                  </label>
                </div>

                <label className="lbl">วันหมดอายุ (Expire)
                  <div className="input-wrap">
                    <Icon k="cal" size={15}/>
                    <input type="date" value={exp} onChange={e=>setExp(e.target.value)}/>
                  </div>
                </label>
                {expM != null && expM <= 3 && (
                  <div className={cx('exp-warn', expM < 0 ? 'is-bad' : '')}>
                    <Icon k={expM < 0 ? 'alert' : 'clock'} size={15}/>
                    <span>{expM < 0
                      ? 'วันหมดอายุนี้เลยกำหนดแล้ว — ตรวจสอบก่อนรับเข้า'
                      : `ใกล้หมดอายุ — เหลือ ~${Math.max(0, Math.round(expM*10)/10)} เดือน ระบบจะแจ้งเตือน (เกณฑ์ 3 เดือน)`}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <label className="lbl">จำนวน
                  <div className="qty-stepper">
                    <button onClick={()=>setQty(q=>Math.max(1, Number(q)-1))}><Icon k="minus" size={14}/></button>
                    <input type="number" value={qty} onChange={e=>setQty(e.target.value)} min="1"/>
                    <button onClick={()=>setQty(q=>Number(q)+1)}><Icon k="plus" size={14}/></button>
                  </div>
                </label>

                <div className="who-row">
                  <div className="who-av">{user?.initials || 'ปย'}</div>
                  <div>
                    <div className="who-lbl">ผู้เบิก</div>
                    <div className="who-name">{who}</div>
                  </div>
                  <span className="who-tag">จาก Login</span>
                </div>

                <label className="lbl">หมายเหตุ <span className="lbl-opt">(ไม่บังคับ)</span>
                  <div className="input-wrap">
                    <input value={note} onChange={e=>setNote(e.target.value)} placeholder="เช่น เคส/ผู้ป่วย/ห้องผ่าตัด"/>
                  </div>
                </label>
              </>
            )}

            <div className="form-actions">
              <button className="btn btn-ghost" onClick={clearForm}>ล้าง</button>
              <button className="btn btn-primary" onClick={addToBatch} disabled={!item || !qty}>
                <Icon k="plus" size={14}/><span>เพิ่มในรายการ</span>
              </button>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <div className="card-title">รายการที่จะ{isIn?'รับเข้า':'เบิก'} · {batch.length} รายการ</div>
            <span className="muted sm">{new Date().toLocaleString('th-TH', { dateStyle:'medium', timeStyle:'short' })}</span>
          </div>

          {batch.length === 0 ? (
            <div className="empty">
              <div className="empty-mark"><Icon k={isIn?'in':'out'} size={28}/></div>
              <div className="empty-t">ยังไม่มีรายการ</div>
              <div className="empty-s">เพิ่มรายการจากฟอร์มซ้ายมือ หรือสแกน QR</div>
            </div>
          ) : (
            <>
              <ul className="batchlist">
                {batch.map((b, i) => (
                  <li key={i}>
                    <div>
                      <div className="td-name-main">{b.name}</div>
                      <div className="muted sm">{isIn
                        ? <>{b.code} · OD {b.od || '—'}{b.exp ? ` · Exp ${b.exp}` : ''}</>
                        : <>{b.code} · ผู้เบิก {b.by}{b.note ? ` · ${b.note}` : ''}</>}</div>
                    </div>
                    <div className="batch-r">
                      <div className={cx('big-qty', isIn?'is-pos':'is-neg')}>{isIn?'+':'−'}{b.qty}<span> {b.unit}</span></div>
                      <button className="icon-btn" onClick={()=>setBatch(arr=>arr.filter((_,j)=>j!==i))}><Icon k="trash" size={14}/></button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="batch-foot">
                <div className="muted">ผู้บันทึก: <b>{who}</b></div>
                <button className="btn btn-primary lg" onClick={submit}>
                  <Icon k="check" size={16}/><span>ยืนยัน{isIn?'รับเข้า':'เบิกออก'} {batch.length} รายการ</span>
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

/* ===== Reports ===== */
function downloadCSV(filename, rows) {
  const esc = v => {
    const s = String(v == null ? '' : v);
    return (s.includes(',') || s.includes('"') || s.includes('\n'))
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = '﻿' + rows.map(r => r.map(esc).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function ReportsScreen({ items, txns, cats }) {
  const [tab, setTab] = useS('movement');
  const [typeF, setTypeF] = useS('all');
  const [showFilter, setShowFilter] = useS(false);
  const [dateFrom, setDateFrom] = useS('');
  const [dateTo, setDateTo] = useS('');

  const catMap = useM(() => Object.fromEntries((cats||[]).map(c=>[c.id, c.name])), [cats]);

  const filtered = useM(() => txns.filter(t => {
    if (typeF !== 'all' && t.type !== typeF) return false;
    if (dateFrom || dateTo) {
      const d = (t.date||'').slice(0,10);
      if (dateFrom && d < dateFrom) return false;
      if (dateTo   && d > dateTo)   return false;
    }
    return true;
  }), [txns, typeF, dateFrom, dateTo]);

  const byType = {
    IN:  filtered.filter(t=>t.type==='IN').reduce((s,t)=>s+Math.abs(t.qty),0),
    OUT: filtered.filter(t=>t.type==='OUT').reduce((s,t)=>s+Math.abs(t.qty),0),
    ADJ: filtered.filter(t=>t.type==='ADJ').reduce((s,t)=>s+Math.abs(t.qty),0),
  };

  function exportMovement() {
    const rows = [['เลขที่','วันที่','ประเภท','รหัสพัสดุ','ชื่อพัสดุ','จำนวน','หน่วย','ผู้บันทึก','หมายเหตุ']];
    filtered.forEach(t => rows.push([
      t.id, t.date,
      t.type==='IN'?'รับเข้า':t.type==='OUT'?'เบิกออก':'ปรับยอด',
      t.code, t.name,
      (t.type==='OUT'?'-':'+')+Math.abs(t.qty),
      t.unit||'', t.by||'', t.note||'',
    ]));
    downloadCSV('ประวัติการเคลื่อนไหวพัสดุ.csv', rows);
  }

  function exportStock() {
    const rows = [['รหัสพัสดุ','รหัส IPISS','ชื่อพัสดุ','หมวดหมู่','จำนวนคงเหลือ','หน่วย','ขั้นต่ำ','ราคา/หน่วย (บาท)','มูลค่าคงเหลือ (บาท)','วันหมดอายุ','ที่เก็บ','สถานะ']];
    items.forEach(i => {
      const status = (i.qty||0)<=0?'หมด':(i.qty||0)<=(i.min||0)?'ต่ำกว่าขั้นต่ำ':'ปกติ';
      rows.push([i.code, i.ipiss||'', i.name, catMap[i.cat]||i.cat||'',
        i.qty||0, i.unit||'', i.min||0, i.price||0,
        (i.qty||0)*(i.price||0), i.exp||'', i.loc||'', status]);
    });
    downloadCSV('รายงานพัสดุคงเหลือ.csv', rows);
  }

  const activeFilters = typeF !== 'all' || dateFrom || dateTo;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">รายงาน</div>
          <h1 className="page-title">รายงานพัสดุ</h1>
        </div>
        <div className="page-head-actions">
          {tab === 'movement' && <>
            <button className={cx('btn', activeFilters ? 'btn-primary' : 'btn-ghost')} onClick={()=>setShowFilter(f=>!f)}>
              <Icon k="filter" size={16}/><span>ตัวกรอง{activeFilters ? ' ●' : ''}</span>
            </button>
            <button className="btn btn-ghost" onClick={exportMovement}>
              <Icon k="download" size={16}/><span>ส่งออก CSV</span>
            </button>
          </>}
          {tab === 'stock' && (
            <button className="btn btn-primary" onClick={exportStock}>
              <Icon k="download" size={16}/><span>ส่งออก Excel</span>
            </button>
          )}
        </div>
      </div>

      {tab === 'movement' && showFilter && (
        <div className="filter-panel">
          <div className="fp-row">
            <span className="fp-lbl">ประเภท</span>
            <div className="chips-row" style={{marginBottom:0}}>
              {[['all','ทั้งหมด'],['IN','รับเข้า'],['OUT','เบิกออก'],['ADJ','ปรับยอด']].map(([v,l])=>(
                <Chip key={v} active={typeF===v} onClick={()=>setTypeF(v)}>{l}</Chip>
              ))}
            </div>
          </div>
          <div className="fp-row">
            <span className="fp-lbl">ช่วงวันที่</span>
            <input type="date" className="fp-date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/>
            <span className="fp-sep">—</span>
            <input type="date" className="fp-date" value={dateTo} onChange={e=>setDateTo(e.target.value)}/>
            {activeFilters && (
              <button className="btn btn-ghost sm" onClick={()=>{setDateFrom('');setDateTo('');setTypeF('all');}}>ล้าง</button>
            )}
          </div>
        </div>
      )}

      <div className="chips-row">
        <Chip active={tab==='movement'} onClick={()=>{setTab('movement');setShowFilter(false);}}>ประวัติการเคลื่อนไหว</Chip>
        <Chip active={tab==='stock'} onClick={()=>{setTab('stock');setShowFilter(false);}}>สรุปพัสดุคงเหลือ ({items.length})</Chip>
      </div>

      {tab === 'movement' && <>
        <div className="stat-grid stat-grid-3">
          <StatCard tone="ok"     icon="in"   big={fmt(byType.IN)}  label="หน่วยที่รับเข้า"  sub={`${filtered.filter(t=>t.type==='IN').length} ใบ`}/>
          <StatCard tone="warn"   icon="out"  big={fmt(byType.OUT)} label="หน่วยที่เบิกออก" sub={`${filtered.filter(t=>t.type==='OUT').length} ใบ`}/>
          <StatCard tone="accent" icon="edit" big={fmt(byType.ADJ)} label="หน่วยที่ปรับยอด" sub={`${filtered.filter(t=>t.type==='ADJ').length} ใบ`}/>
        </div>

        <section className="card card-table">
          <div className="card-head">
            <div className="card-title">ประวัติการเคลื่อนไหว <span className="muted sm">({filtered.length} รายการ)</span></div>
            <div className="legend">
              <span className="legend-item"><span className="dot" style={{background:'var(--ok)'}}/>รับเข้า</span>
              <span className="legend-item"><span className="dot" style={{background:'var(--warn)'}}/>เบิกออก</span>
              <span className="legend-item"><span className="dot" style={{background:'var(--accent)'}}/>ปรับยอด</span>
            </div>
          </div>
          <div className="thead thead-rep">
            <div className="th">เลขที่</div>
            <div className="th">วันที่</div>
            <div className="th">ประเภท</div>
            <div className="th">พัสดุ</div>
            <div className="th th-num">จำนวน</div>
            <div className="th">ผู้บันทึก / หมายเหตุ</div>
          </div>
          <div className="tbody">
            {filtered.length === 0 && (
              <div style={{padding:'32px',textAlign:'center',color:'var(--ink-3)'}}>ไม่พบรายการที่ตรงกับตัวกรอง</div>
            )}
            {filtered.map(t => (
              <div key={t.id} className="tr tr-rep">
                <div className="td mono">{t.id}</div>
                <div className="td">{t.date}</div>
                <div className="td">
                  <span className={cx('txn-type', `txn-${t.type.toLowerCase()}`)}>
                    <Icon k={t.type==='IN'?'in':t.type==='OUT'?'out':'edit'} size={14}/>
                    <span>{t.type==='IN'?'รับ':t.type==='OUT'?'เบิก':'ปรับ'}</span>
                  </span>
                </div>
                <div className="td">
                  <div className="td-name-main">{t.name}</div>
                  <div className="muted sm mono">{t.code}</div>
                </div>
                <div className="td td-num">
                  <span className={cx(t.type==='OUT'&&'is-neg', t.type==='IN'&&'is-pos')}>
                    {t.type==='OUT'?'−':t.type==='IN'?'+':''}{Math.abs(t.qty)} {t.unit}
                  </span>
                </div>
                <div className="td">
                  <div>{t.by}</div>
                  <div className="muted sm">{t.note}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </>}

      {tab === 'stock' && (
        <section className="card card-table">
          <div className="card-head">
            <div className="card-title">พัสดุคงเหลือทั้งหมด <span className="muted sm">({items.length} รายการ)</span></div>
          </div>
          <div className="thead" style={{gridTemplateColumns:'110px 1fr 130px 80px 70px 90px 110px 100px'}}>
            <div className="th">รหัสพัสดุ</div>
            <div className="th">ชื่อพัสดุ</div>
            <div className="th">หมวดหมู่</div>
            <div className="th th-num">คงเหลือ</div>
            <div className="th th-num">ขั้นต่ำ</div>
            <div className="th th-num">ราคา/หน่วย</div>
            <div className="th th-num">มูลค่าคงเหลือ</div>
            <div className="th">สถานะ</div>
          </div>
          <div className="tbody">
            {items.map(i => {
              const st = (i.qty||0)<=0?'out':(i.qty||0)<=(i.min||0)?'low':'ok';
              return (
                <div key={i.code} className="tr" style={{gridTemplateColumns:'110px 1fr 130px 80px 70px 90px 110px 100px'}}>
                  <div className="td mono sm">{i.code}</div>
                  <div className="td">
                    <div className="td-name-main">{i.name}</div>
                    {i.loc && <div className="muted sm">{i.loc}</div>}
                  </div>
                  <div className="td">{catMap[i.cat]||i.cat||'—'}</div>
                  <div className="td td-num">
                    <b className={st==='out'?'bad':st==='low'?'warn-t':''}>{i.qty||0}</b>
                    <span className="muted sm"> {i.unit}</span>
                  </div>
                  <div className="td td-num muted">{i.min||0}</div>
                  <div className="td td-num muted">{fmt(i.price||0)}</div>
                  <div className="td td-num">{fmt((i.qty||0)*(i.price||0))}</div>
                  <div className="td">
                    <span className={cx('pill', st==='out'?'pill-out':st==='low'?'pill-warn':'pill-ok')}>
                      <span className="pill-dot"/>
                      {st==='out'?'หมด':st==='low'?'ต่ำกว่าขั้นต่ำ':'ปกติ'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{padding:'12px 16px',borderTop:'1px solid var(--border)',textAlign:'right',fontSize:'13px',color:'var(--ink-2)'}}>
            มูลค่าพัสดุคงเหลือรวม: <b style={{fontSize:'15px',color:'var(--ink)'}}>
              {fmt(items.reduce((s,i)=>s+(i.qty||0)*(i.price||0),0))} บาท
            </b>
          </div>
        </section>
      )}
    </div>
  );
}

Object.assign(window, { Dashboard, ItemsScreen, CategoriesScreen, StockMoveScreen, ReportsScreen, EquipmentScreen, POScreen, RemainingScreen, TrendBars, SMCGuideScreen });

/* ===== TrendBars (12-month / 5-year) ===== */
function TrendBars({ data, big }) {
  const max = Math.max(...data.map(d=>d.total), 1);
  return (
    <div className="trend">
      <div className="trend-grid">
        {[1,0.75,0.5,0.25,0].map((p,i) => (
          <div key={i} className="chart-grid-row">
            <span className="chart-yl">{fmt(Math.round(max*p))}</span>
            <span className="chart-gline"/>
          </div>
        ))}
      </div>
      <div className="trend-bars" style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}>
        {data.map((d,i) => (
          <div key={i} className="trend-col" title={`${d.label}: ${fmt(d.total)} หน่วย · ${fmt(d.value)} บาท`}>
            <div className="trend-val">{fmt(d.total)}</div>
            <div className="trend-bar"
                 style={{
                   height: `${(d.total/max)*100}%`,
                   background: `linear-gradient(180deg, var(--accent-2), var(--accent))`,
                 }}/>
            <div className="trend-xl">{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== Equipment (ครุภัณฑ์) ===== */
function eqAgeYears(received) {
  // received in Buddhist year YYYY-MM-DD format (พ.ศ.). Convert to CE
  const [by, m, d] = received.split('-').map(Number);
  const ce = by - 543;
  const recv = new Date(ce, m-1, d);
  const now = new Date();
  const diff = (now - recv) / (1000*60*60*24*365.25);
  return diff;
}
function ageBadge(years) {
  if (years >= 5)  return { tone:'bad',  text:'อายุเกิน 5 ปี — ตรวจสอบ' };
  if (years >= 3)  return { tone:'warn', text:'ใกล้ครบเกณฑ์' };
  return { tone:'ok', text:'อยู่ในเกณฑ์' };
}

function EquipmentScreen({ equipment, canEdit, onAddEquipment, onEditEquipment, onDeleteEquipment, vendors=[], onAddVendor }) {
  const [filter, setFilter] = useS('all');
  const [searchQ, setSearchQ] = useS('');
  const [showAdd, setShowAdd] = useS(false);
  const [editEq, setEditEq] = useS(null);

  const enriched = equipment.map(e => {
    const yrs = eqAgeYears(e.received);
    return { ...e, years: yrs, badge: ageBadge(yrs) };
  });

  const overdue = enriched.filter(e => e.years >= 5).length;
  const totalCost = enriched.reduce((s,e)=>s+e.cost,0);

  const filtered = enriched
    .filter(e => {
      if (filter === 'alert' && e.years < 5) return false;
      if (filter === 'ok'    && e.years >= 5) return false;
      if (searchQ) {
        const q = searchQ.toLowerCase();
        return (e.eq_no||'').toLowerCase().includes(q)
            || (e.name||'').toLowerCase().includes(q)
            || (e.supplier||'').toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => b.years - a.years);

  function exportEquipment() {
    const rows = [['เลขครุภัณฑ์','ชื่อครุภัณฑ์','บริษัทผู้จำหน่าย','มูลค่า (บาท)','วันที่รับไว้ (ค.ศ.)','อายุ (ปี)','สภาพ','หมายเหตุ','สถานะ']];
    enriched.forEach(e => {
      rows.push([
        e.eq_no, e.name, e.supplier||'', e.cost||0,
        beToCE(e.received), e.years.toFixed(1),
        e.cond||'', e.note||'',
        e.years>=5?'เกิน 5 ปี':e.years>=3?'ใกล้ครบเกณฑ์':'อยู่ในเกณฑ์',
      ]);
    });
    downloadCSV('ทะเบียนครุภัณฑ์.csv', rows);
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">ครุภัณฑ์ · Equipment</div>
          <h1 className="page-title">ทะเบียนครุภัณฑ์ห้องผ่าตัด Uro</h1>
          <div className="page-sub">รวม {enriched.length} ชิ้น · มูลค่ารวม {fmt(totalCost)} บาท · ระบบจะแจ้งเตือนอัตโนมัติเมื่อครุภัณฑ์อายุการใช้งานเกิน <b>5 ปี</b></div>
        </div>
        <div className="page-head-actions">
          <button className="btn btn-ghost" onClick={exportEquipment}><Icon k="download" size={16}/><span>ส่งออก Excel</span></button>
          {canEdit && <button className="btn btn-primary" onClick={()=>setShowAdd(true)}><Icon k="plus" size={16}/><span>เพิ่มครุภัณฑ์</span></button>}
        </div>
      </div>

      {overdue > 0 && (
        <div className="banner banner-bad">
          <Icon k="alert" size={18}/>
          <div>
            <b>มีครุภัณฑ์ {overdue} ชิ้น อายุการใช้งานเกิน 5 ปี</b>
            <div className="muted sm">ควรประเมินสภาพและจำหน่าย/เปลี่ยนทดแทนตามระเบียบพัสดุ</div>
          </div>
          <button className="btn btn-ghost sm" onClick={()=>setFilter('alert')}>ดูเฉพาะรายการที่ต้องตรวจ</button>
        </div>
      )}

      {/* Search + filter row */}
      <div style={{display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap', marginBottom:'4px'}}>
        <div className="smc-search-wrap" style={{flex:'1 1 220px', minWidth:'180px'}}>
          <Icon k="search" size={16} className="smc-search-icon"/>
          <input className="smc-search" placeholder="ค้นหาเลขครุภัณฑ์, ชื่อ, บริษัท…"
            value={searchQ} onChange={e=>setSearchQ(e.target.value)}/>
        </div>
        <div className="chips-row" style={{marginBottom:0, flexShrink:0}}>
          <Chip active={filter==='all'}   onClick={()=>setFilter('all')}>ทั้งหมด ({enriched.length})</Chip>
          <Chip active={filter==='alert'} onClick={()=>setFilter('alert')}>เกิน 5 ปี ({overdue})</Chip>
          <Chip active={filter==='ok'}    onClick={()=>setFilter('ok')}>อยู่ในเกณฑ์ ({enriched.length-overdue})</Chip>
        </div>
      </div>

      <div className="ic-grid">
        {filtered.length === 0 && (
          <div style={{gridColumn:'1/-1', padding:'32px', textAlign:'center', color:'var(--ink-3)'}}>ไม่พบรายการที่ตรงกับคำค้นหา</div>
        )}
        {filtered.map(e => {
          const alert = e.years >= 5;
          const yp = Math.min(1, e.years / 10);
          return (
            <div key={e.eq_no} className={cx('eq-card', alert && 's-out')}>
              <div className="eq-card-top">
                <span className="mono" style={{ fontSize:'11px', color:'var(--ink-3)' }}>{e.eq_no}</span>
                <span className={cx('pill', `pill-${e.badge.tone==='ok'?'ok':e.badge.tone==='warn'?'warn':'out'}`)}>
                  <span className="pill-dot"/>{e.badge.text}
                </span>
              </div>
              <div className="ic-name" style={{ marginTop:'6px', fontSize:'14px' }}>{e.name}</div>
              {e.supplier && (
                <div className="vendor-line" style={{ marginTop:'4px' }}>
                  <Icon k="building" size={11}/><span className="vendor-co" style={{ fontSize:'11.5px' }}>{e.supplier}</span>
                </div>
              )}
              <div className="eq-card-age">
                <div className="qty-num"><b className={alert?'bad':''}>{e.years.toFixed(1)}</b><span className="qty-unit"> ปี</span></div>
                <div className="age-bar" style={{ flex:1 }}>
                  <span style={{ width:`${yp*100}%`, background: alert?'var(--bad)':e.years>=3?'var(--warn)':'var(--ok)' }}/>
                  <span className="age-mark" style={{ left:'50%' }}/>
                </div>
              </div>
              <div className="muted sm" style={{ marginTop:'6px' }}>{e.loc}{e.cond ? ` · ${e.cond}` : ''}</div>
              <div className="eq-card-foot">
                <div className="muted sm">มูลค่า {fmt(e.cost)} บาท · รับ {beToCE(e.received)}</div>
                {canEdit && (
                  <div style={{ display:'flex', gap:'4px' }}>
                    <button className="btn btn-mini btn-ghost" onClick={()=>setEditEq(e)}>✏️</button>
                    <button className="btn btn-mini btn-danger" onClick={()=>{ if(window.confirm(`ลบ "${e.name}"?`)) onDeleteEquipment(e.eq_no); }}>🗑️</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && <AddEquipmentModal vendors={vendors} onAddVendor={onAddVendor} onClose={()=>setShowAdd(false)} onSave={(d)=>{ onAddEquipment(d); setShowAdd(false); }}/>}
      {editEq && <EditEquipmentModal eq={editEq} vendors={vendors} onAddVendor={onAddVendor} onClose={()=>setEditEq(null)} onSave={(d)=>{ onEditEquipment(d); setEditEq(null); }}/>}
    </div>
  );
}

/* ===== Equipment modals ===== */
function AddEquipmentModal({ onClose, onSave, vendors=[], onAddVendor }) {
  const today = new Date();
  const be = `${today.getFullYear()+543}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const [d, setD] = useS({ eq_no:'', name:'', received: be, cost:0, cond:'ปกติ', note:'', supplier:'' });
  function set(k,v){ setD(o=>({...o,[k]:v})); }
  const ok = d.eq_no && d.name;
  return (
    <ModalShell title="เพิ่มครุภัณฑ์ใหม่" onClose={onClose} icon="plus">
      <div className="form">
        <div className="form-row">
          <label className="lbl">เลขครุภัณฑ์ *
            <div className="input-wrap"><input value={d.eq_no} onChange={e=>set('eq_no',e.target.value)} placeholder="EQ-2569-XXXX"/></div>
          </label>
          <label className="lbl">วันที่รับไว้
            <ThaiDatePicker value={d.received} onChange={v=>set('received',v)}/>
          </label>
        </div>
        <label className="lbl">ชื่อครุภัณฑ์ *
          <div className="input-wrap"><input value={d.name} onChange={e=>set('name',e.target.value)} placeholder="เช่น Flexible Cystoscope"/></div>
        </label>
        <label className="lbl">บริษัทผู้จำหน่าย
          <VendorCombobox vendors={vendors} value={d.supplier}
            onChange={v=>set('supplier',v)} onChangeTel={()=>{}}
            onAdd={onAddVendor} placeholder="เลือกหรือพิมพ์ชื่อบริษัท…"/>
        </label>
        <label className="lbl">มูลค่า (บาท)
          <div className="input-wrap"><input type="number" value={d.cost} onChange={e=>set('cost',Number(e.target.value))}/></div>
        </label>
        <div className="form-row">
          <label className="lbl">สภาพ
            <div className="input-wrap"><select value={d.cond} onChange={e=>set('cond',e.target.value)} className="bare-select">
              {['ปกติ','ชำรุด','ซ่อมบำรุง','รอจำหน่าย'].map(c=><option key={c}>{c}</option>)}
            </select></div>
          </label>
          <label className="lbl">หมายเหตุ
            <div className="input-wrap"><input value={d.note} onChange={e=>set('note',e.target.value)}/></div>
          </label>
        </div>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" disabled={!ok} onClick={()=>onSave({ ...d, loc: '' })}><Icon k="check" size={14}/><span>บันทึก</span></button>
        </div>
      </div>
    </ModalShell>
  );
}

function EditEquipmentModal({ eq, onClose, onSave, vendors=[], onAddVendor }) {
  const [d, setD] = useS({ ...eq });
  function set(k,v){ setD(o=>({...o,[k]:v})); }
  const ok = d.eq_no && d.name;
  return (
    <ModalShell title="แก้ไขครุภัณฑ์" onClose={onClose} icon="edit">
      <div className="form">
        <div className="form-row">
          <label className="lbl">เลขครุภัณฑ์ *
            <div className="input-wrap"><input value={d.eq_no} onChange={e=>set('eq_no',e.target.value)}/></div>
          </label>
          <label className="lbl">วันที่รับไว้
            <ThaiDatePicker value={d.received||''} onChange={v=>set('received',v)}/>
          </label>
        </div>
        <label className="lbl">ชื่อครุภัณฑ์ *
          <div className="input-wrap"><input value={d.name} onChange={e=>set('name',e.target.value)}/></div>
        </label>
        <label className="lbl">บริษัทผู้จำหน่าย
          <VendorCombobox vendors={vendors} value={d.supplier||''}
            onChange={v=>set('supplier',v)} onChangeTel={()=>{}}
            onAdd={onAddVendor} placeholder="เลือกหรือพิมพ์ชื่อบริษัท…"/>
        </label>
        <label className="lbl">มูลค่า (บาท)
          <div className="input-wrap"><input type="number" value={d.cost||0} onChange={e=>set('cost',Number(e.target.value))}/></div>
        </label>
        <div className="form-row">
          <label className="lbl">สภาพ
            <div className="input-wrap"><select value={d.cond||'ปกติ'} onChange={e=>set('cond',e.target.value)} className="bare-select">
              {['ปกติ','ชำรุด','ซ่อมบำรุง','รอจำหน่าย'].map(c=><option key={c}>{c}</option>)}
            </select></div>
          </label>
          <label className="lbl">หมายเหตุ
            <div className="input-wrap"><input value={d.note||''} onChange={e=>set('note',e.target.value)}/></div>
          </label>
        </div>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" disabled={!ok} onClick={()=>onSave(d)}><Icon k="check" size={14}/><span>บันทึกการแก้ไข</span></button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ===== PO Tracking ===== */
function poWaitDays(date_ordered, received_date) {
  // BE date YYYY-MM-DD → CE
  const parse = (s) => { const [by,m,d] = s.split('-').map(Number); return new Date(by-543, m-1, d); };
  const start = parse(date_ordered);
  const end = received_date ? parse(received_date) : new Date();
  return Math.floor((end - start) / (1000*60*60*24));
}

function POScreen({ pos = [], onChange, canEdit, items = [], onReceive }) {
  const [showAdd, setShowAdd] = useS(false);
  const [editPO, setEditPO] = useS(null);
  const [now, setNow] = useS(Date.now());
  const [confirmOd, setConfirmOd] = useS(null);
  const [q, setQ] = useS('');
  const [receiveDate, setReceiveDate] = useS(() => { const t = new Date(); return `${t.getFullYear()+543}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`; });
  const [expDate, setExpDate] = useS('');

  // Real-time tick every 30s (visual cue for "live")
  useE(() => { const t = setInterval(()=>setNow(Date.now()), 30000); return ()=>clearInterval(t); }, []);

  const enriched = pos.map(p => {
    const days = poWaitDays(p.date_ordered, p.received_date);
    const over180 = days > 180 && p.status !== 'RECEIVED';
    const ratio = Math.min(1, days/Math.max(p.est_days, 1));
    return { ...p, days, over180, ratio };
  }).sort((a, b) => {
    // over180 → pending/shipped → received
    const rank = p => p.status === 'RECEIVED' ? 2 : p.over180 ? 0 : 1;
    return rank(a) - rank(b);
  });

  const counts = {
    pending: enriched.filter(p=>p.status==='PENDING').length,
    shipped: enriched.filter(p=>p.status==='SHIPPED').length,
    received: enriched.filter(p=>p.status==='RECEIVED').length,
    alert: enriched.filter(p=>p.over180).length,
  };

  function addPO(d) {
    onChange([{ ...d, status:'PENDING' }, ...pos]);
  }

  function startConfirmReceive(od_no) {
    const t = new Date();
    const today = `${t.getFullYear()+543}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
    setReceiveDate(today);
    setExpDate('');
    setConfirmOd(od_no);
  }

  function doReceive(p) {
    if (onReceive) {
      onReceive(p.od_no, receiveDate, p.line_items || [], expDate);
    } else {
      onChange(pos.map(x => x.od_no===p.od_no ? { ...x, status:'RECEIVED', received_date: receiveDate } : x));
    }
    setConfirmOd(null);
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">ติดตาม OD · Purchase Order</div>
          <h1 className="page-title">ติดตามใบสั่งซื้อ (OD)</h1>
          <div className="page-sub">
            <span className="live-dot"/>ระบบนับวันรอคอยแบบเรียลไทม์ · อัปเดต {new Date(now).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit',second:'2-digit'})} น. · แจ้งเตือนเมื่อรอเกิน <b>180 วัน</b>
          </div>
        </div>
        <div className="page-head-actions">
          {canEdit && <button className="btn btn-primary" onClick={()=>setShowAdd(true)}><Icon k="plus" size={16}/><span>เพิ่ม OD</span></button>}
        </div>
      </div>

      <div className="stat-grid">
        <StatCard tone="accent" icon="truck" big={fmt(counts.pending+counts.shipped)} label="กำลังรอ" sub={`${counts.pending} รอจัดส่ง · ${counts.shipped} ขนส่งแล้ว`}/>
        <StatCard tone="ok"     icon="check" big={fmt(counts.received)} label="รับของแล้ว" sub="ในรอบนี้"/>
        <StatCard tone="bad"    icon="alert" big={fmt(counts.alert)} label="รอเกิน 180 วัน" sub="ต้องติดตามผู้จำหน่าย"/>
      </div>

      <div className="smc-search-wrap" style={{marginBottom:'12px'}}>
        <Icon k="search" size={16} className="smc-search-icon"/>
        <input
          className="smc-search"
          placeholder="ค้นหาเลข OD, ชื่อสินค้า, ผู้จำหน่าย…"
          value={q} onChange={e=>setQ(e.target.value)}
        />
      </div>

      {counts.alert > 0 && (
        <div className="banner banner-bad">
          <Icon k="alert" size={18}/>
          <div>
            <b>มี OD {counts.alert} ฉบับ รอรับของเกิน 180 วัน</b>
            <div className="muted sm">ติดต่อฝ่ายพัสดุ/ผู้จำหน่ายเพื่อตรวจสอบสถานะ และพิจารณายกเลิกสัญญาตามระเบียบ</div>
          </div>
        </div>
      )}

      <section className="card" style={{padding:0,overflow:'hidden'}}>
        <div className="card-head" style={{padding:'var(--card-pad)',borderBottom:'1px solid var(--bd-2)'}}>
          <div className="card-title">รายการ OD ทั้งหมด</div>
          <div className="legend">
            <span className="legend-item"><span className="dot" style={{background:'var(--ok)'}}/>รับของแล้ว</span>
            <span className="legend-item"><span className="dot" style={{background:'var(--warn)'}}/>กำลังรอ</span>
            <span className="legend-item"><span className="dot" style={{background:'var(--bad)'}}/>เกิน 180 วัน</span>
          </div>
        </div>
        <div className="od-grid">
          {enriched.filter(p => {
            if (!q) return true;
            const s = q.toLowerCase();
            return p.od_no?.toLowerCase().includes(s)
              || p.vendor?.toLowerCase().includes(s)
              || p.items?.toLowerCase().includes(s)
              || (Array.isArray(p.line_items) && p.line_items.some(li => li.name?.toLowerCase().includes(s)));
          }).map(p => {
            const badgeClass = p.status==='RECEIVED' ? 'is-done-b' : p.over180 ? 'is-alert-b' : 'is-pending-b';
            const isPending = p.status !== 'RECEIVED' && !p.over180;
            return (
              <div key={p.od_no} className={cx('od-card', p.over180&&'is-alert', isPending&&'is-pending', p.status==='RECEIVED'&&'is-done')}>
                {/* Header */}
                <div className="od-head">
                  <div className={cx('od-badge', badgeClass)}>
                    <Icon k={p.status==='RECEIVED'?'check':p.over180?'alert':'truck'} size={18}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="od-no-t">{p.od_no}</div>
                  </div>
                  <span className={cx('po-status', `po-${p.status.toLowerCase()}`)}>
                    {p.status==='RECEIVED'?'รับของแล้ว':p.status==='SHIPPED'?'ขนส่งแล้ว':'รอจัดส่ง'}
                  </span>
                </div>
                {p.over180 && (
                  <div style={{padding:'0 14px 6px'}}>
                    <span className="po-alert" style={{fontSize:'11px'}}><Icon k="alert" size={11}/>รอเกิน 180 วัน</span>
                  </div>
                )}

                <div className="od-div"/>

                {/* Items */}
                <div className="od-items">
                  {Array.isArray(p.line_items) && p.line_items.length > 0
                    ? p.line_items.map((li,i) => (
                        <div key={i} style={{display:'flex',alignItems:'baseline',gap:'4px'}}>
                          <span style={{color:'var(--ink-4)',fontSize:'11px',flexShrink:0}}>·</span>
                          <span>{li.name}</span>
                          {li.qty>1 && <span style={{color:'var(--ink-4)',fontSize:'11px',flexShrink:0}}> × {li.qty} {li.unit||''}</span>}
                        </div>
                      ))
                    : <div>{p.items}</div>}
                </div>

                <div className="od-div"/>

                {/* Meta */}
                <div className="od-meta">
                  <div className="od-meta-r"><Icon k="cal" size={12}/> สั่งเมื่อ {beToCE(p.date_ordered)}</div>
                  <div className="od-meta-r"><Icon k="building" size={12}/> {p.vendor}</div>
                  <div className="od-meta-r"><Icon k="clock" size={12}/> คาดว่ารับ {p.est_days} วัน</div>
                </div>

                <div className="od-div"/>

                {/* Days */}
                <div className="od-days">
                  <div className="od-days-n">
                    <b className={p.over180?'bad':''}>{p.days}</b><span> วัน</span>
                  </div>
                  <div className="od-days-lbl">{p.status==='RECEIVED'?'ใช้เวลารวม':'รอคอยอยู่'}</div>
                </div>
                <div className="od-bar-wrap">
                  <div className="po-bar">
                    <span className="po-bar-fill"
                          style={{width:`${Math.min(100,p.ratio*100)}%`,
                                  background:p.over180?'var(--bad)':p.ratio>1?'var(--warn)':'var(--ok)'}}/>
                    <span className="po-bar-180" style={{left:`${Math.min(100,(180/Math.max(p.est_days,1))*100)}%`}} title="180 วัน"/>
                  </div>
                </div>

                {/* Confirm receive inline */}
                {p.od_no === confirmOd && (
                  <div className="od-confirm">
                    <div className="od-confirm-row">
                      <span className="od-confirm-lbl">วันที่รับ:</span>
                      <div style={{flex:1}}><ThaiDatePicker value={receiveDate} onChange={setReceiveDate}/></div>
                    </div>
                    <div className="od-confirm-row">
                      <span className="od-confirm-lbl">วัน Exp.:</span>
                      <div style={{flex:1}}><ThaiDatePicker value={expDate} onChange={setExpDate} placeholder="ไม่ระบุ"/></div>
                    </div>
                    <div style={{display:'flex',gap:'6px'}}>
                      <button className="btn btn-primary sm" onClick={()=>doReceive(p)}><Icon k="check" size={12}/><span>ยืนยัน</span></button>
                      <button className="btn btn-ghost sm" onClick={()=>setConfirmOd(null)}>ยกเลิก</button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="od-actions">
                  {p.status !== 'RECEIVED' && canEdit && (
                    <button className="btn btn-mini btn-primary" onClick={()=>startConfirmReceive(p.od_no)}>
                      <Icon k="check" size={12}/><span>ยืนยันรับของ</span>
                    </button>
                  )}
                  {p.status === 'RECEIVED' && (
                    <span style={{fontSize:'11px',color:'var(--ink-3)'}}>รับเมื่อ {beToCE(p.received_date)}</span>
                  )}
                  <div style={{marginLeft:'auto',display:'flex',gap:'5px'}}>
                    {canEdit && <button className="btn btn-mini btn-ghost" onClick={()=>setEditPO(p)}>✏️</button>}
                    {canEdit && <button className="btn btn-mini btn-danger" onClick={()=>{if(window.confirm(`ลบ OD "${p.od_no}" ออก?`))onChange(pos.filter(x=>x.od_no!==p.od_no));}}> 🗑️</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {showAdd && <AddPOModal items={items} onClose={()=>setShowAdd(false)} onSave={(d)=>{ addPO(d); setShowAdd(false); }}/>}
      {editPO && <EditPOModal items={items} po={editPO} onClose={()=>setEditPO(null)} onSave={(d)=>{ onChange(pos.map(p=>p.od_no===d.od_no?d:p)); setEditPO(null); }}/>}
    </div>
  );
}

/* ===== Thai (BE) date picker + searchable item combobox ===== */
const THAI_MONTHS_FULL = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const THAI_DAYS_SHORT = ['อา','จ','อ','พ','พฤ','ศ','ส'];

function parseBEDate(s) {
  const m = s && String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return { y: Number(m[1]), m: Number(m[2])-1, d: Number(m[3]) };
  const t = new Date();
  return { y: t.getFullYear()+543, m: t.getMonth(), d: t.getDate() };
}
function formatBEDate(s) {
  const p = parseBEDate(s);
  return `${p.d} ${THAI_MONTHS_FULL[p.m]} ${p.y - 543}`;
}
function beToCE(s) {
  if (!s) return '';
  return s.replace(/^(\d{4})/, y => String(Number(y) - 543));
}
function toBEString(y, m, d) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

// Tracks a trigger element's screen position so a portal-rendered popover
// can follow it (modals use overflow:hidden, so absolute positioning would clip).
function useAnchoredPopover(open, triggerRef) {
  const [rect, setRect] = useS(null);
  useE(() => {
    if (!open) { setRect(null); return; }
    function update() { if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect()); }
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update); };
  }, [open]);
  return rect;
}

function ThaiDatePicker({ value, onChange }) {
  const [open, setOpen] = useS(false);
  const triggerRef = useR(null);
  const popRef = useR(null);
  const rect = useAnchoredPopover(open, triggerRef);
  const init = parseBEDate(value);
  const [viewY, setViewY] = useS(init.y);
  const [viewM, setViewM] = useS(init.m);

  useE(() => {
    function onDoc(e) {
      if (triggerRef.current && triggerRef.current.contains(e.target)) return;
      if (popRef.current && popRef.current.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function openPicker() {
    const p = parseBEDate(value);
    setViewY(p.y); setViewM(p.m);
    setOpen(o=>!o);
  }
  const selected = parseBEDate(value);
  const ceYear = viewY - 543;
  const firstDow = new Date(ceYear, viewM, 1).getDay();
  const daysInMonth = new Date(ceYear, viewM+1, 0).getDate();
  const cells = [];
  for (let i=0;i<firstDow;i++) cells.push(null);
  for (let dd=1; dd<=daysInMonth; dd++) cells.push(dd);

  function pick(dd) { onChange(toBEString(viewY, viewM, dd)); setOpen(false); }
  function prevMonth() { if (viewM===0) { setViewM(11); setViewY(y=>y-1);} else setViewM(m=>m-1); }
  function nextMonth() { if (viewM===11) { setViewM(0); setViewY(y=>y+1);} else setViewM(m=>m+1); }
  function goToday() {
    const t = new Date();
    onChange(toBEString(t.getFullYear()+543, t.getMonth(), t.getDate()));
    setOpen(false);
  }

  return (
    <>
      <div ref={triggerRef} className="input-wrap" onClick={openPicker} style={{ cursor:'pointer' }}>
        <Icon k="cal" size={15}/>
        <span style={{ flex:1, color: value?'var(--ink)':'var(--ink-4)' }}>{value ? formatBEDate(value) : 'เลือกวันที่'}</span>
      </div>
      {open && rect && ReactDOM.createPortal(
        <div ref={popRef} style={{
          position:'fixed', top: rect.bottom+6, left: rect.left, width:'260px', zIndex:1000,
          background:'#fff', border:'1px solid var(--bd)', borderRadius:'12px',
          boxShadow:'0 16px 40px rgba(15,23,42,.22)', padding:'12px',
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
            <button type="button" className="icon-btn" onClick={prevMonth}>‹</button>
            <div style={{ fontWeight:600, fontSize:'13.5px' }}>{THAI_MONTHS_FULL[viewM]} {viewY - 543}</div>
            <button type="button" className="icon-btn" onClick={nextMonth}>›</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px', marginBottom:'4px' }}>
            {THAI_DAYS_SHORT.map(dn => (
              <div key={dn} style={{ textAlign:'center', fontSize:'11px', color:'var(--ink-4)', fontWeight:600 }}>{dn}</div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px' }}>
            {cells.map((dd,i) => {
              if (!dd) return <div key={i}/>;
              const isSel = selected.y===viewY && selected.m===viewM && selected.d===dd;
              return (
                <button key={i} type="button" onClick={()=>pick(dd)} style={{
                  border:'none', background: isSel ? 'var(--accent)' : 'transparent',
                  color: isSel ? '#fff' : 'var(--ink)',
                  borderRadius:'8px', padding:'6px 0', fontSize:'12.5px', cursor:'pointer',
                }}>{dd}</button>
              );
            })}
          </div>
          <button type="button" className="btn btn-ghost sm" onClick={goToday} style={{ width:'100%', justifyContent:'center', marginTop:'8px' }}>วันนี้</button>
        </div>,
        document.body
      )}
    </>
  );
}

function ItemCombobox({ items, value, onChange, onSelect, placeholder }) {
  const [open, setOpen] = useS(false);
  const triggerRef = useR(null);
  const popRef = useR(null);
  const rect = useAnchoredPopover(open, triggerRef);

  useE(() => {
    function onDoc(e) {
      if (triggerRef.current && triggerRef.current.contains(e.target)) return;
      if (popRef.current && popRef.current.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const q = (value||'').toLowerCase().trim();
  const filtered = q
    ? items.filter(it =>
        it.name.toLowerCase().includes(q) ||
        (it.code||'').toLowerCase().includes(q) ||
        (it.ipiss||'').toLowerCase().includes(q))
    : items;

  function pick(it) { onSelect(it); setOpen(false); }

  return (
    <>
      <div ref={triggerRef} className="input-wrap">
        <Icon k="search" size={15}/>
        <input
          value={value} onChange={e=>{ onChange(e.target.value); setOpen(true); }}
          onFocus={()=>setOpen(true)}
          placeholder={placeholder}
        />
      </div>
      {open && rect && ReactDOM.createPortal(
        <div ref={popRef} style={{
          position:'fixed', top: rect.bottom+6, left: rect.left, width: rect.width, zIndex:1000,
          background:'#fff', border:'1px solid var(--bd)', borderRadius:'12px',
          boxShadow:'0 16px 40px rgba(15,23,42,.22)',
          maxHeight:'280px', overflowY:'auto', padding:'6px',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding:'10px 12px', fontSize:'13px', color:'var(--ink-4)' }}>ไม่พบรายการ — พิมพ์เพื่อระบุเอง</div>
          ) : filtered.slice(0,80).map(it => (
            <div key={it.code} onMouseDown={()=>pick(it)} style={{ padding:'8px 10px', borderRadius:'8px', cursor:'pointer', fontSize:'13px' }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--bg)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{ fontWeight:600, color:'var(--ink)' }}>{it.name}</div>
              <div style={{ color:'var(--ink-4)', fontSize:'11.5px' }}>{it.ipiss || it.code} · {it.supplier || 'ไม่ระบุผู้จำหน่าย'}</div>
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

function AddPOModal({ onClose, onSave, items=[] }) {
  const today = new Date();
  const be = `${today.getFullYear()+543}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const [d, setD] = useS({ od_no:'', date_ordered: be, vendor:'', est_days: 30 });
  const [lines, setLines] = useS([{ inputVal:'', selectedItem:null, qty:1, unit:'ชิ้น' }]);
  function set(k,v){ setD(o=>({...o,[k]:v})); }

  function selectItemForLine(idx, it) {
    setLines(ls => ls.map((l, i) => i !== idx ? l : { ...l, inputVal: it.name, selectedItem: it, unit: it.unit||'ชิ้น' }));
    const v = it.supplier ? (it.tel ? `${it.supplier} · ${it.tel}` : it.supplier) : '';
    if (v) setD(o => ({ ...o, vendor: o.vendor || v }));
  }

  function addLine() { setLines(ls => [...ls, { inputVal:'', selectedItem:null, qty:1, unit:'ชิ้น' }]); }
  function removeLine(idx) { setLines(ls => ls.filter((_,i) => i !== idx)); }

  const ok = d.od_no && d.vendor && lines.some(l => l.inputVal.trim());

  function handleSave() {
    const line_items = lines.filter(l => l.inputVal.trim()).map(l => ({
      code: l.selectedItem?.code || '',
      name: l.inputVal.trim(),
      qty: Number(l.qty) || 1,
      unit: l.unit || 'ชิ้น',
    }));
    onSave({ ...d, line_items, items: line_items.map(li=>li.name).join(', ') });
  }

  return (
    <ModalShell title="เพิ่มใบสั่งซื้อ (OD)" onClose={onClose} icon="truck" wide>
      <div className="form">
        <div className="form-row">
          <label className="lbl">เลข OD *
            <div className="input-wrap"><input value={d.od_no} onChange={e=>set('od_no',e.target.value)} placeholder="OD-2569-XXXX"/></div>
          </label>
          <label className="lbl">วันที่สั่งซื้อ
            <ThaiDatePicker value={d.date_ordered} onChange={v=>set('date_ordered',v)}/>
          </label>
        </div>
        <div className="lbl" style={{ marginBottom:'6px' }}>รายการพัสดุ *</div>
        {lines.map((l, idx) => (
          <div key={idx} style={{ display:'flex', gap:'6px', alignItems:'center', marginBottom:'8px' }}>
            <div style={{ flex:1 }}>
              <ItemCombobox items={items} value={l.inputVal}
                onChange={v=>setLines(ls=>ls.map((x,i)=>i!==idx?x:{...x,inputVal:v,selectedItem:null}))}
                onSelect={it=>selectItemForLine(idx,it)}
                placeholder="ค้นหาหรือเลือกพัสดุ…"/>
            </div>
            <div style={{ width:'80px' }}>
              <div className="input-wrap"><input type="number" value={l.qty} min="1"
                onChange={e=>setLines(ls=>ls.map((x,i)=>i!==idx?x:{...x,qty:Number(e.target.value)}))}
                style={{ textAlign:'right' }}/></div>
            </div>
            <span style={{ fontSize:'12px', color:'var(--ink-4)', minWidth:'32px' }}>{l.unit||'ชิ้น'}</span>
            {lines.length > 1 && (
              <button type="button" className="icon-btn" onClick={()=>removeLine(idx)} style={{ color:'var(--bad)', flexShrink:0 }}>
                <Icon k="close" size={13}/>
              </button>
            )}
          </div>
        ))}
        <button type="button" className="btn btn-ghost sm" onClick={addLine} style={{ marginBottom:'12px' }}>
          <Icon k="plus" size={13}/><span>เพิ่มรายการพัสดุ</span>
        </button>
        <div className="form-row">
          <label className="lbl">ผู้จำหน่าย *
            <div className="input-wrap"><input value={d.vendor} onChange={e=>set('vendor',e.target.value)} placeholder="ชื่อบริษัท · เบอร์โทร"/></div>
          </label>
          <label className="lbl">คาดว่าจะได้รับใน (วัน)
            <div className="input-wrap"><input type="number" value={d.est_days} onChange={e=>set('est_days',Number(e.target.value))}/></div>
          </label>
        </div>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" disabled={!ok} onClick={handleSave}><Icon k="check" size={14}/><span>บันทึก OD</span></button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ===== Edit PO modal ===== */
function EditPOModal({ po, onClose, onSave, items=[] }) {
  const [d, setD] = useS({ ...po });
  const [lines, setLines] = useS(() => {
    if (Array.isArray(po.line_items) && po.line_items.length > 0)
      return po.line_items.map(li => ({ inputVal: li.name||'', selectedItem:null, qty: li.qty||1, unit: li.unit||'ชิ้น', code: li.code||'' }));
    return [{ inputVal: po.items||'', selectedItem:null, qty:1, unit:'ชิ้น', code:'' }];
  });
  function set(k,v){ setD(o=>({...o,[k]:v})); }

  function selectItemForLine(idx, it) {
    setLines(ls => ls.map((l, i) => i !== idx ? l : { ...l, inputVal: it.name, selectedItem: it, unit: it.unit||'ชิ้น', code: it.code }));
    const v = it.supplier ? (it.tel ? `${it.supplier} · ${it.tel}` : it.supplier) : '';
    if (v) setD(o => ({ ...o, vendor: o.vendor || v }));
  }

  function addLine() { setLines(ls => [...ls, { inputVal:'', selectedItem:null, qty:1, unit:'ชิ้น', code:'' }]); }
  function removeLine(idx) { setLines(ls => ls.filter((_,i) => i !== idx)); }

  const ok = d.od_no && d.vendor && lines.some(l => l.inputVal.trim());

  function handleSave() {
    const line_items = lines.filter(l => l.inputVal.trim()).map(l => ({
      code: l.code || l.selectedItem?.code || '',
      name: l.inputVal.trim(),
      qty: Number(l.qty) || 1,
      unit: l.unit || 'ชิ้น',
    }));
    onSave({ ...d, line_items, items: line_items.map(li=>li.name).join(', ') });
  }

  return (
    <ModalShell title="แก้ไขใบสั่งซื้อ (OD)" onClose={onClose} icon="edit" wide>
      <div className="form">
        <div className="form-row">
          <label className="lbl">เลข OD *
            <div className="input-wrap"><input value={d.od_no} onChange={e=>set('od_no',e.target.value)}/></div>
          </label>
          <label className="lbl">วันที่สั่งซื้อ
            <ThaiDatePicker value={d.date_ordered||''} onChange={v=>set('date_ordered',v)}/>
          </label>
        </div>
        <div className="lbl" style={{ marginBottom:'6px' }}>รายการพัสดุ *</div>
        {lines.map((l, idx) => (
          <div key={idx} style={{ display:'flex', gap:'6px', alignItems:'center', marginBottom:'8px' }}>
            <div style={{ flex:1 }}>
              <ItemCombobox items={items} value={l.inputVal}
                onChange={v=>setLines(ls=>ls.map((x,i)=>i!==idx?x:{...x,inputVal:v,selectedItem:null}))}
                onSelect={it=>selectItemForLine(idx,it)}
                placeholder="ค้นหาหรือเลือกพัสดุ…"/>
            </div>
            <div style={{ width:'80px' }}>
              <div className="input-wrap"><input type="number" value={l.qty} min="1"
                onChange={e=>setLines(ls=>ls.map((x,i)=>i!==idx?x:{...x,qty:Number(e.target.value)}))}
                style={{ textAlign:'right' }}/></div>
            </div>
            <span style={{ fontSize:'12px', color:'var(--ink-4)', minWidth:'32px' }}>{l.unit||'ชิ้น'}</span>
            {lines.length > 1 && (
              <button type="button" className="icon-btn" onClick={()=>removeLine(idx)} style={{ color:'var(--bad)', flexShrink:0 }}>
                <Icon k="close" size={13}/>
              </button>
            )}
          </div>
        ))}
        <button type="button" className="btn btn-ghost sm" onClick={addLine} style={{ marginBottom:'12px' }}>
          <Icon k="plus" size={13}/><span>เพิ่มรายการพัสดุ</span>
        </button>
        <div className="form-row">
          <label className="lbl">ผู้จำหน่าย *
            <div className="input-wrap"><input value={d.vendor} onChange={e=>set('vendor',e.target.value)}/></div>
          </label>
          <label className="lbl">คาดว่าจะได้รับใน (วัน)
            <div className="input-wrap"><input type="number" value={d.est_days||30} onChange={e=>set('est_days',Number(e.target.value))}/></div>
          </label>
        </div>
        <label className="lbl">สถานะ
          <div className="input-wrap"><select value={d.status||'PENDING'} onChange={e=>set('status',e.target.value)} className="bare-select">
            <option value="PENDING">รอจัดส่ง</option>
            <option value="SHIPPED">อยู่ระหว่างขนส่ง</option>
            <option value="RECEIVED">รับของแล้ว</option>
          </select></div>
        </label>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" disabled={!ok} onClick={handleSave}><Icon k="check" size={14}/><span>บันทึกการแก้ไข</span></button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ===== Remaining (low-stock + expiring soon) ===== */

// Parse 'YYYY-MM-DD' (CE) → Date, or null if dash/empty
function parseExp(s) {
  if (!s || s === '—') return null;
  const [y,m,d] = s.split('-').map(Number);
  if (!y) return null;
  return new Date(y, (m||1)-1, d||1);
}

// Returns { tone: 'expired'|'soon'|'watch'|'ok'|'none', days, months, label }
function expStatusOf(item) {
  const dt = parseExp(item.exp);
  if (!dt) return { tone: 'none', days: null, months: null, label: '—' };
  const now = new Date();
  const days = Math.floor((dt - now) / 86400000);
  const months = days / 30.4375;
  if (days < 0)    return { tone: 'expired', days, months, label: 'หมดอายุแล้ว' };
  if (months <= 1) return { tone: 'soon',    days, months, label: `เหลือ ${days} วัน` };
  if (months <= 3) return { tone: 'soon',    days, months, label: `เหลือ ~${Math.round(months*10)/10} เดือน` };
  if (months <= 6) return { tone: 'watch',   days, months, label: `เหลือ ${Math.round(months)} เดือน` };
  return { tone: 'ok', days, months, label: item.exp };
}

function RemainingScreen({ items, cats, onStockIn }) {
  const [tab, setTab] = useS('all'); // all | low | expiring | expired

  const enriched = items.map(i => {
    const stockS = statusOf(i);
    const exp = expStatusOf(i);
    return { ...i, stockS, exp, gap: Math.max(0, i.min - i.qty) };
  });

  const counts = {
    out:      enriched.filter(i => i.stockS === 'out').length,
    low:      enriched.filter(i => i.stockS === 'low' || i.stockS === 'warn').length,
    expired:  enriched.filter(i => i.exp.tone === 'expired').length,
    expSoon:  enriched.filter(i => i.exp.tone === 'soon').length,
  };

  const isAlert = (i) =>
    i.stockS !== 'ok' || i.exp.tone === 'expired' || i.exp.tone === 'soon';

  const visible = enriched
    .filter(i => {
      if (tab === 'all')       return isAlert(i);
      if (tab === 'low')       return i.stockS !== 'ok';
      if (tab === 'expiring')  return i.exp.tone === 'soon';
      if (tab === 'expired')   return i.exp.tone === 'expired';
      return true;
    })
    .sort((a,b) => {
      // sort: expired → soon → out → low → warn → others
      const score = (x) => (
        (x.exp.tone === 'expired' ? 0 : x.exp.tone === 'soon' ? 1 :
         x.stockS === 'out' ? 2 : x.stockS === 'low' ? 3 : x.stockS === 'warn' ? 4 : 5)
      );
      const s = score(a) - score(b);
      if (s !== 0) return s;
      return (a.exp.days ?? 9999) - (b.exp.days ?? 9999);
    });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">พัสดุคงเหลือ · Remaining & Expiry</div>
          <h1 className="page-title">พัสดุคงเหลือ & แจ้งเตือนใกล้หมด/ใกล้หมดอายุ</h1>
          <div className="page-sub">
            มี <b>{counts.out + counts.low}</b> รายการต่ำกว่าขั้นต่ำ · 
            <b className={counts.expSoon>0?'warn-t':''}> {counts.expSoon}</b> รายการใกล้หมดอายุ (≤ 3 เดือน) · 
            <b className={counts.expired>0?'bad':''}> {counts.expired}</b> รายการหมดอายุแล้ว
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard tone="bad"   icon="dot"   big={fmt(counts.out)}     label="หมด"              sub="สั่งซื้อด่วน"/>
        <StatCard tone="warn"  icon="alert" big={fmt(counts.low)}     label="ใกล้หมด"          sub="ต่ำกว่าขั้นต่ำ"/>
        <StatCard tone="warn"  icon="clock" big={fmt(counts.expSoon)} label="ใกล้หมดอายุ"      sub="ภายใน 3 เดือน"/>
        <StatCard tone="bad"   icon="alert" big={fmt(counts.expired)} label="หมดอายุแล้ว"      sub="ห้ามใช้ - จำหน่ายออก"/>
      </div>

      {counts.expired > 0 && (
        <div className="banner banner-bad">
          <Icon k="alert" size={18}/>
          <div>
            <b>มีพัสดุหมดอายุแล้ว {counts.expired} รายการ — ห้ามนำไปใช้ในเคสผ่าตัด</b>
            <div className="muted sm">แยกออกจากชั้นวางและบันทึกจำหน่ายตามระเบียบพัสดุ</div>
          </div>
          <button className="btn btn-ghost sm" onClick={()=>setTab('expired')}>ดูรายการหมดอายุ</button>
        </div>
      )}
      {counts.expSoon > 0 && (
        <div className="banner banner-warn">
          <Icon k="clock" size={18}/>
          <div>
            <b>มีพัสดุใกล้หมดอายุ {counts.expSoon} รายการ ภายใน 3 เดือน</b>
            <div className="muted sm">วางแผนใช้งานก่อน หรือสั่งซื้อล็อตใหม่ทดแทน — ระบบใช้หลัก FEFO (First-Expire, First-Out)</div>
          </div>
          <button className="btn btn-ghost sm" onClick={()=>setTab('expiring')}>ดูเฉพาะใกล้หมดอายุ</button>
        </div>
      )}
      {(counts.out > 0 || counts.low > 0) && (
        <div className="banner banner-bad">
          <Icon k="alert" size={18}/>
          <div>
            <b>{counts.out + counts.low} รายการต่ำกว่าจำนวนคงเหลือขั้นต่ำ</b>
            <div className="muted sm">โปรดติดต่อฝ่ายพัสดุเพื่อจัดทำใบสั่งซื้อ</div>
          </div>
          <button className="btn btn-primary sm"><Icon k="truck" size={14}/><span>สร้าง OD จากรายการนี้</span></button>
        </div>
      )}

      <div className="chips-row">
        <Chip active={tab==='all'} onClick={()=>setTab('all')}>ที่ต้องตรวจสอบทั้งหมด ({enriched.filter(isAlert).length})</Chip>
        <Chip active={tab==='low'} onClick={()=>setTab('low')}>ใกล้หมด / หมด ({counts.out + counts.low})</Chip>
        <Chip active={tab==='expiring'} onClick={()=>setTab('expiring')}>ใกล้หมดอายุ ≤ 3 เดือน ({counts.expSoon})</Chip>
        <Chip active={tab==='expired'} onClick={()=>setTab('expired')}>หมดอายุแล้ว ({counts.expired})</Chip>
      </div>

      {visible.length === 0 ? (
        <div className="empty"><div className="empty-mark"><Icon k="check" size={28}/></div>
          <div className="empty-t">ไม่มีรายการในหมวดนี้</div>
          <div className="empty-s">ทุกอย่างอยู่ในเกณฑ์ปกติ — ลองเลือกแท็บอื่น</div>
        </div>
      ) : (
        <div className="ic-grid">
          {visible.map(it => {
            const cat = cats.find(c=>c.id===it.cat);
            const expired = it.exp.tone === 'expired';
            const expSoon = it.exp.tone === 'soon';
            const stockBad = it.stockS === 'out' || it.stockS === 'low';
            const s = it.stockS;
            const qtyColor = s==='out'?'var(--bad)':s==='low'?'#c2410c':s==='warn'?'var(--warn)':'var(--ok)';
            const barBg = s==='out'?'var(--bad-soft)':s==='low'?'#fed7aa':s==='warn'?'var(--warn-soft)':'var(--ok-soft)';
            return (
              <div key={it.code} className={cx('ic-card', `s-${s}`, expired && 's-out')}>
                <div className="ic-bar" style={{ background: barBg }}/>
                <div className="ic-head">
                  <div className="cat-tag sm" style={{ background:`oklch(0.95 0.04 ${cat.hue})`, color:`oklch(0.35 0.12 ${cat.hue})` }}>{cat.en}</div>
                  <StatusPill s={expired ? 'out' : s}/>
                </div>
                <div className="ic-name">{it.name}</div>
                <div className="ic-codes">
                  <span className="ipiss" style={{ fontSize:'10px', padding:'1px 5px' }}>{it.ipiss}</span>
                  <span className="mono" style={{ fontSize:'10px', color:'var(--ink-4)' }}>· {it.code}</span>
                  {it.loc && <span style={{ fontSize:'10px', color:'var(--ink-4)' }}>· {it.loc}</span>}
                </div>
                <div className="ic-stats">
                  <div style={{ textAlign:'right' }}>
                    <div className="ic-stat-lbl">คงเหลือ</div>
                    <span className={cx('ic-stat-big', s==='out'&&'bad')} style={{ color: qtyColor }}>{fmt(it.qty)}</span>
                    <span className="ic-stat-unit"> / {it.min} {it.unit}</span>
                  </div>
                </div>
                {stockBad && <div style={{ fontSize:'11px', color:'var(--bad)', fontWeight:600, marginTop:'2px' }}>ขาด {it.gap} {it.unit}</div>}
                {it.exp.tone !== 'none' && (
                  <div className={cx('exp-pill', `exp-${it.exp.tone}`)} style={{ marginTop:'6px' }}>
                    <Icon k={expired ? 'alert' : 'clock'} size={11}/>
                    <span>
                      {expired
                        ? `หมดอายุ ${Math.abs(it.exp.days)} วัน`
                        : it.exp.tone === 'soon'
                            ? (it.exp.days <= 30 ? `เหลือ ${it.exp.days} วัน` : `เหลือ ~${Math.round(it.exp.months*10)/10} เดือน`)
                            : it.exp.tone === 'watch' ? `เหลือ ${Math.round(it.exp.months)} เดือน` : 'ปกติ'}
                    </span>
                  </div>
                )}
                <div className="ic-actions">
                  <button className="btn btn-mini btn-primary" onClick={()=>onStockIn(it.code)}><Icon k="in" size={12}/><span>รับเข้า</span></button>
                  {expired && <button className="btn btn-mini btn-ghost"><Icon k="trash" size={12}/><span>จำหน่ายออก</span></button>}
                  {!expired && stockBad && <button className="btn btn-mini btn-ghost"><Icon k="truck" size={12}/><span>OD</span></button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ===== SMC Edit Modal ===== */
const SMC_FIELDS = [
  { key:'room',     label:'ค่าห้องผ่าตัด', accent:false },
  { key:'dfSx',    label:'DF Sx',           accent:false },
  { key:'dfAnes',  label:'DF Anes',         accent:false },
  { key:'scrub',   label:'Scrub Nurse',     accent:true  },
  { key:'anesN',   label:'Anes Nurse',      accent:true  },
  { key:'nurseAid',label:'Nurse Aid',       accent:true  },
];
const SMC_SITS = ['crh','ins','th'];
const SMC_SIT_LBL = { crh:'CRH', ins:'Insurance', th:'ต่างชาติ' };

function SMCEditModal({ item, override, onSave, onClose }) {
  const initPrices = sit => {
    const src = item[sit] || {};
    const ov  = override?.[sit] || {};
    const merged = {};
    SMC_FIELDS.forEach(f => { merged[f.key] = ov[f.key] ?? src[f.key] ?? 0; });
    return merged;
  };
  const [codes,  setCodes]  = useS(() => ({ room:'', dfSx:'', dfAnes:'', scrub:'', anesN:'', nurseAid:'', ...(override?.codes || {}) }));
  const [prices, setPrices] = useS(() => ({ crh: initPrices('crh'), ins: initPrices('ins'), th: initPrices('th') }));

  const setPrice = (sit, key, val) =>
    setPrices(p => ({ ...p, [sit]: { ...p[sit], [key]: parseInt(val) || 0 } }));
  const getTotal = sit => SMC_FIELDS.reduce((s, f) => s + (prices[sit][f.key] || 0), 0);

  const save = () => onSave({
    codes,
    crh: { ...prices.crh, total: getTotal('crh') },
    ins: { ...prices.ins, total: getTotal('ins') },
    th:  { ...prices.th,  total: getTotal('th')  },
  });

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="smc-edit-modal" onClick={e => e.stopPropagation()}>
        <div className="smc-edit-head">
          <div>
            <div className="smc-edit-title">{item.name}</div>
            <div style={{ fontSize:'12px', color:'#64748b', marginTop:'2px' }}>ICD9 {item.icd9} · {item.t==='lt2'?'OR <2hr':'OR >2hr'}</div>
          </div>
          <button className="smc-edit-close" onClick={onClose}>✕</button>
        </div>

        <div className="smc-edit-table">
          {/* header */}
          <div className="smc-edit-hdr">
            <div>รายการ</div>
            <div>Code</div>
            {SMC_SITS.map(s => <div key={s}>{SMC_SIT_LBL[s]}</div>)}
          </div>
          {/* rows */}
          {SMC_FIELDS.map(f => (
            <div key={f.key} className="smc-edit-row">
              <div className={cx('smc-edit-lbl', f.accent && 'accent-lbl')}>{f.label}</div>
              <div>
                <input className="smc-inp smc-inp-code"
                  value={codes[f.key]}
                  onChange={e => setCodes(c => ({ ...c, [f.key]: e.target.value }))}
                  placeholder="—"/>
              </div>
              {SMC_SITS.map(sit => (
                <div key={sit}>
                  <input className="smc-inp smc-inp-num" type="number" min="0"
                    value={prices[sit][f.key] ?? 0}
                    onChange={e => setPrice(sit, f.key, e.target.value)}/>
                </div>
              ))}
            </div>
          ))}
          {/* total */}
          <div className="smc-edit-row smc-edit-total-row">
            <div style={{ fontWeight:700, color:'#f1f5f9' }}>รวม</div>
            <div/>
            {SMC_SITS.map(sit => (
              <div key={sit} style={{ fontWeight:800, color:'#22d3ee', fontSize:'15px' }}>
                ฿{getTotal(sit).toLocaleString()}
              </div>
            ))}
          </div>
        </div>

        <div className="smc-edit-foot">
          <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={save}>บันทึก</button>
        </div>
      </div>
    </div>
  );
}

/* ===== SMC print helper ===== */
function printSMCCard(d, s, sitthi, codes, cDfSx, cDfAnes) {
  const sfx        = sitthi==='ins' ? '-I' : sitthi==='th' ? '-F' : '';
  const size       = d.t === 'gt2' ? 2 : 1;
  const sizeLabel  = d.t === 'gt2' ? 'ใหญ่' : 'เล็ก';
  const nurseCount = d.t === 'gt2' ? 3 : 2;
  const sitthiLbl  = { crh:'CRH', ins:'Insurance', th:'ต่างชาติ' }[sitthi] || sitthi;
  const anMethod   = s.dfAnes > 0 ? 'GA' : 'LA';
  const fmt        = n => n ? Number(n).toLocaleString() : '0';

  const roomCode  = codes.room  || ('OR'  + size + 'SMC' + sfx);
  const scrubCode = codes.scrub || ('NU'  + size + 'DF'  + sfx);
  const anesNCode = codes.anesN || ('AN'  + size + 'DF'  + sfx);

  const rows = [];
  if (s.dfSx)   rows.push({ code: cDfSx,    desc: 'ค่าธรรมเนียมแพทย์เฉพาะทาง ' + d.name, amt: s.dfSx });
  if (s.dfAnes) rows.push({ code: cDfAnes,   desc: 'ค่าธรรมเนียมแพทย์เฉพาะทางสำหรับวิสัญญีแพทย์ ' + d.name, amt: s.dfAnes });
  if (s.room)   rows.push({ code: roomCode,  desc: 'ค่าธรรมเนียมใช้ห้องผ่าตัด (' + sizeLabel + ')', amt: s.room });
  if (s.scrub)  {
    const rate = Math.round(s.scrub / nurseCount);
    rows.push({ code: scrubCode, desc: 'ค่าธรรมเนียมพยาบาล (ผ่าตัด' + sizeLabel + ') (' + rate + ' บาท/' + nurseCount + 'คน)', amt: s.scrub });
  }
  if (s.anesN)  rows.push({ code: anesNCode, desc: 'ค่าธรรมเนียมวิสัญญีพยาบาล (ผ่าตัด' + sizeLabel + ') (' + s.anesN + ' บาท/1คน)', amt: s.anesN });

  const rowsHTML  = rows.map(r =>
    '<tr><td>&nbsp;</td><td>&nbsp;</td><td style="font-weight:700;white-space:nowrap">' + r.code +
    '</td><td>' + r.desc + '</td><td style="text-align:right;white-space:nowrap">' + fmt(r.amt) + '</td></tr>'
  ).join('');
  const emptyHTML = Array(Math.max(0, 5 - rows.length)).fill(
    '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>'
  ).join('');

  const html = '<!DOCTYPE html><html lang="th"><head><meta charset="utf-8">' +
    '<title>SMC URO - ' + d.name + '</title><style>' +
    '*{margin:0;padding:0;box-sizing:border-box}' +
    '@page{size:A4;margin:18mm 18mm 18mm 22mm}' +
    'body{font-family:"TH Sarabun New","Sarabun",Arial,sans-serif;font-size:14pt;color:#000;background:#fff}' +
    '.title{text-align:center;font-size:20pt;font-weight:bold;margin-bottom:18px}' +
    '.title u{margin-right:32px}' +
    '.top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}' +
    '.top-left{flex:1;line-height:2.2}' +
    '.photo-box{width:130px;height:100px;border:1.5px solid #000;flex-shrink:0;margin-left:20px}' +
    '.sitthi{margin-bottom:14px;line-height:2.2}' +
    'table{width:100%;border-collapse:collapse;margin-bottom:14px;font-size:13pt}' +
    'td,th{border:1px solid #000;padding:4px 8px}' +
    'th{text-align:center}' +
    '@media print{body{-webkit-print-color-adjust:exact}}' +
    '</style></head><body>' +
    '<div class="title"><u>แบบลงทะเบียนผู้ป่วยผ่าตัด</u>&nbsp;&nbsp;&nbsp;&nbsp;SMC&nbsp;&nbsp;URO</div>' +
    '<div class="top"><div class="top-left">' +
    '<div>วัน-เดือน-ปี................................</div>' +
    '<div>DX..................................................</div>' +
    '<div>&#9744;&nbsp;&nbsp;Right</div>' +
    '<div>&#9744;&nbsp;&nbsp;Left</div>' +
    '<div>..........&nbsp;&nbsp;<strong>' + d.name + '</strong>&nbsp;&nbsp;รหัส..' + d.icd9 + '......</div>' +
    '</div><div class="photo-box"></div></div>' +
    '<div class="sitthi">สิทธิบัตร....' + sitthiLbl + '..........</div>' +
    '<table>' +
    '<tr><td style="width:42%">ศัลยแพทย์</td><td></td></tr>' +
    '<tr><td>เวลาเริ่ม</td><td></td></tr>' +
    '<tr><td>เวลาเสร็จ</td><td></td></tr>' +
    '<tr><td>&nbsp;</td><td></td></tr>' +
    '</table>' +
    '<table>' +
    '<tr><td style="width:42%">วิธีการตมยา&nbsp;&nbsp;&nbsp;' + anMethod + '</td><td></td></tr>' +
    '<tr><td>&nbsp;</td><td></td></tr>' +
    '</table>' +
    '<table>' +
    '<tr><th style="width:5%">&nbsp;</th><th style="width:5%">&nbsp;</th>' +
    '<th style="width:18%">รหัส</th><th>รายการ</th><th style="width:13%">จำนวน</th></tr>' +
    rowsHTML + emptyHTML +
    '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>' +
    '<td style="text-align:right;font-weight:700">รวมจ่าย</td>' +
    '<td style="text-align:right;font-weight:700;white-space:nowrap">' + fmt(s.total) + '</td></tr>' +
    '</table>' +
    '</body><script>window.onload=function(){window.print();}<\/script></html>';

  const w = window.open('', '_blank', 'width=820,height=1060');
  w.document.write(html);
  w.document.close();
}

/* ===== SMC Guide screen ===== */
function SMCGuideScreen({ user }) {
  const [q, setQ] = useS('');
  const [sitthi, setSitthi] = useS('crh');
  const [time, setTime] = useS('all');
  const [overrides, setOverrides] = useS(() => {
    try { return JSON.parse(localStorage.getItem('uro_smc_overrides') || '{}'); }
    catch { return {}; }
  });
  const [editIdx, setEditIdx] = useS(null);

  const canEdit = user?.role === 'admin';
  const SITTHI = [['crh','CRH'],['ins','Insurance'],['th','ต่างชาติ']];
  const SITTHI_LBL = { crh:'CRH', ins:'Insurance', th:'ต่างชาติ' };

  const rawData = window.SMC_DATA || [];
  const data = rawData.map((d, i) => {
    const ov = overrides[i];
    if (!ov) return d;
    return {
      ...d,
      _codes: ov.codes || {},
      crh: { ...d.crh, ...ov.crh },
      ins: { ...d.ins, ...ov.ins },
      th:  { ...d.th,  ...ov.th  },
    };
  });

  const f = data.map((d, i) => ({ ...d, _origIdx: i })).filter(d => {
    const matchTime = time === 'all' || d.t === time;
    const matchQ = !q || d.name.toLowerCase().includes(q.toLowerCase()) || d.icd9.includes(q);
    return matchTime && matchQ;
  });

  const b = n => n ? `฿${n.toLocaleString()}` : '฿0';

  const saveOverride = (idx, ovData) => {
    const next = { ...overrides, [idx]: ovData };
    setOverrides(next);
    localStorage.setItem('uro_smc_overrides', JSON.stringify(next));
    setEditIdx(null);
  };

  return (
    <div className="smc-page">
      <div className="smc-topbar">
        <div className="smc-search-wrap">
          <Icon k="search" size={16} className="smc-search-icon"/>
          <input
            className="smc-search"
            placeholder="พิมพ์ชื่อการผ่าตัด เช่น TUR-P, Nephrectomy, Cystoscopy, ICD9…"
            value={q} onChange={e=>setQ(e.target.value)}
          />
        </div>
        <div className="smc-filter-row">
          <div className="smc-sitthi-tabs">
            {SITTHI.map(([v,l])=>(
              <button key={v} className={cx('smc-sitthi-tab', sitthi===v&&'is-on')} onClick={()=>setSitthi(v)}>{l}</button>
            ))}
          </div>
          <div className="smc-time-pills">
            {[['all','ทั้งหมด'],['lt2','< 2 ชม.'],['gt2','> 2 ชม.']].map(([v,l])=>(
              <button key={v} className={cx('smc-pill', time===v&&'is-on')} onClick={()=>setTime(v)}>{l}</button>
            ))}
          </div>
          <span className="smc-count">{f.length} รายการ</span>
        </div>
      </div>

      <div className="smc-grid">
        {f.map((d, fi) => {
          const idx = d._origIdx;
          const s     = d[sitthi] || {};
          const codes = d._codes  || {};
          const FEE1 = [
            { key:'room',    label:'ค่าห้องผ่าตัด', accent:false },
            { key:'dfSx',   label:'DF Sx',           accent:false },
            { key:'dfAnes', label:'DF Anes',          accent:false },
          ];
          const FEE2 = [
            { key:'scrub',    label:'Scrub Nurse', accent:true },
            { key:'anesN',    label:'Anes Nurse',  accent:true },
            { key:'nurseAid', label:'Nurse Aid',   accent:true },
          ];
          const icdLetter = /[A-Za-z]$/.test(d.icd9);
          const baseSx   = d.icd9 + (icdLetter ? 'DF'  : 'DDF');
          const baseAnes = d.icd9 + (icdLetter ? 'NDF' : 'ANDF');
          const sfx = sitthi==='ins' ? '-I' : sitthi==='th' ? '-F' : '';
          const cDfSx   = codes.dfSx   || (baseSx + sfx);
          const cDfAnes = codes.dfAnes  || (s.dfAnes > 0 ? baseAnes + sfx : null);
          return (
            <div key={fi} className="smc-card">
              <div className="smc-card-top">
                <div className="smc-name">{d.name}</div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <div className="smc-total">{b(s.total)}</div>
                  <button className="smc-edit-btn" title="พิมพ์แบบฟอร์ม" onClick={()=>printSMCCard(d, s, sitthi, codes, cDfSx, cDfAnes)}>🖨️</button>
                  {canEdit && (
                    <button className="smc-edit-btn" title="แก้ไขราคา" onClick={()=>setEditIdx(idx)}>✏️</button>
                  )}
                </div>
              </div>
              <div className="smc-badges">
                <span className="smc-badge icd">ICD9 {d.icd9}</span>
                <span className={cx('smc-badge', d.t==='gt2'?'gt2':'lt2')}>{d.t==='gt2'?'OR >2hr':'OR <2hr'}</span>
                <span className="smc-total-lbl">รวมชำระ {SITTHI_LBL[sitthi]}</span>
              </div>

              <div className="smc-div"/>

              <div className="smc-fee-grid">
                {FEE1.map(f => {
                  const bCode = f.key==='dfSx' ? cDfSx : f.key==='dfAnes' ? cDfAnes : null;
                  return (
                    <div key={f.key} className="smc-fee-cell">
                      <div className="smc-fee-lbl">{f.label}</div>
                      {bCode && <div className="smc-billing-code">{bCode}</div>}
                      <div className={cx('smc-fee-val', f.accent && 'accent')}>{b(s[f.key])}</div>
                      {!bCode && codes[f.key] && <div className="smc-code">{codes[f.key]}</div>}
                    </div>
                  );
                })}
              </div>

              <div className="smc-div"/>

              <div className="smc-fee-grid">
                {FEE2.map(f => (
                  <div key={f.key} className="smc-fee-cell">
                    <div className="smc-fee-lbl">{f.label}</div>
                    <div className={cx('smc-fee-val', f.accent && 'accent')}>{b(s[f.key])}</div>
                    {codes[f.key] && <div className="smc-code">{codes[f.key]}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {f.length === 0 && (
          <div className="smc-empty">ไม่พบรายการที่ตรงกับการค้นหา</div>
        )}
      </div>

      {editIdx !== null && (
        <SMCEditModal
          item={rawData[editIdx]}
          override={overrides[editIdx]}
          onSave={ovData => saveOverride(editIdx, ovData)}
          onClose={() => setEditIdx(null)}
        />
      )}
    </div>
  );
}

/* ===== Transplant Report ===== */
function txpEmpty() {
  return {
    id: 'txp-' + Date.now() + '-' + Math.random().toString(36).slice(2,6),
    date: new Date().toISOString().slice(0,10),
    perfusionSolution: '',
    kidneyLeft: true, kidneyRight: false,
    perfusionStart: '', perfusionEnd: '',
    kidneyOnPt: '',
    transplantStart: '', transplantEnd: '',
    clampTime: '', clampDate: new Date().toISOString().slice(0,10),
    deClampTime: '', deClampDate: new Date().toISOString().slice(0,10),
    surgeons: ['','','',''],
    scrubNurses: ['','','',''],
    timeIn: '', timeOn: '', timeEnd: '', timeOut: '',
    patientName: '', hn: '', note: '',
  };
}
function txpParseMin(t) {
  if (!t || !t.includes(':')) return null;
  const [h,m] = t.split(':').map(Number);
  return h*60+m;
}
function txpDurStr(start, end) {
  const s = txpParseMin(start), e = txpParseMin(end);
  if (s===null || e===null) return null;
  let d = e - s; if (d < 0) d += 1440;
  return `${Math.floor(d/60)} ชั่วโมง ${d%60} นาที`;
}
function txpTotalHM(d1, t1, d2, t2) {
  if (!d1||!t1||!d2||!t2) return null;
  try {
    const dt1 = new Date(`${d1}T${t1}:00`), dt2 = new Date(`${d2}T${t2}:00`);
    const mins = Math.round((dt2-dt1)/60000);
    if (mins<0) return null;
    return { h: Math.floor(mins/60), m: mins%60 };
  } catch { return null; }
}
function txpFmtDate(iso) {
  if (!iso) return '—';
  const [y,mo,d] = iso.split('-');
  return `${parseInt(d)}/${parseInt(mo)}/${parseInt(y)+543}`;
}

function TransplantScreen({ cases=[], canEdit, onSave, onDelete }) {
  const [view, setView] = useS('list');
  const [selected, setSelected] = useS(null);
  const [form, setForm] = useS(null);

  const setF = (k,v) => setForm(f=>({...f,[k]:v}));
  const setSurgeon  = (i,v) => setForm(f=>{ const a=[...f.surgeons];  a[i]=v; return {...f,surgeons:a}; });
  const setScrub    = (i,v) => setForm(f=>{ const a=[...f.scrubNurses];a[i]=v;return {...f,scrubNurses:a};});

  const openNew  = ()        => { setForm(txpEmpty()); setView('form'); };
  const openEdit = c         => {
    const surgeons    = [...(c.surgeons    || [])];
    const scrubNurses = [...(c.scrubNurses || [])];
    while (surgeons.length    < 4) surgeons.push('');
    while (scrubNurses.length < 4) scrubNurses.push('');
    setForm({...c, surgeons, scrubNurses});
    setView('form');
  };
  const openDetail = c       => { setSelected(c);      setView('detail'); };
  const saveForm = ()        => { onSave(form); setView('list'); setForm(null); };

  /* ── FORM VIEW ── */
  if (view==='form' && form) {
    const total = txpTotalHM(form.clampDate, form.clampTime, form.deClampDate, form.deClampTime);
    const isEdit = cases.some(c=>c.id===form.id);
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <div className="eyebrow">Transplant Report</div>
            <h1 className="page-title">{isEdit ? 'แก้ไข Case' : 'สร้าง Case ใหม่'}</h1>
          </div>
          <div className="page-head-actions">
            <button className="btn btn-ghost" onClick={()=>setView(isEdit?'detail':'list')}>ยกเลิก</button>
            <button className="btn btn-primary" onClick={saveForm}>บันทึก</button>
          </div>
        </div>

        <div className="txp-form">
          {/* ─ ข้อมูลพื้นฐาน ─ */}
          <div className="card txp-section">
            <div className="txp-sec-title">ข้อมูลผู้ป่วย</div>
            <div className="txp-row3">
              <label className="lbl">วันที่ผ่าตัด<input type="date" value={form.date} onChange={e=>setF('date',e.target.value)}/></label>
              <label className="lbl">ชื่อผู้ป่วย<input value={form.patientName} onChange={e=>setF('patientName',e.target.value)} placeholder="น.ส.วรรณา ยะถา"/></label>
              <label className="lbl">HN<input value={form.hn} onChange={e=>setF('hn',e.target.value)} placeholder="982730"/></label>
            </div>
            <div className="txp-row3" style={{marginTop:'12px'}}>
              <label className="lbl">Perfusion Solution (ml.)<input type="number" value={form.perfusionSolution} onChange={e=>setF('perfusionSolution',e.target.value)} placeholder="4000"/></label>
              <div className="lbl">Kidney
                <div style={{display:'flex',gap:'20px',marginTop:'8px'}}>
                  <label style={{display:'flex',gap:'6px',alignItems:'center',cursor:'pointer',fontWeight:600,fontSize:'13px'}}>
                    <input type="checkbox" checked={!!form.kidneyLeft} onChange={e=>setF('kidneyLeft',e.target.checked)}/> Left
                  </label>
                  <label style={{display:'flex',gap:'6px',alignItems:'center',cursor:'pointer',fontWeight:600,fontSize:'13px'}}>
                    <input type="checkbox" checked={!!form.kidneyRight} onChange={e=>setF('kidneyRight',e.target.checked)}/> Right
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* ─ เวลาการผ่าตัด ─ */}
          <div className="card txp-section">
            <div className="txp-sec-title">เวลาการผ่าตัด</div>
            <div className="txp-row3">
              <label className="lbl">Perfusion Time (เริ่ม)<input type="time" value={form.perfusionStart} onChange={e=>setF('perfusionStart',e.target.value)}/></label>
              <label className="lbl">Perfusion Time (สิ้นสุด)<input type="time" value={form.perfusionEnd} onChange={e=>setF('perfusionEnd',e.target.value)}/></label>
              <label className="lbl">Time — Kidney on Pt.<input type="time" value={form.kidneyOnPt} onChange={e=>setF('kidneyOnPt',e.target.value)}/></label>
            </div>
            <div className="txp-row3" style={{marginTop:'12px'}}>
              <label className="lbl">Time Transplant (เริ่ม)<input type="time" value={form.transplantStart} onChange={e=>setF('transplantStart',e.target.value)}/></label>
              <label className="lbl">Time Transplant (สิ้นสุด)<input type="time" value={form.transplantEnd} onChange={e=>setF('transplantEnd',e.target.value)}/></label>
            </div>
            {txpDurStr(form.perfusionStart,form.perfusionEnd) && (
              <div className="txp-calc-hint">Perfusion duration: {txpDurStr(form.perfusionStart,form.perfusionEnd)}</div>
            )}
            {txpDurStr(form.transplantStart,form.transplantEnd) && (
              <div className="txp-calc-hint">Transplant duration: {txpDurStr(form.transplantStart,form.transplantEnd)}</div>
            )}
          </div>

          {/* ─ Clamp / De-Clamp ─ */}
          <div className="card txp-section">
            <div className="txp-sec-title">Clamp / De-Clamp</div>
            <div className="txp-row2">
              <label className="lbl">Clamp Date<input type="date" value={form.clampDate} onChange={e=>setF('clampDate',e.target.value)}/></label>
              <label className="lbl">Clamp Time<input type="time" value={form.clampTime} onChange={e=>setF('clampTime',e.target.value)}/></label>
              <label className="lbl">De-Clamp Date<input type="date" value={form.deClampDate} onChange={e=>setF('deClampDate',e.target.value)}/></label>
              <label className="lbl">De-Clamp Time<input type="time" value={form.deClampTime} onChange={e=>setF('deClampTime',e.target.value)}/></label>
            </div>
            {total && (
              <div className="txp-total-preview">
                <Icon k="clock" size={14}/> Total Time: <b>{total.h} ชั่วโมง {total.m} นาที</b>
              </div>
            )}
          </div>

          {/* ─ ทีมผ่าตัด ─ */}
          <div className="card txp-section">
            <div className="txp-sec-title">Surgeon</div>
            <div className="txp-row2">
              {[0,1,2,3].map(i=>(
                <label key={i} className="lbl">Surgeon {i+1}
                  <select value={form.surgeons[i]||''} onChange={e=>setSurgeon(i,e.target.value)} className="txp-select">
                    <option value="">— เลือก —</option>
                    <option>พ.เอกณัฏฐ์</option>
                    <option>พ.กฤษณะ</option>
                    <option>พ.ชัยพร</option>
                    <option>พ.สุธี</option>
                    <option>พ.ปพน</option>
                  </select>
                </label>
              ))}
            </div>
          </div>

          <div className="card txp-section">
            <div className="txp-sec-title">Scrub Nurse</div>
            <div className="txp-row2">
              {[0,1,2,3].map(i=>(
                <label key={i} className="lbl">Scrub Nurse {i+1}
                  <select value={form.scrubNurses[i]||''} onChange={e=>setScrub(i,e.target.value)} className="txp-select">
                    <option value="">— เลือก —</option>
                    <option>พว.กิ่งแก้ว นรรัตน์</option>
                    <option>พว.ปกรณ์ ชัยน่าน</option>
                    <option>พว.ปิยะพงษ์ ปงลังกา</option>
                    <option>พว.สิริภา เชื่ออยู่นาน</option>
                    <option>พว.อนวัช ดั้นเมฆ</option>
                    <option>พว.ประดิพัทธ์ จันทราพูน</option>
                    <option>พว.วิลาพร ทิวงศ์</option>
                    <option>พว.กัลยรัตน์ มหาเทพ</option>
                    <option>พว.นิรดา ราชคมน์</option>
                    <option>พว.เฌอลินย์ สิริกรณ์พิบูลย์</option>
                    <option>พว.ฤทัยรัตน์ สุริยน</option>
                    <option>พว.จุไรรัตน์ จิตระแวง</option>
                    <option>พว.กมลชนก ฟองคำ</option>
                    <option>พว.วิราภรณ์ คันทะวงศ์</option>
                  </select>
                </label>
              ))}
            </div>
          </div>

          {/* ─ เวลาทำงาน ─ */}
          <div className="card txp-section">
            <div className="txp-sec-title">เวลาทำงาน</div>
            <div className="txp-row2">
              <label className="lbl">Time In<input type="time" value={form.timeIn} onChange={e=>setF('timeIn',e.target.value)}/></label>
              <label className="lbl">Time On<input type="time" value={form.timeOn} onChange={e=>setF('timeOn',e.target.value)}/></label>
              <label className="lbl">Time End<input type="time" value={form.timeEnd} onChange={e=>setF('timeEnd',e.target.value)}/></label>
              <label className="lbl">Time Out<input type="time" value={form.timeOut} onChange={e=>setF('timeOut',e.target.value)}/></label>
            </div>
          </div>

          {/* ─ หมายเหตุ ─ */}
          <div className="card txp-section" style={{gridColumn:'1/-1'}}>
            <div className="txp-sec-title">หมายเหตุ</div>
            <textarea className="txp-note" value={form.note} onChange={e=>setF('note',e.target.value)} placeholder="หมายเหตุ…" rows={2}/>
          </div>
        </div>
      </div>
    );
  }

  /* ── DETAIL VIEW ── */
  if (view==='detail' && selected) {
    const s = selected;
    const caseNo = cases.findIndex(c=>c.id===s.id)+1;
    const total  = txpTotalHM(s.clampDate,s.clampTime,s.deClampDate,s.deClampTime);
    const perfDur = txpDurStr(s.perfusionStart, s.perfusionEnd);
    const txpDur  = txpDurStr(s.transplantStart, s.transplantEnd);
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <div className="eyebrow">Transplant Report</div>
            <h1 className="page-title">Case #{caseNo} · {txpFmtDate(s.date)}</h1>
          </div>
          <div className="page-head-actions">
            <button className="btn btn-ghost" onClick={()=>setView('list')}>← รายการ</button>
            {canEdit && <button className="btn btn-primary" onClick={()=>openEdit(s)}><Icon k="edit" size={14}/><span>แก้ไข</span></button>}
          </div>
        </div>

        {/* ── Sheet-style report ── */}
        <div className="txp-sheet">

          {/* TOP TABLE — unified grid so rowspan works correctly */}
          <div className="txp-top-table">
            <div className="txp-top-grid">
              {/* Row 1–2 headers (span 2 rows) */}
              <div className="txp-th" style={{gridColumn:1,gridRow:'1/3'}}>Date</div>
              <div className="txp-th" style={{gridColumn:2,gridRow:'1/3'}}>Perfusion<br/>Solution (ml.)</div>
              <div className="txp-th" style={{gridColumn:'3/5',gridRow:1}}>Kidney</div>
              <div className="txp-th" style={{gridColumn:'5/7',gridRow:1}}>Perfusion Time</div>
              <div className="txp-th" style={{gridColumn:7,gridRow:'1/3'}}>Time<br/>Kidney on Pt.</div>
              <div className="txp-th" style={{gridColumn:'8/10',gridRow:1}}>Time Transplant</div>
              <div className="txp-th" style={{gridColumn:10,gridRow:'1/3'}}>Clamp time</div>
              <div className="txp-th" style={{gridColumn:11,gridRow:'1/3'}}>De-Clamp</div>
              {/* Row 2 sub-headers */}
              <div className="txp-th txp-th-sm" style={{gridColumn:3,gridRow:2}}>Left</div>
              <div className="txp-th txp-th-sm" style={{gridColumn:4,gridRow:2}}>Right</div>
              <div className="txp-th txp-th-time" style={{gridColumn:5,gridRow:2}}>{s.perfusionStart||'—'}</div>
              <div className="txp-th txp-th-time" style={{gridColumn:6,gridRow:2}}>{s.perfusionEnd||'—'}</div>
              <div className="txp-th txp-th-time" style={{gridColumn:8,gridRow:2}}>{s.transplantStart||'—'}</div>
              <div className="txp-th txp-th-time" style={{gridColumn:9,gridRow:2}}>{s.transplantEnd||'—'}</div>
              {/* Row 3 data */}
              <div className="txp-td" style={{gridColumn:1,gridRow:3}}>{txpFmtDate(s.date)}</div>
              <div className="txp-td" style={{gridColumn:2,gridRow:3}}>{s.perfusionSolution||'—'}</div>
              <div className="txp-td" style={{gridColumn:3,gridRow:3,fontSize:'18px'}}>{s.kidneyLeft ?'☑':'☐'}</div>
              <div className="txp-td" style={{gridColumn:4,gridRow:3,fontSize:'18px'}}>{s.kidneyRight?'☑':'☐'}</div>
              <div className="txp-td txp-dur" style={{gridColumn:'5/7',gridRow:3}}>{perfDur||'—'}</div>
              <div className="txp-td" style={{gridColumn:7,gridRow:3,fontSize:'22px',fontWeight:800}}>{s.kidneyOnPt||'—'}</div>
              <div className="txp-td txp-dur" style={{gridColumn:'8/10',gridRow:3}}>{txpDur||'—'}</div>
              <div className="txp-td" style={{gridColumn:10,gridRow:3,fontSize:'22px',fontWeight:800}}>{s.clampTime||'—'}</div>
              <div className="txp-td" style={{gridColumn:11,gridRow:3,fontSize:'22px',fontWeight:800}}>{s.deClampTime||'—'}</div>
            </div>
          </div>

          {/* BOTTOM SECTION */}
          <div className="txp-bottom">
            {/* LEFT – Staff */}
            <div className="txp-staff-col">
              <div className="txp-label-cyan">Surgeon</div>
              {s.surgeons.filter(Boolean).map((sg,i)=><div key={i} className="txp-staff-name">{sg}</div>)}
              <div className="txp-label-orange">Time In
                <span className="txp-time-val">{s.timeIn||'—'}</span>
              </div>
              <div className="txp-label-cyan" style={{marginTop:'6px'}}>SCRUB NURSE</div>
              {s.scrubNurses.filter(Boolean).map((sn,i)=><div key={i} className="txp-staff-name">{sn}</div>)}
              <div className="txp-label-orange">Time On
                <span className="txp-time-val">{s.timeOn||'—'}</span>
              </div>
              <div className="txp-label-orange">Time End
                <span className="txp-time-val">{s.timeEnd||'—'}</span>
              </div>
              <div className="txp-label-cyan" style={{marginTop:'6px'}}>Name</div>
              <div className="txp-staff-name">{s.patientName||'—'}</div>
              <div className="txp-label-orange">Time Out
                <span className="txp-time-val">{s.timeOut||'—'}</span>
              </div>
              <div className="txp-label-cyan" style={{marginTop:'6px'}}>HN</div>
              <div className="txp-staff-name">{s.hn||'—'}</div>
            </div>

            {/* MIDDLE – Definitions */}
            <div className="txp-defs">
              <div className="txp-def-row"><b>Perfusion time</b> คือ เวลาขณะ perfusion ก่อนที่จะนำไตเข้าสู่ recipient</div>
              <div className="txp-def-row"><b>Time on Pt.</b> คือ เวลาที่นำไตมาวางบน Recipient</div>
              <div className="txp-def-row"><b>Time transplant</b> คือ เวลาที่ Prolene เย็บแรกปักกลางที่เส้นเลือด</div>
              <div className="txp-def-row"><b>Clamp time</b> คือ เวลา clamp time ของวันที่ Harvest</div>
              <div className="txp-def-row"><b>De-clamp</b> คือ เวลาที่ปล่อยเลือดจาก Recipient เข้าไต</div>
              <div className="txp-def-row"><b>Total time</b> คือ เวลา De-clamp ลบ เวลา clamp time</div>
              {s.note && <div className="txp-def-row" style={{marginTop:'10px',borderTop:'1px solid var(--bd)',paddingTop:'8px'}}><b>หมายเหตุ:</b> {s.note}</div>}
            </div>

            {/* RIGHT – Dates + Total */}
            <div className="txp-right-col">
              <div className="txp-date-pair">
                <div className="txp-date-cell txp-yellow">
                  <div className="txp-date-lbl">Clamp Date</div>
                  <div className="txp-date-sub">(DD/MM/YYYY)</div>
                  <div className="txp-date-val">{txpFmtDate(s.clampDate)}</div>
                </div>
                <div className="txp-date-cell txp-yellow">
                  <div className="txp-date-lbl">De-Clamp Date</div>
                  <div className="txp-date-sub">(DD/MM/YYYY)</div>
                  <div className="txp-date-val">{txpFmtDate(s.deClampDate)}</div>
                </div>
              </div>
              <div className="txp-total-box">
                <div className="txp-total-head">Total Time</div>
                <div className="txp-total-cols">
                  <div className="txp-total-lbl">Hour</div>
                  <div className="txp-total-lbl">minute</div>
                </div>
                <div className="txp-total-vals">
                  <div className="txp-total-num">{total ? total.h : '—'}</div>
                  <div className="txp-total-num">{total ? total.m : '—'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── LIST VIEW ── */
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Transplant Report</div>
          <h1 className="page-title">รายการ Transplant · {cases.length} เคส</h1>
        </div>
        {canEdit && (
          <div className="page-head-actions">
            <button className="btn btn-primary" onClick={openNew}><Icon k="plus" size={16}/><span>สร้าง Case ใหม่</span></button>
          </div>
        )}
      </div>

      {cases.length===0 ? (
        <div className="empty">
          <div className="empty-mark"><Icon k="rep" size={28}/></div>
          <div className="empty-t">ยังไม่มีเคส Transplant</div>
          <div className="empty-s">กด "สร้าง Case ใหม่" เพื่อเริ่มบันทึก</div>
          {canEdit && <button className="btn btn-primary" style={{marginTop:'16px'}} onClick={openNew}><Icon k="plus" size={16}/><span>สร้าง Case ใหม่</span></button>}
        </div>
      ) : (
        <div className="ic-grid" style={{gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))'}}>
          {cases.map((c,i)=>{
            const total = txpTotalHM(c.clampDate,c.clampTime,c.deClampDate,c.deClampTime);
            return (
              <div key={c.id} className="txp-case-card" onClick={()=>openDetail(c)}>
                <div className="txp-case-top">
                  <div className="txp-case-num">Case #{i+1}</div>
                  <div className="txp-case-date">{txpFmtDate(c.date)}</div>
                </div>
                <div className="txp-case-patient">{c.patientName||'—'}</div>
                <div className="txp-case-hn">HN: {c.hn||'—'}</div>
                <div className="txp-case-badges">
                  {c.kidneyLeft  && <span className="pill pill-ok" style={{fontSize:'11px'}}><span className="pill-dot"/>Left</span>}
                  {c.kidneyRight && <span className="pill pill-warn" style={{fontSize:'11px'}}><span className="pill-dot"/>Right</span>}
                  {c.perfusionSolution && <span style={{fontSize:'11px',color:'var(--ink-3)'}}>{c.perfusionSolution} ml</span>}
                </div>
                {total && <div className="txp-case-total">Total: {total.h} ชม. {total.m} นาที</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ===== PostOp Screen (คำแนะนำการปฏิบัติตัวหลังผ่าตัด) ===== */
const POSTOP_GUIDES = [
  { file: 'คำแนะนำหลังขยายท่อปัสสาวะ_A4.pdf',                  title: 'ขยายท่อปัสสาวะ',              color: '#3b82f6' },
  { file: 'คำแนะนำหลังส่องกล้องตรวจทางเดินปัสสาวะ_A4.pdf',      title: 'ส่องกล้องตรวจทางเดินปัสสาวะ', color: '#8b5cf6' },
  { file: 'คำแนะนำหลังเจาะชิ้นเนื้อต่อมลูกหมาก_A4.pdf',         title: 'เจาะชิ้นเนื้อต่อมลูกหมาก',   color: '#06b6d4' },
  { file: 'คำแนะนำหลังผ่าตัดขลิบ_A4.pdf',                       title: 'ผ่าตัดขลิบ',                 color: '#f59e0b' },
  { file: 'คำแนะนำหลังทำหมันชาย_A4.pdf',                        title: 'ทำหมันชาย',                  color: '#10b981' },
  { file: 'คำแนะนำหลังรักษาหูดอวัยวะเพศ_A4.pdf',                title: 'รักษาหูดอวัยวะเพศ',           color: '#ef4444' },
  { file: 'คำแนะนำหลังใส่สาย PCN_A4.pdf',                       title: 'ใส่สาย PCN',                  color: '#64748b' },
];

function PostOpCard({ guide }) {
  const qrRef = useR(null);
  const origin = window.location.origin;
  const pdfPath = '/guides/' + encodeURIComponent(guide.file);
  const fullUrl = origin + pdfPath;

  useE(() => {
    const el = qrRef.current;
    if (!el || typeof QRCode === 'undefined') return;
    el.innerHTML = '';
    new QRCode(el, {
      text: fullUrl,
      width: 186,
      height: 186,
      colorDark: '#0f3d6e',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H,
    });
  }, [fullUrl]);

  function printQR() {
    const canvas = qrRef.current?.querySelector('canvas');
    const imgEl = qrRef.current?.querySelector('img');
    const imgSrc = canvas ? canvas.toDataURL('image/png') : (imgEl ? imgEl.src : '');
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html>
<html><head><title>${guide.title}</title>
<style>
body{font-family:sans-serif;text-align:center;padding:28px 20px;background:#fff}
.hosp{font-size:12px;color:#555;margin-bottom:2px}
.dept{font-size:11px;color:#888;margin-bottom:18px}
h2{font-size:14px;color:#0f3d6e;margin-bottom:6px;font-weight:700}
h3{font-size:18px;color:#1e40af;margin-bottom:16px;font-weight:800;line-height:1.35}
.qr-wrap{display:inline-block;border:2px solid #e2e8f0;border-radius:10px;padding:8px;background:#fff}
.hint{font-size:12px;color:#475569;margin-top:12px}
.url{font-size:9.5px;color:#94a3b8;margin-top:5px;word-break:break-all;max-width:280px;margin-left:auto;margin-right:auto}
@media print{body{padding:12px}button{display:none!important}}
</style></head><body>
<div class="hosp">โรงพยาบาลสมเด็จพระยุพราชนครไทย</div>
<div class="dept">แผนกผ่าตัด Uro · หน่วยส่องกล้อง</div>
<h2>คำแนะนำการปฏิบัติตัวหลังผ่าตัด</h2>
<h3>${guide.title}</h3>
<div class="qr-wrap">${imgSrc ? `<img src="${imgSrc}" width="190" height="190"/>` : '<p>(QR)</p>'}</div>
<div class="hint">สแกน QR Code เพื่อดูคำแนะนำบนมือถือ</div>
<div class="url">${fullUrl}</div>
<script>window.onload=()=>{setTimeout(()=>window.print(),400)}<\/script>
</body></html>`);
    win.document.close();
  }

  return (
    <div className="postop-card">
      <div className="postop-card-bar" style={{ background: guide.color }}/>
      <div className="postop-card-body">
        <div className="postop-title">{guide.title}</div>
        <div className="postop-subtitle">คำแนะนำการปฏิบัติตัวหลังผ่าตัด</div>
        <div className="postop-qr-wrap">
          <div ref={qrRef} className="postop-qr-inner"/>
        </div>
        <div className="postop-actions">
          <button className="btn btn-ghost btn-mini" onClick={() => window.open(pdfPath, '_blank')}>
            <Icon k="book" size={13}/> ดู PDF
          </button>
          <button className="btn btn-primary btn-mini" onClick={printQR}>
            <Icon k="download" size={13}/> พิมพ์ QR
          </button>
        </div>
      </div>
    </div>
  );
}

function PostOpScreen() {
  return (
    <div className="screen-wrap postop-screen">
      <div className="page-head">
        <div>
          <div className="eyebrow">Patient Education · คำแนะนำผู้ป่วย</div>
          <h1 className="page-title">คำแนะนำการปฏิบัติตัวหลังผ่าตัด</h1>
        </div>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Icon k="download" size={16}/> พิมพ์ทั้งหมด
        </button>
      </div>
      <div className="postop-grid">
        {POSTOP_GUIDES.map(g => <PostOpCard key={g.file} guide={g}/>)}
      </div>
    </div>
  );
}

/* ===== Guide screen ===== */
function GuideScreen() {
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <div className="page-head" style={{ flexShrink:0 }}>
        <div>
          <div className="eyebrow">คู่มือ · Reference</div>
          <h1 className="page-title">คู่มือส่งเครื่องมือผ่าตัด แผนกศัลยกรรมทางเดินปัสสาวะ</h1>
        </div>
      </div>
      <iframe
        src="/guide.html"
        style={{ flex:1, border:'none', width:'100%', minHeight:0 }}
        title="คู่มือส่งเครื่องมือผ่าตัด"
      />
    </div>
  );
}


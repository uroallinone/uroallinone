/* Screens — Dashboard, Items, Categories, StockIn, StockOut, Reports */
const { useState: useS, useEffect: useE, useMemo: useM, useRef: useR } = React;

/* ===== Mobile Dashboard (≤720px) ===== */
function MobileDashboard({ items, txns, onGo }) {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const recentOuts = txns
    .filter(t => t.type === 'OUT' && new Date(t.date).getTime() >= cutoff)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 12);

  const restockItems = items
    .filter(i => statusOf(i) !== 'ok')
    .sort((a, b) => {
      const rank = { out: 0, low: 1, warn: 2 };
      return (rank[statusOf(a)] || 3) - (rank[statusOf(b)] || 3);
    });

  const today = new Date().toLocaleDateString('th-TH', { weekday:'long', day:'numeric', month:'long' });

  const S_COLOR = { warn:'#92400e', low:'#c2410c', out:'#991b1b' };
  const S_BG    = { warn:'#fef3c7', low:'#fff7ed', out:'#fee2e2' };
  const S_LABEL = { warn:'เตือน', low:'ใกล้หมด', out:'หมด' };

  const MENUS = [
    { id:'items',       label:'พัสดุหลัก',   icon:'box'     },
    { id:'consumables', label:'สิ้นเปลือง',  icon:'pkg'     },
    { id:'equipment',   label:'ครุภัณฑ์',    icon:'gear'    },
    { id:'stockout',    label:'เบิกใช้',      icon:'out'     },
    { id:'remaining',   label:'คงเหลือ',      icon:'alert'   },
    { id:'po',          label:'OD',           icon:'truck'   },
    { id:'smcguide',    label:'SMC',          icon:'receipt' },
    { id:'guide',       label:'คู่มือ',       icon:'book'    },
  ];

  return (
    <div className="mh-wrap">
      {/* Header */}
      <div className="mh-hero">
        <div className="mh-date">{today}</div>
        <div className="mh-title">ภาพรวมพัสดุ</div>
      </div>

      {/* Stat pills */}
      <div className="mh-stats">
        <div className="mh-stat">
          <div className="mh-stat-n">{items.length}</div>
          <div className="mh-stat-l">รายการ</div>
        </div>
        <div className="mh-stat mh-stat--warn">
          <div className="mh-stat-n">{restockItems.filter(i=>statusOf(i)==='out').length}</div>
          <div className="mh-stat-l">หมดสต๊อก</div>
        </div>
        <div className="mh-stat mh-stat--amber">
          <div className="mh-stat-n">{restockItems.filter(i=>statusOf(i)!=='out').length}</div>
          <div className="mh-stat-l">ใกล้หมด</div>
        </div>
        <div className="mh-stat">
          <div className="mh-stat-n">{recentOuts.length}</div>
          <div className="mh-stat-l">เบิก 7 วัน</div>
        </div>
      </div>

      {/* Restock */}
      {restockItems.length > 0 && (
        <section className="mh-section">
          <div className="mh-sec-head">
            <span className="mh-sec-title">⚠️ ต้องเติมสต๊อก</span>
            <button className="mh-sec-link" onClick={()=>onGo('remaining')}>ดูทั้งหมด →</button>
          </div>
          {restockItems.slice(0, 8).map(it => {
            const s = statusOf(it);
            return (
              <div key={it.code} className="mh-row" onClick={()=>onGo('items')}>
                <div className="mh-row-name">{it.name}</div>
                <div className="mh-row-r">
                  <span className="mh-qty">{it.qty}<span className="mh-unit"> / {it.min} {it.unit}</span></span>
                  <span className="mh-badge" style={{ background: S_BG[s], color: S_COLOR[s] }}>{S_LABEL[s]}</span>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Recent usage */}
      <section className="mh-section">
        <div className="mh-sec-head">
          <span className="mh-sec-title">📋 เบิกใช้ 7 วันที่ผ่านมา</span>
          <button className="mh-sec-link" onClick={()=>onGo('stockout')}>เบิกใหม่ →</button>
        </div>
        {recentOuts.length === 0 ? (
          <div className="mh-empty">ยังไม่มีรายการเบิกใช้ในช่วง 7 วัน</div>
        ) : recentOuts.map(t => (
          <div key={t.id} className="mh-row">
            <div className="mh-row-info">
              <div className="mh-row-name">{t.name}</div>
              <div className="mh-row-meta">{(t.date||'').slice(5).replace('-','/')} · {t.by}</div>
            </div>
            <div className="mh-qty-out">−{Math.abs(t.qty)} {t.unit}</div>
          </div>
        ))}
      </section>

      {/* Menu grid */}
      <section className="mh-section">
        <div className="mh-sec-head"><span className="mh-sec-title">เมนูหลัก</span></div>
        <div className="mh-menu-grid">
          {MENUS.map(m => (
            <button key={m.id} className="mh-menu-card" onClick={()=>onGo(m.id)}>
              <div className="mh-menu-icon"><Icon k={m.icon} size={28}/></div>
              <div className="mh-menu-label">{m.label}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ===== Dashboard ===== */
function Dashboard({ items, txns, burn, month, year, cats, onGo, onStockIn, onStockOut }) {
  const [range, setRange] = useS('day');  // day | month | year

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

  return (
    <>
    <div className="mobile-only"><MobileDashboard items={items} txns={txns} onGo={onGo}/></div>
    <div className="desktop-only page">
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
    </>
  );
}

/* ===== Items list ===== */
function ItemsScreen({ items, cats, query, canEdit, onCount, onStockIn, onStockOut, onAdd, onEdit, onDelete, onImport, vendors=[], onAddVendor, typeFilter, pageLabel }) {
  const [cat, setCat] = useS('all');
  const [status, setStatus] = useS('all');
  const [showAdd, setShowAdd] = useS(false);
  const [showImport, setShowImport] = useS(false);
  const [editItem, setEditItem] = useS(null);

  const typeItems = typeFilter ? items.filter(i => i.type === typeFilter) : items;
  const filtered = typeItems.filter(i => {
    if (cat !== 'all' && i.cat !== cat) return false;
    if (status !== 'all' && statusOf(i) !== status) return false;
    if (query) {
      const q = query.toLowerCase();
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
function ReportsScreen({ items, txns, cats }) {
  const byType = {
    IN: txns.filter(t=>t.type==='IN').reduce((s,t)=>s+Math.abs(t.qty),0),
    OUT: txns.filter(t=>t.type==='OUT').reduce((s,t)=>s+Math.abs(t.qty),0),
    ADJ: txns.filter(t=>t.type==='ADJ').reduce((s,t)=>s+Math.abs(t.qty),0),
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">รายงาน</div>
          <h1 className="page-title">รายงานการเคลื่อนไหวพัสดุ</h1>
          <div className="page-sub">ช่วง 01-05-2569 ถึง 18-05-2569</div>
        </div>
        <div className="page-head-actions">
          <button className="btn btn-ghost"><Icon k="filter" size={16}/><span>ตัวกรอง</span></button>
          <button className="btn btn-primary"><Icon k="download" size={16}/><span>ส่งออก CSV</span></button>
        </div>
      </div>

      <div className="stat-grid stat-grid-3">
        <StatCard tone="ok"   icon="in"  big={fmt(byType.IN)}  label="หน่วยที่รับเข้า"  sub={`${txns.filter(t=>t.type==='IN').length} ใบ`}/>
        <StatCard tone="warn" icon="out" big={fmt(byType.OUT)} label="หน่วยที่เบิกออก" sub={`${txns.filter(t=>t.type==='OUT').length} ใบ`}/>
        <StatCard tone="accent" icon="edit" big={fmt(byType.ADJ)} label="หน่วยที่ปรับยอด" sub={`${txns.filter(t=>t.type==='ADJ').length} ใบ`}/>
      </div>

      <section className="card card-table">
        <div className="card-head">
          <div className="card-title">ประวัติการเคลื่อนไหว</div>
          <div className="legend">
            <span className="legend-item"><span className="dot" style={{ background:'var(--ok)' }}/>รับเข้า</span>
            <span className="legend-item"><span className="dot" style={{ background:'var(--warn)' }}/>เบิกออก</span>
            <span className="legend-item"><span className="dot" style={{ background:'var(--accent)' }}/>ปรับยอด</span>
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
          {txns.map(t => (
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
  const [showAdd, setShowAdd] = useS(false);
  const [editEq, setEditEq] = useS(null);
  const today = new Date();

  const enriched = equipment.map(e => {
    const yrs = eqAgeYears(e.received);
    return { ...e, years: yrs, badge: ageBadge(yrs) };
  });

  const filtered = enriched
    .filter(e => filter==='all' ? true : filter==='alert' ? e.years >= 5 : e.years < 5)
    .sort((a, b) => b.years - a.years);
  const overdue = enriched.filter(e => e.years >= 5).length;
  const totalCost = enriched.reduce((s,e)=>s+e.cost,0);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">ครุภัณฑ์ · Equipment</div>
          <h1 className="page-title">ทะเบียนครุภัณฑ์ห้องผ่าตัด Uro</h1>
          <div className="page-sub">รวม {enriched.length} ชิ้น · มูลค่ารวม {fmt(totalCost)} บาท · ระบบจะแจ้งเตือนอัตโนมัติเมื่อครุภัณฑ์อายุการใช้งานเกิน <b>5 ปี</b></div>
        </div>
        <div className="page-head-actions">
          <button className="btn btn-ghost"><Icon k="download" size={16}/><span>ส่งออก</span></button>
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

      <div className="chips-row">
        <Chip active={filter==='all'} onClick={()=>setFilter('all')}>ทั้งหมด ({enriched.length})</Chip>
        <Chip active={filter==='alert'} onClick={()=>setFilter('alert')}>เกิน 5 ปี ({overdue})</Chip>
        <Chip active={filter==='ok'} onClick={()=>setFilter('ok')}>อยู่ในเกณฑ์ ({enriched.length-overdue})</Chip>
      </div>

      <section className="card card-table">
        <div className="thead thead-eq">
          <div className="th">เลขครุภัณฑ์</div>
          <div className="th">ชื่อครุภัณฑ์</div>
          <div className="th">วันที่รับไว้</div>
          <div className="th th-num">อายุการใช้งาน</div>
          <div className="th">ที่ตั้ง · สภาพ</div>
          <div className="th">สถานะ</div>
        </div>
        <div className="tbody">
          {filtered.map(e => {
            const alert = e.years >= 5;
            const yp = Math.min(1, e.years/10);
            return (
              <div key={e.eq_no} className={cx('tr', 'tr-eq', alert && 'is-alert')}>
                <div className="td"><span className="mono ipiss">{e.eq_no}</span></div>
                <div className="td">
                  <div className="td-name-main">{e.name}</div>
                  <div className="muted sm">มูลค่า {fmt(e.cost)} บาท</div>
                  {e.supplier && <div className="vendor-line" style={{ marginTop:'2px' }}><Icon k="building" size={11}/><span className="vendor-co" style={{ fontSize:'11.5px' }}>{e.supplier}</span></div>}
                </div>
                <div className="td">
                  <div className="mono">{e.received}</div>
                  <div className="muted sm">{e.note}</div>
                </div>
                <div className="td td-num">
                  <div className="qty-num"><b className={alert?'bad':''}>{e.years.toFixed(1)}</b><span className="qty-unit"> ปี</span></div>
                  <div className="age-bar">
                    <span style={{ width:`${yp*100}%`, background: alert?'var(--bad)':e.years>=3?'var(--warn)':'var(--ok)' }}/>
                    <span className="age-mark" style={{ left:'50%' }} title="ครบ 5 ปี"/>
                  </div>
                </div>
                <div className="td">
                  <div>{e.loc}</div>
                  <div className="muted sm">{e.cond}</div>
                </div>
                <div className="td">
                  <span className={cx('pill', `pill-${e.badge.tone==='ok'?'ok':e.badge.tone==='warn'?'warn':'out'}`)}>
                    <span className="pill-dot"/>{e.badge.text}
                  </span>
                </div>
                {canEdit && (
                <div className="td td-act">
                  <button className="btn btn-mini btn-ghost" title="แก้ไข" onClick={()=>setEditEq(e)}>✏️</button>
                  <button className="btn btn-mini btn-danger" title="ลบ" onClick={()=>{ if(window.confirm(`ลบ "${e.name}" ออกจากทะเบียน?`)) onDeleteEquipment(e.eq_no); }}>🗑️</button>
                </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

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
            <div className="input-wrap"><input value={d.received} onChange={e=>set('received',e.target.value)} placeholder="2569-MM-DD"/></div>
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
            <div className="input-wrap"><input value={d.received||''} onChange={e=>set('received',e.target.value)}/></div>
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
          {enriched.map(p => {
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
                  <div className="od-meta-r"><Icon k="cal" size={12}/> สั่งเมื่อ {p.date_ordered}</div>
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
                    <span style={{fontSize:'11px',color:'var(--ink-3)'}}>รับเมื่อ {p.received_date}</span>
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
  return `${p.d} ${THAI_MONTHS_FULL[p.m]} ${p.y}`;
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
            <div style={{ fontWeight:600, fontSize:'13.5px' }}>{THAI_MONTHS_FULL[viewM]} {viewY}</div>
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

      <section className="card card-table">
        <div className="card-head">
          <div className="card-title">รายการพัสดุที่ต้องตรวจสอบ · เรียงตามความเร่งด่วน</div>
          <div className="legend">
            <span className="legend-item"><span className="dot" style={{ background:'var(--bad)' }}/>หมดอายุ / หมดสต๊อก</span>
            <span className="legend-item"><span className="dot" style={{ background:'var(--warn)' }}/>ใกล้หมดอายุ ≤ 3 เดือน</span>
            <span className="legend-item"><span className="dot" style={{ background:'var(--ok)' }}/>ปกติ</span>
          </div>
        </div>
        <div className="thead thead-rem2">
          <div className="th">เลข IPISS / รหัส</div>
          <div className="th">ชื่อพัสดุ</div>
          <div className="th th-num">คงเหลือ / ขั้นต่ำ</div>
          <div className="th">วันหมดอายุ (lot)</div>
          <div className="th">สถานะ</div>
          <div className="th">ดำเนินการ</div>
        </div>
        <div className="tbody">
          {visible.map(it => {
            const cat = cats.find(c=>c.id===it.cat);
            const expired = it.exp.tone === 'expired';
            const expSoon = it.exp.tone === 'soon';
            const stockBad = it.stockS === 'out' || it.stockS === 'low';
            return (
              <div key={it.code} className={cx('tr', 'tr-rem2', (expired || it.stockS==='out') && 'is-alert', expSoon && !expired && 'is-warn')}>
                <div className="td">
                  <span className="mono ipiss">{it.ipiss}</span>
                  <span className="mono sm muted">{it.code} · {it.loc}</span>
                </div>
                <div className="td">
                  <div className="cat-tag sm" style={{ background: `oklch(0.95 0.04 ${cat.hue})`, color: `oklch(0.35 0.12 ${cat.hue})` }}>{cat.en}</div>
                  <div className="td-name-main">{it.name}</div>
                  <div className="muted sm">{it.supplier}</div>
                </div>
                <div className="td td-num">
                  <div className="qty-num">
                    <b className={it.stockS==='out'?'bad':''}>{fmt(it.qty)}</b>
                    <span className="qty-unit"> / {it.min} {it.unit}</span>
                  </div>
                  {stockBad && <div className="muted sm">ขาดอยู่ {it.gap} {it.unit}</div>}
                </div>
                <div className="td td-exp">
                  <div className="exp-date">
                    <Icon k="cal" size={13}/>
                    <span className={expired?'bad':expSoon?'warn-t':''}>{it.exp.tone==='none' ? '—' : it.exp.label === 'หมดอายุแล้ว' ? '—' : (it.exp.days != null && it.exp.days > 90 ? it.exp.label : it.exp.label)}</span>
                  </div>
                  <div className="muted sm mono">OD {it.lot}{it.exp.tone!=='none' ? ` · ${it.exp.tone==='expired' ? 'หมดอายุ ' : 'ครบกำหนด '}${it.exp.tone!=='none'?(it.exp.days != null ? '' : ''):''}` : ''}</div>
                  {it.exp.tone !== 'none' && (
                    <div className={cx('exp-pill', `exp-${it.exp.tone}`)}>
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
                </div>
                <div className="td">
                  {it.stockS !== 'ok' && <StatusPill s={it.stockS}/>}
                  {it.stockS === 'ok' && it.exp.tone !== 'soon' && it.exp.tone !== 'expired' && <StatusPill s="ok"/>}
                </div>
                <div className="td">
                  <button className="btn btn-mini btn-primary" onClick={()=>onStockIn(it.code)}><Icon k="in" size={12}/><span>รับเข้า</span></button>
                  {expired && <button className="btn btn-mini btn-ghost"><Icon k="trash" size={12}/><span>จำหน่ายออก</span></button>}
                  {!expired && stockBad && <button className="btn btn-mini btn-ghost"><Icon k="truck" size={12}/><span>สร้าง OD</span></button>}
                </div>
              </div>
            );
          })}
          {visible.length === 0 && (
            <div className="empty"><div className="empty-mark"><Icon k="check" size={28}/></div>
              <div className="empty-t">ไม่มีรายการในหมวดนี้</div>
              <div className="empty-s">ทุกอย่างอยู่ในเกณฑ์ปกติ — ลองเลือกแท็บอื่น</div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/* ===== SMC Guide screen ===== */
function SMCGuideScreen() {
  const [q, setQ] = useS('');
  const [sitthi, setSitthi] = useS('crh');
  const [time, setTime] = useS('all');

  const SITTHI = [['crh','CRH'],['ins','Insurance'],['th','ต่างชาติ']];
  const SITTHI_LBL = { crh:'CRH', ins:'Insurance', th:'ต่างชาติ' };

  const data = (window.SMC_DATA || []);
  const f = data.filter(d => {
    const matchTime = time === 'all' || d.t === time;
    const matchQ = !q || d.name.toLowerCase().includes(q.toLowerCase()) || d.icd9.includes(q);
    return matchTime && matchQ;
  });

  const b = n => n ? `฿${n.toLocaleString()}` : '฿0';

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
        {f.map((d,i) => {
          const s = d[sitthi] || {};
          return (
            <div key={i} className="smc-card">
              <div className="smc-card-top">
                <div className="smc-name">{d.name}</div>
                <div className="smc-total">{b(s.total)}</div>
              </div>
              <div className="smc-badges">
                <span className="smc-badge icd">ICD9 {d.icd9}</span>
                <span className={cx('smc-badge', d.t==='gt2'?'gt2':'lt2')}>{d.t==='gt2'?'OR >2hr':'OR <2hr'}</span>
                <span className="smc-total-lbl">รวมชำระ {SITTHI_LBL[sitthi]}</span>
              </div>

              <div className="smc-div"/>

              <div className="smc-fee-grid">
                <div className="smc-fee-cell">
                  <div className="smc-fee-lbl">ค่าห้องผ่าตัด</div>
                  <div className="smc-fee-val">{b(s.room)}</div>
                </div>
                <div className="smc-fee-cell">
                  <div className="smc-fee-lbl">DF Sx</div>
                  <div className="smc-fee-val">{b(s.dfSx)}</div>
                </div>
                <div className="smc-fee-cell">
                  <div className="smc-fee-lbl">DF Anes</div>
                  <div className="smc-fee-val">{b(s.dfAnes)}</div>
                </div>
              </div>

              <div className="smc-div"/>

              <div className="smc-fee-grid">
                <div className="smc-fee-cell">
                  <div className="smc-fee-lbl">Scrub Nurse</div>
                  <div className="smc-fee-val accent">{b(s.scrub)}</div>
                </div>
                <div className="smc-fee-cell">
                  <div className="smc-fee-lbl">Anes Nurse</div>
                  <div className="smc-fee-val accent">{b(s.anesN)}</div>
                </div>
                <div className="smc-fee-cell">
                  <div className="smc-fee-lbl">Nurse Aid</div>
                  <div className="smc-fee-val accent">{b(s.nurseAid)}</div>
                </div>
              </div>
            </div>
          );
        })}
        {f.length === 0 && (
          <div className="smc-empty">ไม่พบรายการที่ตรงกับการค้นหา</div>
        )}
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


/* Screens — Dashboard, Items, Categories, StockIn, StockOut, Reports */
const { useState: useS, useEffect: useE, useMemo: useM, useRef: useR } = React;

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
function ItemsScreen({ items, cats, query, onCount, onStockIn, onStockOut, onAdd, onEdit, onDelete, onImport }) {
  const [cat, setCat] = useS('all');
  const [status, setStatus] = useS('all');
  const [showAdd, setShowAdd] = useS(false);
  const [showImport, setShowImport] = useS(false);
  const [editItem, setEditItem] = useS(null);

  const filtered = items.filter(i => {
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
          <div className="eyebrow">พัสดุ · Materials</div>
          <h1 className="page-title">คลังพัสดุ Uro · {fmt(filtered.length)} รายการ</h1>
          <div className="page-sub">มูลค่าคงเหลือ <b>{fmt(totalValue)} บาท</b> · ระบุ <b>เลข IPISS</b> ทุกรายการ · กำหนดจำนวนคงเหลือขั้นต่ำเพื่อแจ้งเตือนอัตโนมัติ</div>
        </div>
        <div className="page-head-actions">
          <button className="btn btn-ghost"><Icon k="qr" size={16}/><span>สแกน QR</span></button>
          <button className="btn btn-ghost" onClick={()=>setShowImport(true)}><Icon k="sheet" size={16}/><span>นำเข้าจาก Google Sheet</span></button>
          <button className="btn btn-primary" onClick={()=>setShowAdd(true)}><Icon k="plus" size={16}/><span>เพิ่มรายการ</span></button>
        </div>
      </div>

      <div className="chips-row">
        <Chip active={cat==='all'} onClick={()=>setCat('all')}>ทั้งหมด ({items.length})</Chip>
        {cats.map(c => (
          <Chip key={c.id} active={cat===c.id} onClick={()=>setCat(c.id)} hue={c.hue}>
            {c.name} ({items.filter(i=>i.cat===c.id).length})
          </Chip>
        ))}
        <div className="chip-sep"/>
        {['all','ok','warn','low','out'].map(s => (
          <Chip key={s} active={status===s} onClick={()=>setStatus(s)} small>
            {s==='all'?'ทุกสถานะ':STATUS_TEXT[s]}
          </Chip>
        ))}
      </div>

      <section className="card card-table">
        <div className="thead thead-items">
          <div className="th">เลข IPISS / รหัส</div>
          <div className="th">ชื่อพัสดุ</div>
          <div className="th th-num">ราคา/หน่วย</div>
          <div className="th th-num">คงเหลือ</div>
          <div className="th th-num">ขั้นต่ำ</div>
          <div className="th">สถานะ</div>
          <div className="th">ปรับสต๊อก</div>
        </div>
        <div className="tbody">
          {filtered.map(it => {
            const s = statusOf(it);
            const cat = cats.find(c=>c.id===it.cat);
            const ratio = Math.min(1, it.qty / (it.min * 2.2 || 1));
            return (
              <div key={it.code} className="tr tr-items">
                <div className="td td-code">
                  <span className="mono ipiss">{it.ipiss}</span>
                  <span className="mono sm muted">{it.code} · {it.loc}</span>
                </div>
                <div className="td td-name">
                  <div className="cat-tag sm" style={{ background: `oklch(0.95 0.04 ${cat.hue})`, color: `oklch(0.35 0.12 ${cat.hue})` }}>{cat.en}</div>
                  <div className="td-name-text">
                    <div className="td-name-main">{it.name}</div>
                    <div className="td-name-sub">OD {it.lot} · หมดอายุ {it.exp}</div>
                    <div className="vendor-line">
                      <span className="vendor-co"><Icon k="building" size={12}/>{it.supplier || '—'}</span>
                      {it.tel && <a className="vendor-tel" href={`tel:${it.tel.replace(/-/g,'')}`}><Icon k="phone" size={12}/>{it.tel}</a>}
                    </div>
                  </div>
                </div>
                <div className="td td-num">
                  <div className="qty-num"><b>{fmt(it.price||0)}</b></div>
                  <div className="muted sm">บาท</div>
                </div>
                <div className="td td-num td-qty">
                  <div className="qty-num">
                    <b className={s==='out'?'bad':''}>{fmt(it.qty)}</b><span className="qty-unit"> {it.unit}</span>
                  </div>
                  <div className="qty-bar">
                    <span style={{ width: `${ratio*100}%`, background: s==='out'?'var(--bad)':s==='low'?'var(--warn)':s==='warn'?'var(--warn-2)':'var(--ok)' }}/>
                    <span className="qty-min" style={{ left: `${(it.min/(it.min*2.2||1))*100}%` }} title={`ขั้นต่ำ ${it.min}`}/>
                  </div>
                </div>
                <div className="td td-num">
                  <div className="muted">{it.min} {it.unit}</div>
                </div>
                <div className="td td-st"><StatusPill s={s}/></div>
                <div className="td td-act">
                  <button className="stepper" onClick={()=>onCount(it.code, -1)} aria-label="ลด"><Icon k="minus" size={14}/></button>
                  <button className="stepper" onClick={()=>onCount(it.code, +1)} aria-label="เพิ่ม"><Icon k="plus" size={14}/></button>
                  <button className="btn btn-mini btn-ghost" onClick={()=>onStockIn(it.code)}>รับ</button>
                  <button className="btn btn-mini btn-primary" onClick={()=>onStockOut(it.code)}>เบิก</button>
                  <button className="btn btn-mini btn-ghost" title="แก้ไข" onClick={()=>setEditItem(it)}>✏️</button>
                  <button className="btn btn-mini btn-danger" title="ลบ" onClick={()=>{ if(window.confirm(`ลบ "${it.name}" ออกจากคลัง?`)) onDelete(it.code); }}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="tfoot">
          <span>แสดง {filtered.length} จาก {items.length} รายการ · มูลค่ารวม {fmt(totalValue)} บาท</span>
          <div className="pager">
            <button className="pg">‹</button>
            <button className="pg pg-on">1</button>
            <button className="pg">2</button>
            <button className="pg">›</button>
          </div>
        </div>
      </section>

      {showAdd && <AddItemModal cats={cats} onClose={()=>setShowAdd(false)} onSave={(d)=>{ onAdd(d); setShowAdd(false); }}/>}
      {showImport && <ImportSheetModal onClose={()=>setShowImport(false)} onImport={(rows)=>{ onImport(rows); setShowImport(false); }}/>}
      {editItem && <EditItemModal cats={cats} item={editItem} onClose={()=>setEditItem(null)} onSave={(d)=>{ onEdit(d); setEditItem(null); }}/>}
    </div>
  );
}

/* ===== Add item modal ===== */
function AddItemModal({ cats, onClose, onSave }) {
  const [d, setD] = useS({ ipiss:'', code:'', name:'', cat:'cath', unit:'ชิ้น', qty:0, min:0, price:0, loc:'', supplier:'', tel:'' });
  function set(k, v) { setD(o => ({ ...o, [k]: v })); }
  const ok = d.ipiss && d.name && d.code;
  return (
    <ModalShell title="เพิ่มรายการพัสดุใหม่" onClose={onClose} icon="plus">
      <div className="form">
        <div className="form-row">
          <label className="lbl">เลข IPISS *
            <div className="input-wrap"><input value={d.ipiss} onChange={e=>set('ipiss',e.target.value)} placeholder="7110-XXX-XXXX/2569"/></div>
          </label>
          <label className="lbl">รหัสภายใน *
            <div className="input-wrap"><input value={d.code} onChange={e=>set('code',e.target.value)} placeholder="URO-XX-XXX"/></div>
          </label>
        </div>
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
        <div className="form-row">
          <label className="lbl">ราคา/หน่วย (บาท)
            <div className="input-wrap"><input type="number" value={d.price} onChange={e=>set('price',Number(e.target.value))}/></div>
          </label>
          <label className="lbl">ที่เก็บ
            <div className="input-wrap"><input value={d.loc} onChange={e=>set('loc',e.target.value)} placeholder="เช่น A-01"/></div>
          </label>
        </div>
        <div className="form-row">
          <label className="lbl">บริษัทคู่ค้า / ผู้จำหน่าย
            <div className="input-wrap"><Icon k="building" size={15}/><input value={d.supplier} onChange={e=>set('supplier',e.target.value)} placeholder="เช่น Bard, Olympus"/></div>
          </label>
          <label className="lbl">เบอร์โทรติดต่อ
            <div className="input-wrap"><Icon k="phone" size={15}/><input value={d.tel} onChange={e=>set('tel',e.target.value)} placeholder="02-XXX-XXXX"/></div>
          </label>
        </div>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" disabled={!ok} onClick={()=>onSave(d)}><Icon k="check" size={14}/><span>บันทึก</span></button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ===== Edit item modal ===== */
function EditItemModal({ cats, item, onClose, onSave }) {
  const [d, setD] = useS({ ...item });
  function set(k, v) { setD(o => ({ ...o, [k]: v })); }
  const ok = d.ipiss && d.name && d.code;
  return (
    <ModalShell title="แก้ไขรายการพัสดุ" onClose={onClose} icon="edit">
      <div className="form">
        <div className="form-row">
          <label className="lbl">เลข IPISS *
            <div className="input-wrap"><input value={d.ipiss} onChange={e=>set('ipiss',e.target.value)}/></div>
          </label>
          <label className="lbl">รหัสภายใน *
            <div className="input-wrap"><input value={d.code} onChange={e=>set('code',e.target.value)}/></div>
          </label>
        </div>
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
        <div className="form-row">
          <label className="lbl">ราคา/หน่วย (บาท)
            <div className="input-wrap"><input type="number" value={d.price||0} onChange={e=>set('price',Number(e.target.value))}/></div>
          </label>
          <label className="lbl">ที่เก็บ
            <div className="input-wrap"><input value={d.loc||''} onChange={e=>set('loc',e.target.value)}/></div>
          </label>
        </div>
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
            <div className="input-wrap"><Icon k="building" size={15}/><input value={d.supplier||''} onChange={e=>set('supplier',e.target.value)}/></div>
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

Object.assign(window, { Dashboard, ItemsScreen, CategoriesScreen, StockMoveScreen, ReportsScreen, EquipmentScreen, POScreen, RemainingScreen, TrendBars });

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

function EquipmentScreen({ equipment, onAddEquipment, onEditEquipment, onDeleteEquipment }) {
  const [filter, setFilter] = useS('all');
  const [showAdd, setShowAdd] = useS(false);
  const [editEq, setEditEq] = useS(null);
  const today = new Date();

  const enriched = equipment.map(e => {
    const yrs = eqAgeYears(e.received);
    return { ...e, years: yrs, badge: ageBadge(yrs) };
  });

  const filtered = enriched.filter(e =>
    filter==='all' ? true : filter==='alert' ? e.years >= 5 : e.years < 5
  );
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
          <button className="btn btn-primary" onClick={()=>setShowAdd(true)}><Icon k="plus" size={16}/><span>เพิ่มครุภัณฑ์</span></button>
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
                <div className="td td-act">
                  <button className="btn btn-mini btn-ghost" title="แก้ไข" onClick={()=>setEditEq(e)}>✏️</button>
                  <button className="btn btn-mini btn-danger" title="ลบ" onClick={()=>{ if(window.confirm(`ลบ "${e.name}" ออกจากทะเบียน?`)) onDeleteEquipment(e.eq_no); }}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {showAdd && <AddEquipmentModal onClose={()=>setShowAdd(false)} onSave={(d)=>{ onAddEquipment(d); setShowAdd(false); }}/>}
      {editEq && <EditEquipmentModal eq={editEq} onClose={()=>setEditEq(null)} onSave={(d)=>{ onEditEquipment(d); setEditEq(null); }}/>}
    </div>
  );
}

/* ===== Equipment modals ===== */
function AddEquipmentModal({ onClose, onSave }) {
  const today = new Date();
  const be = `${today.getFullYear()+543}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const [d, setD] = useS({ eq_no:'', name:'', received: be, cost:0, loc:'', cond:'ปกติ', note:'' });
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
        <div className="form-row">
          <label className="lbl">มูลค่า (บาท)
            <div className="input-wrap"><input type="number" value={d.cost} onChange={e=>set('cost',Number(e.target.value))}/></div>
          </label>
          <label className="lbl">ที่ตั้ง
            <div className="input-wrap"><input value={d.loc} onChange={e=>set('loc',e.target.value)} placeholder="ห้อง A-02"/></div>
          </label>
        </div>
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
          <button className="btn btn-primary" disabled={!ok} onClick={()=>onSave(d)}><Icon k="check" size={14}/><span>บันทึก</span></button>
        </div>
      </div>
    </ModalShell>
  );
}

function EditEquipmentModal({ eq, onClose, onSave }) {
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
        <div className="form-row">
          <label className="lbl">มูลค่า (บาท)
            <div className="input-wrap"><input type="number" value={d.cost||0} onChange={e=>set('cost',Number(e.target.value))}/></div>
          </label>
          <label className="lbl">ที่ตั้ง
            <div className="input-wrap"><input value={d.loc||''} onChange={e=>set('loc',e.target.value)}/></div>
          </label>
        </div>
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

function POScreen({ pos = [], onChange }) {
  const [showAdd, setShowAdd] = useS(false);
  const [editPO, setEditPO] = useS(null);
  const [now, setNow] = useS(Date.now());

  // Real-time tick every 30s (visual cue for "live")
  useE(() => { const t = setInterval(()=>setNow(Date.now()), 30000); return ()=>clearInterval(t); }, []);

  const enriched = pos.map(p => {
    const days = poWaitDays(p.date_ordered, p.received_date);
    const over180 = days > 180 && p.status !== 'RECEIVED';
    const ratio = Math.min(1, days/Math.max(p.est_days, 1));
    return { ...p, days, over180, ratio };
  });

  const counts = {
    pending: enriched.filter(p=>p.status==='PENDING').length,
    shipped: enriched.filter(p=>p.status==='SHIPPED').length,
    received: enriched.filter(p=>p.status==='RECEIVED').length,
    alert: enriched.filter(p=>p.over180).length,
  };

  function markReceived(od_no) {
    const t = new Date();
    const be = `${t.getFullYear()+543}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
    onChange(pos.map(p => p.od_no===od_no ? { ...p, status:'RECEIVED', received_date: be } : p));
  }

  function addPO(d) {
    onChange([{ ...d, status:'PENDING' }, ...pos]);
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
          <button className="btn btn-primary" onClick={()=>setShowAdd(true)}><Icon k="plus" size={16}/><span>เพิ่ม OD</span></button>
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

      <section className="card">
        <div className="card-head">
          <div className="card-title">รายการ OD ทั้งหมด</div>
          <div className="legend">
            <span className="legend-item"><span className="dot" style={{ background:'var(--ok)' }}/>รับของแล้ว</span>
            <span className="legend-item"><span className="dot" style={{ background:'var(--warn)' }}/>กำลังรอ</span>
            <span className="legend-item"><span className="dot" style={{ background:'var(--bad)' }}/>เกิน 180 วัน</span>
          </div>
        </div>
        <ul className="polist">
          {enriched.map(p => (
            <li key={p.od_no} className={cx('po-row', p.over180 && 'is-alert', p.status==='RECEIVED' && 'is-done')}>
              <div className="po-l">
                <div className="po-head">
                  <span className="mono po-no">{p.od_no}</span>
                  <span className={cx('po-status', `po-${p.status.toLowerCase()}`)}>{
                    p.status==='RECEIVED'?'รับของแล้ว': p.status==='SHIPPED'?'อยู่ระหว่างขนส่ง':'รอจัดส่ง'
                  }</span>
                  {p.over180 && <span className="po-alert"><Icon k="alert" size={12}/>เกิน 180 วัน</span>}
                </div>
                <div className="po-items">{p.items}</div>
                <div className="po-meta">
                  <span><Icon k="cal" size={12}/> สั่งเมื่อ {p.date_ordered}</span>
                  <span><Icon k="truck" size={12}/> {p.vendor}</span>
                  <span><Icon k="clock" size={12}/> คาดว่ารับ {p.est_days} วัน</span>
                </div>
              </div>
              <div className="po-r">
                <div className="po-days">
                  <div className="po-days-num">
                    <b className={p.over180?'bad':''}>{p.days}</b><span> วัน</span>
                  </div>
                  <div className="po-days-lbl">{p.status==='RECEIVED'?'ใช้เวลารวม':'รอคอยอยู่'}</div>
                </div>
                <div className="po-bar">
                  <span className="po-bar-fill"
                        style={{ width: `${Math.min(100, p.ratio*100)}%`,
                                 background: p.over180?'var(--bad)':p.ratio>1?'var(--warn)':'var(--ok)' }}/>
                  <span className="po-bar-180" style={{ left:`${Math.min(100, (180/Math.max(p.est_days,1))*100)}%` }} title="180 วัน"/>
                </div>
                {p.status !== 'RECEIVED' && (
                  <button className="btn btn-mini btn-primary" onClick={()=>markReceived(p.od_no)}>
                    <Icon k="check" size={12}/><span>ยืนยันรับของ</span>
                  </button>
                )}
                {p.status === 'RECEIVED' && (
                  <span className="muted sm">รับเมื่อ {p.received_date}</span>
                )}
                <button className="btn btn-mini btn-ghost" title="แก้ไข" onClick={()=>setEditPO(p)}>✏️</button>
                <button className="btn btn-mini btn-danger" title="ลบ" onClick={()=>{ if(window.confirm(`ลบ OD "${p.od_no}" ออก?`)) onChange(pos.filter(x=>x.od_no!==p.od_no)); }}>🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {showAdd && <AddPOModal onClose={()=>setShowAdd(false)} onSave={(d)=>{ addPO(d); setShowAdd(false); }}/>}
      {editPO && <EditPOModal po={editPO} onClose={()=>setEditPO(null)} onSave={(d)=>{ onChange(pos.map(p=>p.od_no===d.od_no?d:p)); setEditPO(null); }}/>}
    </div>
  );
}

function AddPOModal({ onClose, onSave }) {
  const today = new Date();
  const be = `${today.getFullYear()+543}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const [d, setD] = useS({ od_no:'', date_ordered: be, items:'', vendor:'', est_days: 30 });
  function set(k,v){ setD(o=>({...o,[k]:v})); }
  const ok = d.od_no && d.items && d.vendor;
  return (
    <ModalShell title="เพิ่มใบสั่งซื้อ (OD)" onClose={onClose} icon="truck">
      <div className="form">
        <div className="form-row">
          <label className="lbl">เลข OD *
            <div className="input-wrap"><input value={d.od_no} onChange={e=>set('od_no',e.target.value)} placeholder="OD-2569-XXXX"/></div>
          </label>
          <label className="lbl">วันที่สั่งซื้อ
            <div className="input-wrap"><input value={d.date_ordered} onChange={e=>set('date_ordered',e.target.value)} placeholder="2569-MM-DD"/></div>
          </label>
        </div>
        <label className="lbl">รายการพัสดุ *
          <div className="input-wrap"><input value={d.items} onChange={e=>set('items',e.target.value)} placeholder="เช่น Foley 2-way 16 Fr × 200"/></div>
        </label>
        <div className="form-row">
          <label className="lbl">ผู้จำหน่าย *
            <div className="input-wrap"><input value={d.vendor} onChange={e=>set('vendor',e.target.value)}/></div>
          </label>
          <label className="lbl">คาดว่าจะได้รับใน (วัน)
            <div className="input-wrap"><input type="number" value={d.est_days} onChange={e=>set('est_days',Number(e.target.value))}/></div>
          </label>
        </div>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" disabled={!ok} onClick={()=>onSave(d)}><Icon k="check" size={14}/><span>บันทึก OD</span></button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ===== Edit PO modal ===== */
function EditPOModal({ po, onClose, onSave }) {
  const [d, setD] = useS({ ...po });
  function set(k,v){ setD(o=>({...o,[k]:v})); }
  const ok = d.od_no && d.items && d.vendor;
  return (
    <ModalShell title="แก้ไขใบสั่งซื้อ (OD)" onClose={onClose} icon="edit">
      <div className="form">
        <div className="form-row">
          <label className="lbl">เลข OD *
            <div className="input-wrap"><input value={d.od_no} onChange={e=>set('od_no',e.target.value)}/></div>
          </label>
          <label className="lbl">วันที่สั่งซื้อ
            <div className="input-wrap"><input value={d.date_ordered||''} onChange={e=>set('date_ordered',e.target.value)}/></div>
          </label>
        </div>
        <label className="lbl">รายการพัสดุ *
          <div className="input-wrap"><input value={d.items} onChange={e=>set('items',e.target.value)}/></div>
        </label>
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
          <button className="btn btn-primary" disabled={!ok} onClick={()=>onSave(d)}><Icon k="check" size={14}/><span>บันทึกการแก้ไข</span></button>
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


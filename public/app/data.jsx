/* Mock data for Uro surgery department stock — extended */

const URO_CATEGORIES = [
  { id: 'scope',   name: 'กล้องส่องตรวจ',    en: 'Scopes',           hue: 200 },
  { id: 'cath',    name: 'สายสวน',           en: 'Catheter',         hue: 165 },
  { id: 'stent',   name: 'เครื่องมือหลัก',   en: 'Main Instruments',  hue: 35  },
  { id: 'drape',   name: 'อุปกรณ์ Lap',      en: 'Lap Equipment',     hue: 280 },
  { id: 'consum',  name: 'อุปกรณ์สิ้นเปลือง', en: 'Consumables',      hue: 0   },
];

/* Items: เพิ่ม ipiss (เลขครุภัณฑ์/รหัส IPISS พัสดุ) และ price (บาท/หน่วย) */
const URO_ITEMS = [
  // Scopes / instruments
  { code: 'URO-SC-001', ipiss: '7110-002-0001/2566', name: 'Cystoscope Sheath 22 Fr',          cat: 'scope',  unit: 'ชิ้น',  qty: 8,   min: 4,  price: 28500,  loc: 'A-01', lot: 'LT24-118', exp: '2027-04-10', supplier: 'Karl Storz', tel: '02-260-7370' },
  { code: 'URO-SC-002', ipiss: '7110-002-0002/2566', name: 'Resectoscope Working Element',     cat: 'scope',  unit: 'ชิ้น',  qty: 3,   min: 2,  price: 42000,  loc: 'A-01', lot: 'LT24-091', exp: '2027-09-22', supplier: 'Olympus', tel: '02-787-8200' },
  { code: 'URO-SC-003', ipiss: '7110-002-0003/2567', name: 'Flexible Cystoscope CYF-VHA',      cat: 'scope',  unit: 'ชิ้น',  qty: 2,   min: 2,  price: 380000, loc: 'A-02', lot: 'LT23-220', exp: '2028-01-15', supplier: 'Olympus', tel: '02-787-8200' },
  { code: 'URO-SC-004', ipiss: '7110-002-0004/2567', name: 'Ureteroscope 8/9.8 Fr',            cat: 'scope',  unit: 'ชิ้น',  qty: 1,   min: 2,  price: 295000, loc: 'A-02', lot: 'LT24-007', exp: '2027-12-01', supplier: 'Karl Storz', tel: '02-260-7370' },

  // Catheters
  { code: 'URO-CA-101', ipiss: '6515-101-0101/2568', name: 'Foley 2-way 16 Fr (Silicone)',     cat: 'cath',   unit: 'เส้น',  qty: 142, min: 60, price: 75,     loc: 'B-03', lot: 'LT26-014', exp: '2028-05-01', supplier: 'Bard', tel: '02-693-2244' },
  { code: 'URO-CA-102', ipiss: '6515-101-0102/2568', name: 'Foley 3-way 22 Fr (Latex)',        cat: 'cath',   unit: 'เส้น',  qty: 36,  min: 40, price: 145,    loc: 'B-03', lot: 'LT26-031', exp: '2028-02-18', supplier: 'Bard', tel: '02-693-2244' },
  { code: 'URO-CA-103', ipiss: '6515-101-0103/2568', name: 'Nelaton Cath. 14 Fr',              cat: 'cath',   unit: 'เส้น',  qty: 0,   min: 30, price: 32,     loc: 'B-04', lot: '—',         exp: '—',          supplier: 'Coloplast', tel: '02-617-7444' },
  { code: 'URO-CA-104', ipiss: '6515-101-0104/2568', name: 'Suprapubic Cath. 16 Fr',           cat: 'cath',   unit: 'ชุด',   qty: 18,  min: 8,  price: 880,    loc: 'B-04', lot: 'LT25-220', exp: '2026-08-12', supplier: 'Cook', tel: '02-714-2222' },

  // Stents / guidewires
  { code: 'URO-ST-201', ipiss: '6515-201-0201/2568', name: 'Double-J Stent 6 Fr × 26 cm',      cat: 'stent',  unit: 'ชิ้น',  qty: 24,  min: 15, price: 2400,   loc: 'C-01', lot: 'LT26-007', exp: '2028-06-30', supplier: 'Boston Sci.', tel: '02-665-9999' },
  { code: 'URO-ST-202', ipiss: '6515-201-0202/2568', name: 'Double-J Stent 4.7 Fr × 24 cm',    cat: 'stent',  unit: 'ชิ้น',  qty: 11,  min: 12, price: 2400,   loc: 'C-01', lot: 'LT26-008', exp: '2026-04-10', supplier: 'Boston Sci.', tel: '02-665-9999' },
  { code: 'URO-ST-203', ipiss: '6515-201-0203/2568', name: 'Hydrophilic Guidewire 0.038"',     cat: 'stent',  unit: 'เส้น',  qty: 47,  min: 20, price: 1850,   loc: 'C-02', lot: 'LT25-188', exp: '2027-10-12', supplier: 'Terumo', tel: '02-018-2200' },
  { code: 'URO-ST-204', ipiss: '6515-201-0204/2568', name: 'Nitinol Stone Basket 2.4 Fr',      cat: 'stent',  unit: 'ชิ้น',  qty: 6,   min: 4,  price: 6500,   loc: 'C-02', lot: 'LT25-201', exp: '2028-03-04', supplier: 'Cook', tel: '02-714-2222' },

  // Drape / gown
  { code: 'URO-DR-301', ipiss: '6515-301-0301/2568', name: 'TURP Drape Set (sterile)',         cat: 'drape',  unit: 'ชุด',   qty: 22,  min: 12, price: 380,    loc: 'D-01', lot: 'LT26-019', exp: '2027-08-21', supplier: 'Mölnlycke', tel: '02-714-7799' },
  { code: 'URO-DR-302', ipiss: '6515-301-0302/2568', name: 'Surgical Gown XL',                 cat: 'drape',  unit: 'ตัว',   qty: 84,  min: 40, price: 95,     loc: 'D-02', lot: 'LT26-020', exp: '2028-01-30', supplier: 'Mölnlycke', tel: '02-714-7799' },
  { code: 'URO-DR-303', ipiss: '6515-301-0303/2568', name: 'Cystoscopy Drape with Pouch',      cat: 'drape',  unit: 'ผืน',   qty: 9,   min: 10, price: 220,    loc: 'D-01', lot: 'LT25-310', exp: '2026-06-30', supplier: '3M', tel: '02-260-8577' },

  // Fluid
  { code: 'URO-FL-401', ipiss: '6505-401-0401/2568', name: 'Glycine 1.5% 3000 ml',             cat: 'fluid',  unit: 'ถุง',   qty: 56,  min: 30, price: 165,    loc: 'E-01', lot: 'LT26-401', exp: '2027-05-15', supplier: 'Baxter', tel: '02-022-1999' },
  { code: 'URO-FL-402', ipiss: '6505-401-0402/2568', name: 'NSS 0.9% 1000 ml',                 cat: 'fluid',  unit: 'ขวด',   qty: 210, min: 80, price: 38,     loc: 'E-01', lot: 'LT26-402', exp: '2027-07-02', supplier: 'B.Braun', tel: '02-723-9000' },
  { code: 'URO-FL-403', ipiss: '6505-401-0403/2568', name: 'Sterile Water 3000 ml',            cat: 'fluid',  unit: 'ถุง',   qty: 18,  min: 25, price: 145,    loc: 'E-02', lot: 'LT25-409', exp: '2026-07-15', supplier: 'Baxter', tel: '02-022-1999' },

  // Consumables
  { code: 'URO-CN-501', ipiss: '6515-501-0501/2568', name: 'Sterile Gloves Size 7',            cat: 'consum', unit: 'คู่',   qty: 320, min: 120, price: 14,    loc: 'F-01', lot: 'LT26-501', exp: '2028-09-01', supplier: 'Ansell', tel: '02-637-9555' },
  { code: 'URO-CN-502', ipiss: '6515-501-0502/2568', name: 'Sterile Gloves Size 7.5',          cat: 'consum', unit: 'คู่',   qty: 88,  min: 100, price: 14,    loc: 'F-01', lot: 'LT26-502', exp: '2028-09-01', supplier: 'Ansell', tel: '02-637-9555' },
  { code: 'URO-CN-503', ipiss: '6515-501-0503/2568', name: 'Lubricant Jelly 5 g',              cat: 'consum', unit: 'ซอง',   qty: 412, min: 150, price: 8,     loc: 'F-02', lot: 'LT26-503', exp: '2027-11-15', supplier: 'KY', tel: '02-262-8000' },
  { code: 'URO-CN-504', ipiss: '6515-501-0504/2568', name: 'Syringe 10 ml',                    cat: 'consum', unit: 'อัน',   qty: 0,   min: 100, price: 3,     loc: 'F-02', lot: '—',         exp: '—',          supplier: 'Nipro', tel: '02-794-2000' },
];

/* คุรุภัณฑ์ (Equipment / durable goods) — แจ้งเตือนเมื่ออายุเกิน 5 ปี */
const URO_EQUIPMENT = [
  { eq_no: 'อย.7110-001/2562-001', name: 'Resectoscope Set 26 Fr (Olympus)',     received: '2562-04-12', cost: 1850000, loc: 'OR1', cond: 'ดี',       responsible: 'พญ. สุดา', note: 'ตรวจสอบประจำปี ก.พ. 2569' },
  { eq_no: 'อย.7110-001/2563-007', name: 'Cystoscope Tower (Karl Storz IMAGE1)', received: '2563-09-30', cost: 2950000, loc: 'OR1', cond: 'ดี',       responsible: 'พญ. สุดา', note: '—' },
  { eq_no: 'อย.7110-001/2564-002', name: 'Holmium Laser MOSES 100 W',            received: '2564-06-18', cost: 4250000, loc: 'OR2', cond: 'ดี',       responsible: 'นพ. เอกชัย',note: 'รับประกัน 2569' },
  { eq_no: 'อย.7110-001/2566-014', name: 'Mobile C-arm (Ziehm Vision RFD)',      received: '2566-02-05', cost: 5800000, loc: 'OR3', cond: 'ดี',       responsible: 'นพ. เอกชัย',note: '—' },
  { eq_no: 'อย.7110-001/2561-019', name: 'Electrosurgical Unit ESU 400',         received: '2561-11-22', cost: 380000,  loc: 'OR2', cond: 'ใช้งานได้', responsible: 'พยาบาล นัท',note: 'สอบเทียบล่าสุด ม.ค. 2568' },
  { eq_no: 'อย.7110-001/2560-003', name: 'Operating Table Steris 4085',          received: '2560-08-14', cost: 2200000, loc: 'OR1', cond: 'ซ่อมบำรุง', responsible: 'หน. ห้องผ่าตัด',note: 'รออะไหล่ไฮดรอลิก' },
  { eq_no: 'อย.7110-001/2559-008', name: 'Lithotripter (Storz Modulith SLX-F2)', received: '2559-03-09', cost: 6500000, loc: 'OR4', cond: 'ดี',       responsible: 'นพ. ภาคิน',note: 'อายุการใช้งานนาน — เฝ้าระวัง' },
  { eq_no: 'อย.7110-001/2568-001', name: 'Ureteroscope Imaging Tower (Olympus)', received: '2568-01-20', cost: 3200000, loc: 'OR2', cond: 'ดี',       responsible: 'พญ. สุดา', note: 'ใหม่ปีนี้' },
];

/* Purchase Order tracking — กรอกเลข OD แล้ว แสดงจำนวนวันรอคอย realtime */
const URO_PO = [
  { od_no: 'OD-2569-0411', date_ordered: '2569-04-29', items: 'Foley 3-way 22 Fr × 200, Nelaton 14 Fr × 200', vendor: 'Bard Thailand',     est_days: 30, status: 'PENDING' },
  { od_no: 'OD-2569-0402', date_ordered: '2569-04-04', items: 'Double-J Stent 4.7 Fr × 30',                    vendor: 'Boston Scientific', est_days: 45, status: 'PENDING' },
  { od_no: 'OD-2569-0318', date_ordered: '2569-03-12', items: 'Resectoscope Loop × 20, Bipolar Loop × 10',     vendor: 'Olympus Medical',   est_days: 60, status: 'SHIPPED' },
  { od_no: 'OD-2568-1129', date_ordered: '2568-11-25', items: 'Holmium Laser Fiber 200 µm × 20',                vendor: 'Lumenis',           est_days: 90, status: 'PENDING' },  // > 180 days — ALERT
  { od_no: 'OD-2568-1004', date_ordered: '2568-10-15', items: 'Flexible Ureteroscope Tip Repair Kit',           vendor: 'Karl Storz',        est_days: 75, status: 'PENDING' },  // > 180 days — ALERT
  { od_no: 'OD-2569-0501', date_ordered: '2569-05-12', items: 'Sterile Gloves Size 7 × 5000 คู่',               vendor: 'Ansell',            est_days: 14, status: 'PENDING' },
  { od_no: 'OD-2569-0420', date_ordered: '2569-04-15', items: 'Glycine 1.5% 3000 ml × 200',                    vendor: 'Baxter',            est_days: 21, status: 'RECEIVED', received_date: '2569-05-08' },
];

// Recent transactions (used / out / adj)
const URO_TXNS = [
  { id: 'TX-2604-018', date: '2026-05-18 09:14', type: 'OUT', code: 'URO-CA-101', name: 'Foley 2-way 16 Fr (Silicone)', qty: 6,  unit: 'เส้น', by: 'พญ. สาธร', note: 'Case TURP – OR3' },
  { id: 'TX-2604-017', date: '2026-05-18 08:50', type: 'OUT', code: 'URO-FL-401', name: 'Glycine 1.5% 3000 ml',          qty: 4,  unit: 'ถุง',  by: 'พยาบาล นัท', note: 'Case TURP – OR3' },
  { id: 'TX-2604-016', date: '2026-05-17 16:32', type: 'IN',  code: 'URO-CN-503', name: 'Lubricant Jelly 5 g',           qty: 200,unit: 'ซอง',  by: 'คุณวิภา (พัสดุ)', note: 'PO-26-0418' },
  { id: 'TX-2604-015', date: '2026-05-17 15:10', type: 'OUT', code: 'URO-ST-201', name: 'Double-J Stent 6 Fr × 26 cm',   qty: 2,  unit: 'ชิ้น', by: 'นพ. เอกชัย',    note: 'Case URS – OR1' },
  { id: 'TX-2604-014', date: '2026-05-17 11:08', type: 'IN',  code: 'URO-CA-101', name: 'Foley 2-way 16 Fr (Silicone)',  qty: 100,unit: 'เส้น', by: 'คุณวิภา (พัสดุ)', note: 'PO-26-0418' },
  { id: 'TX-2604-013', date: '2026-05-16 14:21', type: 'OUT', code: 'URO-DR-301', name: 'TURP Drape Set (sterile)',      qty: 3,  unit: 'ชุด',  by: 'พยาบาล ฝน', note: 'Case TURBT – OR2' },
  { id: 'TX-2604-012', date: '2026-05-16 09:00', type: 'ADJ', code: 'URO-CA-103', name: 'Nelaton Cath. 14 Fr',           qty: -4, unit: 'เส้น', by: 'คุณวิภา (พัสดุ)', note: 'นับสต๊อกประจำเดือน' },
  { id: 'TX-2604-011', date: '2026-05-15 17:40', type: 'OUT', code: 'URO-CN-501', name: 'Sterile Gloves Size 7',         qty: 24, unit: 'คู่',  by: 'พยาบาล แอน', note: 'Case Cysto – OR4' },
];

// 7-day burndown for chart (per category) — qty consumed
const URO_BURN = [
  { day: 'อา.', scope:0, cath:18, stent:1, drape:4, fluid:6,  consum:34 },
  { day: 'จ.',  scope:1, cath:22, stent:3, drape:6, fluid:9,  consum:48 },
  { day: 'อ.',  scope:0, cath:14, stent:2, drape:5, fluid:7,  consum:39 },
  { day: 'พ.',  scope:1, cath:26, stent:4, drape:8, fluid:11, consum:52 },
  { day: 'พฤ.', scope:0, cath:19, stent:2, drape:6, fluid:8,  consum:41 },
  { day: 'ศ.',  scope:1, cath:28, stent:5, drape:9, fluid:12, consum:57 },
  { day: 'ส.',  scope:0, cath:11, stent:1, drape:3, fluid:5,  consum:22 },
];

// 12-month / 5-year aggregate burn (units consumed)
const URO_MONTH = [
  { label: 'มิ.ย.68', total: 1820, value: 142000 },
  { label: 'ก.ค.68', total: 2010, value: 158000 },
  { label: 'ส.ค.68', total: 1640, value: 128500 },
  { label: 'ก.ย.68', total: 2240, value: 178400 },
  { label: 'ต.ค.68', total: 2380, value: 191200 },
  { label: 'พ.ย.68', total: 1980, value: 152000 },
  { label: 'ธ.ค.68', total: 2540, value: 204000 },
  { label: 'ม.ค.69', total: 2110, value: 169800 },
  { label: 'ก.พ.69', total: 1890, value: 144100 },
  { label: 'มี.ค.69', total: 2360, value: 198500 },
  { label: 'เม.ย.69', total: 2480, value: 211400 },
  { label: 'พ.ค.69', total: 1620, value: 132800 },
];

const URO_YEAR = [
  { label: '2565', total: 18420, value: 1485000 },
  { label: '2566', total: 21380, value: 1742000 },
  { label: '2567', total: 23910, value: 1980000 },
  { label: '2568', total: 25060, value: 2118000 },
  { label: '2569', total: 11380, value:  956200 },  // YTD
];

Object.assign(window, {
  URO_CATEGORIES, URO_ITEMS, URO_TXNS, URO_BURN, URO_MONTH, URO_YEAR,
  URO_EQUIPMENT, URO_PO,
});

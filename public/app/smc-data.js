/* SMC OR 2568 — Urological surgery, all 3 สิทธิ์ (CRH / Insurance / ต่างชาติ)
   Source: SMC OR 2568.xlsx  |  lt2 = OP<2hr rows 56-76  |  gt2 = OP>2hr rows 90-117
   anesN correction: Excel 375→720 (CRH/Ins), Excel 469→900 (ต่างชาติ)
   Structure: { name, icd9, t, crh:{}, ins:{}, th:{} }
   Each sitthi: { room, dfSx, dfAnes, scrub, anesN, nurseAid, total }
*/
window.SMC_DATA = [
  /* ── OP < 2 hr ────────────────────────────────────────────────────────────── */
  { name:'Circumcision', icd9:'640', t:'lt2',
    crh:{ room:1500, dfSx:4500,  dfAnes:0,     scrub:840,  anesN:0,   nurseAid:0,   total:6840   },
    ins:{ room:1500, dfSx:6000,  dfAnes:0,     scrub:840,  anesN:0,   nurseAid:0,   total:8340   },
    th: { room:1875, dfSx:7500,  dfAnes:0,     scrub:1050, anesN:0,   nurseAid:0,   total:10425  } },

  { name:'Vasectomy', icd9:'6373', t:'lt2',
    crh:{ room:1500, dfSx:6400,  dfAnes:0,     scrub:840,  anesN:0,   nurseAid:0,   total:8740   },
    ins:{ room:1500, dfSx:8000,  dfAnes:0,     scrub:840,  anesN:0,   nurseAid:0,   total:10340  },
    th: { room:1875, dfSx:10000, dfAnes:0,     scrub:1050, anesN:0,   nurseAid:0,   total:12925  } },

  { name:'Cystoscopy', icd9:'5732', t:'lt2',
    crh:{ room:1500, dfSx:2880,  dfAnes:0,     scrub:840,  anesN:0,   nurseAid:0,   total:5220   },
    ins:{ room:1500, dfSx:3600,  dfAnes:0,     scrub:840,  anesN:0,   nurseAid:0,   total:5940   },
    th: { room:1875, dfSx:4500,  dfAnes:0,     scrub:1050, anesN:0,   nurseAid:0,   total:7425   } },

  { name:'Cystoscopy with procedural therapy', icd9:'5733', t:'lt2',
    crh:{ room:1500, dfSx:5120,  dfAnes:2048,  scrub:840,  anesN:0,   nurseAid:0,   total:9508   },
    ins:{ room:1500, dfSx:6400,  dfAnes:2560,  scrub:840,  anesN:0,   nurseAid:0,   total:11300  },
    th: { room:1875, dfSx:8000,  dfAnes:3200,  scrub:1050, anesN:0,   nurseAid:0,   total:14125  } },

  { name:'TRUS Biopsy LA', icd9:'6011', t:'lt2',
    crh:{ room:1500, dfSx:5760,  dfAnes:0,     scrub:840,  anesN:0,   nurseAid:0,   total:8100   },
    ins:{ room:1500, dfSx:7200,  dfAnes:0,     scrub:840,  anesN:0,   nurseAid:0,   total:9540   },
    th: { room:1875, dfSx:9000,  dfAnes:0,     scrub:1050, anesN:0,   nurseAid:0,   total:11925  } },

  { name:'Percutaneous nephrostomy insertion LA', icd9:'5999', t:'lt2',
    crh:{ room:1500, dfSx:5120,  dfAnes:0,     scrub:840,  anesN:0,   nurseAid:0,   total:7460   },
    ins:{ room:1500, dfSx:6400,  dfAnes:0,     scrub:840,  anesN:0,   nurseAid:0,   total:8740   },
    th: { room:1875, dfSx:8000,  dfAnes:0,     scrub:1050, anesN:0,   nurseAid:0,   total:10925  } },

  { name:'Needle aspiration with alcohol ablation renal cyst', icd9:'5529', t:'lt2',
    crh:{ room:1500, dfSx:3840,  dfAnes:0,     scrub:840,  anesN:0,   nurseAid:0,   total:6180   },
    ins:{ room:1500, dfSx:4800,  dfAnes:0,     scrub:840,  anesN:0,   nurseAid:0,   total:7140   },
    th: { room:1875, dfSx:6000,  dfAnes:0,     scrub:1050, anesN:0,   nurseAid:0,   total:8925   } },

  { name:'Percutaneous biopsy of kidney', icd9:'5523', t:'lt2',
    crh:{ room:1500, dfSx:960,   dfAnes:0,     scrub:840,  anesN:0,   nurseAid:0,   total:3300   },
    ins:{ room:1500, dfSx:1200,  dfAnes:0,     scrub:840,  anesN:0,   nurseAid:0,   total:3540   },
    th: { room:1875, dfSx:1500,  dfAnes:0,     scrub:1050, anesN:0,   nurseAid:0,   total:4425   } },

  { name:'Local excision of lesion of penis', icd9:'642', t:'lt2',
    crh:{ room:1500, dfSx:1920,  dfAnes:0,     scrub:840,  anesN:0,   nurseAid:0,   total:4260   },
    ins:{ room:1500, dfSx:2400,  dfAnes:0,     scrub:840,  anesN:0,   nurseAid:0,   total:4740   },
    th: { room:1875, dfSx:3000,  dfAnes:0,     scrub:1050, anesN:0,   nurseAid:0,   total:5925   } },

  { name:'TRUS Biopsy GA', icd9:'6011', t:'lt2',
    crh:{ room:1500, dfSx:5760,  dfAnes:2880,  scrub:2160, anesN:720, nurseAid:375, total:13020  },
    ins:{ room:1500, dfSx:7200,  dfAnes:3600,  scrub:2160, anesN:720, nurseAid:375, total:15180  },
    th: { room:1875, dfSx:9000,  dfAnes:4500,  scrub:2700, anesN:900, nurseAid:469, total:18975  } },

  { name:'TUR-BT', icd9:'5749', t:'lt2',
    crh:{ room:4000, dfSx:17280, dfAnes:8640,  scrub:2160, anesN:720, nurseAid:375, total:32800  },
    ins:{ room:4000, dfSx:21600, dfAnes:10800, scrub:2160, anesN:720, nurseAid:375, total:39280  },
    th: { room:5000, dfSx:27000, dfAnes:13500, scrub:2700, anesN:900, nurseAid:469, total:49100  } },

  { name:'URSL', icd9:'560', t:'lt2',
    crh:{ room:4000, dfSx:17280, dfAnes:8640,  scrub:2160, anesN:720, nurseAid:375, total:32800  },
    ins:{ room:4000, dfSx:21600, dfAnes:10800, scrub:2160, anesN:720, nurseAid:375, total:39280  },
    th: { room:5000, dfSx:27000, dfAnes:13500, scrub:2700, anesN:900, nurseAid:469, total:49100  } },

  { name:'Unilateral Hydrocelectomy', icd9:'612', t:'lt2',
    crh:{ room:4000, dfSx:9600,  dfAnes:4800,  scrub:2160, anesN:720, nurseAid:375, total:21280  },
    ins:{ room:4000, dfSx:12000, dfAnes:6000,  scrub:2160, anesN:720, nurseAid:375, total:24880  },
    th: { room:5000, dfSx:15000, dfAnes:7500,  scrub:2700, anesN:900, nurseAid:469, total:31100  } },

  { name:'Bilateral Hydrocelectomy', icd9:'612B', t:'lt2',
    crh:{ room:4000, dfSx:12000, dfAnes:6000,  scrub:2160, anesN:720, nurseAid:375, total:24880  },
    ins:{ room:4000, dfSx:14400, dfAnes:7200,  scrub:2160, anesN:720, nurseAid:375, total:28480  },
    th: { room:5000, dfSx:18000, dfAnes:9000,  scrub:2700, anesN:900, nurseAid:469, total:35600  } },

  { name:'Varicocelectomy', icd9:'631', t:'lt2',
    crh:{ room:4000, dfSx:7680,  dfAnes:3840,  scrub:2160, anesN:720, nurseAid:375, total:18400  },
    ins:{ room:4000, dfSx:9600,  dfAnes:4800,  scrub:2160, anesN:720, nurseAid:375, total:21280  },
    th: { room:5000, dfSx:12000, dfAnes:6000,  scrub:2700, anesN:900, nurseAid:469, total:26600  } },

  { name:'Unilateral Orchiectomy', icd9:'623', t:'lt2',
    crh:{ room:4000, dfSx:7680,  dfAnes:3840,  scrub:2160, anesN:720, nurseAid:375, total:18400  },
    ins:{ room:4000, dfSx:9600,  dfAnes:4800,  scrub:2160, anesN:720, nurseAid:375, total:21280  },
    th: { room:5000, dfSx:12000, dfAnes:6000,  scrub:2700, anesN:900, nurseAid:469, total:26600  } },

  { name:'Bilateral Orchiectomy', icd9:'624', t:'lt2',
    crh:{ room:4000, dfSx:9600,  dfAnes:4800,  scrub:2160, anesN:720, nurseAid:375, total:21280  },
    ins:{ room:4000, dfSx:12000, dfAnes:6000,  scrub:2160, anesN:720, nurseAid:375, total:24880  },
    th: { room:5000, dfSx:15000, dfAnes:7500,  scrub:2700, anesN:900, nurseAid:469, total:31100  } },

  { name:'Epididymectomy', icd9:'634', t:'lt2',
    crh:{ room:4000, dfSx:7680,  dfAnes:3840,  scrub:2160, anesN:720, nurseAid:375, total:18400  },
    ins:{ room:4000, dfSx:9600,  dfAnes:4800,  scrub:2160, anesN:720, nurseAid:375, total:21280  },
    th: { room:5000, dfSx:12000, dfAnes:6000,  scrub:2700, anesN:900, nurseAid:469, total:26600  } },

  { name:'Suprapubic Cystolithotomy', icd9:'5719', t:'lt2',
    crh:{ room:4000, dfSx:15360, dfAnes:7680,  scrub:2160, anesN:720, nurseAid:375, total:29920  },
    ins:{ room:4000, dfSx:19200, dfAnes:9600,  scrub:2160, anesN:720, nurseAid:375, total:35680  },
    th: { room:5000, dfSx:24000, dfAnes:12000, scrub:2700, anesN:900, nurseAid:469, total:44600  } },

  { name:'Cystolitholapaxy', icd9:'5799', t:'lt2',
    crh:{ room:4000, dfSx:13440, dfAnes:6720,  scrub:2160, anesN:720, nurseAid:375, total:27040  },
    ins:{ room:4000, dfSx:16800, dfAnes:8400,  scrub:2160, anesN:720, nurseAid:375, total:32080  },
    th: { room:5000, dfSx:21000, dfAnes:10500, scrub:2700, anesN:900, nurseAid:469, total:40100  } },

  { name:'Partial penectomy', icd9:'643', t:'lt2',
    crh:{ room:4000, dfSx:9600,  dfAnes:4800,  scrub:2160, anesN:720, nurseAid:375, total:21280  },
    ins:{ room:4000, dfSx:12000, dfAnes:6000,  scrub:2160, anesN:720, nurseAid:375, total:24880  },
    th: { room:5000, dfSx:15000, dfAnes:7500,  scrub:2700, anesN:900, nurseAid:469, total:31100  } },

  /* ── OP > 2 hr ────────────────────────────────────────────────────────────── */
  { name:'TUR-P', icd9:'6029', t:'gt2',
    crh:{ room:4000, dfSx:21600, dfAnes:8640,  scrub:2160, anesN:720, nurseAid:375, total:37120  },
    ins:{ room:4000, dfSx:21600, dfAnes:8640,  scrub:2160, anesN:720, nurseAid:375, total:37120  },
    th: { room:5000, dfSx:27000, dfAnes:10800, scrub:2700, anesN:900, nurseAid:469, total:46400  } },

  { name:'Simple Nephrectomy', icd9:'5551', t:'gt2',
    crh:{ room:4000, dfSx:25600, dfAnes:10240, scrub:2880, anesN:720, nurseAid:375, total:43440  },
    ins:{ room:4000, dfSx:25600, dfAnes:10240, scrub:2880, anesN:720, nurseAid:375, total:43440  },
    th: { room:5000, dfSx:32000, dfAnes:12800, scrub:3600, anesN:900, nurseAid:469, total:54300  } },

  { name:'Partial Nephrectomy', icd9:'5551E', t:'gt2',
    crh:{ room:4000, dfSx:28800, dfAnes:11520, scrub:2880, anesN:720, nurseAid:375, total:47920  },
    ins:{ room:4000, dfSx:28800, dfAnes:11520, scrub:2880, anesN:720, nurseAid:375, total:47920  },
    th: { room:5000, dfSx:36000, dfAnes:14400, scrub:3600, anesN:900, nurseAid:469, total:59900  } },

  { name:'Radical Nephrectomy', icd9:'5551B', t:'gt2',
    crh:{ room:4000, dfSx:39200, dfAnes:15680, scrub:2880, anesN:720, nurseAid:375, total:62480  },
    ins:{ room:4000, dfSx:39200, dfAnes:15680, scrub:2880, anesN:720, nurseAid:375, total:62480  },
    th: { room:5000, dfSx:49000, dfAnes:19600, scrub:3600, anesN:900, nurseAid:469, total:78100  } },

  { name:'Radical Nephroureterectomy with Bladder cuff excision (RNU with BCE)', icd9:'5551C', t:'gt2',
    crh:{ room:4000, dfSx:45000, dfAnes:18000, scrub:2880, anesN:720, nurseAid:375, total:70600  },
    ins:{ room:4000, dfSx:45000, dfAnes:18000, scrub:2880, anesN:720, nurseAid:375, total:70600  },
    th: { room:5000, dfSx:56250, dfAnes:22500, scrub:3600, anesN:900, nurseAid:469, total:88250  } },

  { name:'Radical Cystectomy with ileal conduit', icd9:'5771', t:'gt2',
    crh:{ room:4000, dfSx:56000, dfAnes:22400, scrub:2880, anesN:720, nurseAid:375, total:86000  },
    ins:{ room:4000, dfSx:56000, dfAnes:22400, scrub:2880, anesN:720, nurseAid:375, total:86000  },
    th: { room:5000, dfSx:70000, dfAnes:28000, scrub:3600, anesN:900, nurseAid:469, total:107500 } },

  { name:'Ureterolithotomy', icd9:'5602', t:'gt2',
    crh:{ room:4000, dfSx:22400, dfAnes:8960,  scrub:2880, anesN:720, nurseAid:375, total:38960  },
    ins:{ room:4000, dfSx:22400, dfAnes:8960,  scrub:2880, anesN:720, nurseAid:375, total:38960  },
    th: { room:5000, dfSx:28000, dfAnes:11200, scrub:3600, anesN:900, nurseAid:469, total:48700  } },

  { name:'RIRS (Retrograde intra-renal surgery)', icd9:'5699', t:'gt2',
    crh:{ room:4000, dfSx:18000, dfAnes:7200,  scrub:2160, anesN:720, nurseAid:375, total:32080  },
    ins:{ room:4000, dfSx:18000, dfAnes:7200,  scrub:2160, anesN:720, nurseAid:375, total:32080  },
    th: { room:5000, dfSx:22500, dfAnes:9000,  scrub:2700, anesN:900, nurseAid:469, total:40100  } },

  { name:'PCNL', icd9:'5504', t:'gt2',
    crh:{ room:4000, dfSx:28000, dfAnes:11200, scrub:2160, anesN:720, nurseAid:375, total:46080  },
    ins:{ room:4000, dfSx:28000, dfAnes:11200, scrub:2160, anesN:720, nurseAid:375, total:46080  },
    th: { room:5000, dfSx:35000, dfAnes:14000, scrub:2700, anesN:900, nurseAid:469, total:57600  } },

  { name:'ANL / Pyelolithotomy', icd9:'5501', t:'gt2',
    crh:{ room:4000, dfSx:24000, dfAnes:9600,  scrub:2880, anesN:720, nurseAid:375, total:41200  },
    ins:{ room:4000, dfSx:24000, dfAnes:9600,  scrub:2880, anesN:720, nurseAid:375, total:41200  },
    th: { room:5000, dfSx:30000, dfAnes:12000, scrub:3600, anesN:900, nurseAid:469, total:51500  } },

  { name:'Pyeloplasty', icd9:'5587', t:'gt2',
    crh:{ room:4000, dfSx:28800, dfAnes:11520, scrub:2880, anesN:720, nurseAid:375, total:47920  },
    ins:{ room:4000, dfSx:28800, dfAnes:11520, scrub:2880, anesN:720, nurseAid:375, total:47920  },
    th: { room:5000, dfSx:36000, dfAnes:14400, scrub:3600, anesN:900, nurseAid:469, total:59900  } },

  { name:'Excision Urachus', icd9:'5751', t:'gt2',
    crh:{ room:4000, dfSx:13600, dfAnes:5440,  scrub:2880, anesN:720, nurseAid:375, total:26640  },
    ins:{ room:4000, dfSx:13600, dfAnes:5440,  scrub:2880, anesN:720, nurseAid:375, total:26640  },
    th: { room:5000, dfSx:17000, dfAnes:6800,  scrub:3600, anesN:900, nurseAid:469, total:33300  } },

  { name:'Repair fistula of bladder (UVF/VVF)', icd9:'5784', t:'gt2',
    crh:{ room:4000, dfSx:36000, dfAnes:14400, scrub:2880, anesN:720, nurseAid:375, total:58000  },
    ins:{ room:4000, dfSx:36000, dfAnes:14400, scrub:2880, anesN:720, nurseAid:375, total:58000  },
    th: { room:5000, dfSx:45000, dfAnes:18000, scrub:3600, anesN:900, nurseAid:469, total:72500  } },

  { name:'Radical Orchiectomy', icd9:'6241', t:'gt2',
    crh:{ room:4000, dfSx:11200, dfAnes:4480,  scrub:2880, anesN:720, nurseAid:375, total:23280  },
    ins:{ room:4000, dfSx:11200, dfAnes:4480,  scrub:2880, anesN:720, nurseAid:375, total:23280  },
    th: { room:5000, dfSx:14000, dfAnes:5600,  scrub:3600, anesN:900, nurseAid:469, total:29100  } },

  { name:'Vasovasostomy (Vasectomy reversal)', icd9:'6383', t:'gt2',
    crh:{ room:4000, dfSx:24000, dfAnes:9600,  scrub:2160, anesN:720, nurseAid:375, total:40480  },
    ins:{ room:4000, dfSx:24000, dfAnes:9600,  scrub:2160, anesN:720, nurseAid:375, total:40480  },
    th: { room:5000, dfSx:30000, dfAnes:12000, scrub:2700, anesN:900, nurseAid:469, total:50600  } },

  { name:'Vaginal reconstruction [Transvaginal tape (TVT)]', icd9:'7062', t:'gt2',
    crh:{ room:4000, dfSx:12000, dfAnes:4800,  scrub:2880, anesN:720, nurseAid:375, total:24400  },
    ins:{ room:4000, dfSx:12000, dfAnes:4800,  scrub:2880, anesN:720, nurseAid:375, total:24400  },
    th: { room:5000, dfSx:15000, dfAnes:6000,  scrub:3600, anesN:900, nurseAid:469, total:30500  } },

  { name:'Total penectomy', icd9:'643B', t:'gt2',
    crh:{ room:4000, dfSx:24000, dfAnes:9600,  scrub:2880, anesN:720, nurseAid:375, total:41200  },
    ins:{ room:4000, dfSx:24000, dfAnes:9600,  scrub:2880, anesN:720, nurseAid:375, total:41200  },
    th: { room:5000, dfSx:30000, dfAnes:12000, scrub:3600, anesN:900, nurseAid:469, total:51500  } },

  { name:'Laparoscopic Simple Nephrectomy', icd9:'5551L', t:'gt2',
    crh:{ room:4000, dfSx:40000, dfAnes:16000, scrub:2880, anesN:720, nurseAid:375, total:71600  },
    ins:{ room:4000, dfSx:40000, dfAnes:16000, scrub:2880, anesN:720, nurseAid:375, total:71600  },
    th: { room:5000, dfSx:50000, dfAnes:20000, scrub:3600, anesN:900, nurseAid:469, total:89500  } },

  { name:'Laparoscopic Radical Nephrectomy', icd9:'5551M', t:'gt2',
    crh:{ room:4000, dfSx:50000, dfAnes:20000, scrub:2880, anesN:720, nurseAid:375, total:85600  },
    ins:{ room:4000, dfSx:50000, dfAnes:20000, scrub:2880, anesN:720, nurseAid:375, total:85600  },
    th: { room:5000, dfSx:62500, dfAnes:25000, scrub:3600, anesN:900, nurseAid:469, total:107000 } },

  { name:'Laparoscopic Radical Nephroureterectomy with bladder cuff excision [Total lap]', icd9:'5551N', t:'gt2',
    crh:{ room:4000, dfSx:58000, dfAnes:23200, scrub:2880, anesN:720, nurseAid:375, total:96800  },
    ins:{ room:4000, dfSx:58000, dfAnes:23200, scrub:2880, anesN:720, nurseAid:375, total:96800  },
    th: { room:5000, dfSx:72500, dfAnes:29000, scrub:3600, anesN:900, nurseAid:469, total:121000 } },

  { name:'Laparoscopic Partial Nephrectomy', icd9:'554', t:'gt2',
    crh:{ room:4000, dfSx:55000, dfAnes:22000, scrub:2880, anesN:720, nurseAid:375, total:92600  },
    ins:{ room:4000, dfSx:55000, dfAnes:22000, scrub:2880, anesN:720, nurseAid:375, total:92600  },
    th: { room:5000, dfSx:68750, dfAnes:27500, scrub:3600, anesN:900, nurseAid:469, total:115750 } },

  { name:'Laparoscopic Unroof Renal cyst', icd9:'5532', t:'gt2',
    crh:{ room:4000, dfSx:30000, dfAnes:12000, scrub:2880, anesN:720, nurseAid:375, total:57600  },
    ins:{ room:4000, dfSx:30000, dfAnes:12000, scrub:2880, anesN:720, nurseAid:375, total:57600  },
    th: { room:5000, dfSx:37500, dfAnes:15000, scrub:3600, anesN:900, nurseAid:469, total:72000  } },

  { name:'Laparoscopic Adrenalectomy', icd9:'722', t:'gt2',
    crh:{ room:4000, dfSx:40000, dfAnes:16000, scrub:2880, anesN:720, nurseAid:375, total:71600  },
    ins:{ room:4000, dfSx:40000, dfAnes:16000, scrub:2880, anesN:720, nurseAid:375, total:71600  },
    th: { room:5000, dfSx:50000, dfAnes:20000, scrub:3600, anesN:900, nurseAid:469, total:89500  } },

  { name:'Laparoscopic Pyeloplasty', icd9:'5587L', t:'gt2',
    crh:{ room:4000, dfSx:48000, dfAnes:19200, scrub:2880, anesN:720, nurseAid:375, total:82800  },
    ins:{ room:4000, dfSx:48000, dfAnes:19200, scrub:2880, anesN:720, nurseAid:375, total:82800  },
    th: { room:5000, dfSx:60000, dfAnes:24000, scrub:3600, anesN:900, nurseAid:469, total:103500 } },

  { name:'Laparoscopic Ureteroureterostomy', icd9:'5689', t:'gt2',
    crh:{ room:4000, dfSx:48000, dfAnes:19200, scrub:2880, anesN:720, nurseAid:375, total:82800  },
    ins:{ room:4000, dfSx:48000, dfAnes:19200, scrub:2880, anesN:720, nurseAid:375, total:82800  },
    th: { room:5000, dfSx:60000, dfAnes:24000, scrub:3600, anesN:900, nurseAid:469, total:103500 } },

  { name:'Laparoscopic Partial cystectomy', icd9:'576', t:'gt2',
    crh:{ room:4000, dfSx:44000, dfAnes:17600, scrub:2880, anesN:720, nurseAid:375, total:77200  },
    ins:{ room:4000, dfSx:44000, dfAnes:17600, scrub:2880, anesN:720, nurseAid:375, total:77200  },
    th: { room:5000, dfSx:55000, dfAnes:22000, scrub:3600, anesN:900, nurseAid:469, total:96500  } },

  { name:'Laparoscopic Radical cystectomy with ileal conduit', icd9:'5771L', t:'gt2',
    crh:{ room:4000, dfSx:72000, dfAnes:28800, scrub:2880, anesN:720, nurseAid:375, total:116400 },
    ins:{ room:4000, dfSx:72000, dfAnes:28800, scrub:2880, anesN:720, nurseAid:375, total:116400 },
    th: { room:5000, dfSx:90000, dfAnes:36000, scrub:3600, anesN:900, nurseAid:469, total:145500 } },

  { name:'Laparoscopic Radical prostatectomy with pelvic lymphnode dissection', icd9:'605', t:'gt2',
    crh:{ room:4000, dfSx:72000, dfAnes:28800, scrub:2880, anesN:720, nurseAid:375, total:116400 },
    ins:{ room:4000, dfSx:72000, dfAnes:28800, scrub:2880, anesN:720, nurseAid:375, total:116400 },
    th: { room:5000, dfSx:90000, dfAnes:36000, scrub:3600, anesN:900, nurseAid:469, total:145500 } },
];

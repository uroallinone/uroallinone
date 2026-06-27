# Uro All Around — ระบบจัดการพัสดุ แผนกผ่าตัด Uro

เว็บแอปจัดการคลังพัสดุ/ครุภัณฑ์/ใบสั่งซื้อ ห้องผ่าตัด Uro
รองรับ **หลายผู้ใช้ · เข้าจากที่ไหนก็ได้ · มีระบบสมัครสมาชิก (sign up) และเข้าสู่ระบบ (sign in)**

| ส่วน | เทคโนโลยี | ฟรี |
|------|-----------|-----|
| ฐานข้อมูล + ระบบสมาชิก | **Supabase** (Postgres + Auth) | ✅ |
| โฮสต์เว็บ + โดเมน | **Vercel** (`your-app.vercel.app`) | ✅ |
| หน้าเว็บ | React (in-browser Babel) | — |

ข้อมูลทั้งหมดถูกเก็บบน Supabase และซิงค์เรียลไทม์ — ทุกคนที่ล็อกอินเห็นคลังพัสดุชุดเดียวกัน

---

## 🚀 วิธีนำขึ้นเว็บจริง (Deploy)

### ขั้นที่ 1 — สร้างฐานข้อมูล + ระบบสมาชิกบน Supabase
1. ไปที่ <https://supabase.com> → **Sign up** (ใช้บัญชี GitHub/Google ก็ได้) → **New project**
   - ตั้งชื่อ, ตั้ง Database Password (เก็บไว้), เลือก Region ใกล้ไทย (เช่น Singapore) → Create
2. รอสร้างเสร็จ → เมนู **SQL Editor → New query** → วางเนื้อหาไฟล์ [`supabase-setup.sql`](supabase-setup.sql) ทั้งหมด → **Run**
   (สร้างตาราง `uro_data` + เปิด Row Level Security + เปิด Realtime)
3. **ตั้งค่าการสมัครสมาชิก** → เมนู **Authentication → Providers → Email**
   - เปิด **Enable Email provider**
   - ถ้าอยากให้สมัครแล้วเข้าใช้ได้ทันที (ไม่ต้องยืนยันอีเมล) → **ปิด** "Confirm email"
     (ถ้าเปิดไว้ ผู้สมัครต้องกดลิงก์ยืนยันในอีเมลก่อน)
4. เมนู **Project Settings → API** → คัดลอก 2 ค่านี้:
   - **Project URL**
   - **Project API keys → `anon` `public`**

### ขั้นที่ 2 — ใส่คีย์ลงในแอป
แก้ไฟล์ [`public/app/config.js`](public/app/config.js) วาง 2 ค่าจากขั้นที่ 1:
```js
window.SUPABASE_URL = 'https://xxxxxxxx.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOi...';   // anon public key
```
> `anon key` เป็นคีย์สาธารณะ ฝังในหน้าเว็บได้อย่างปลอดภัย — ความปลอดภัยของข้อมูลคุมด้วย RLS

### ขั้นที่ 3 — นำขึ้น Vercel (ได้โดเมนฟรี)
**วิธี A — ผ่าน GitHub (แนะนำ):**
1. push โฟลเดอร์นี้ขึ้น GitHub repo
2. ไปที่ <https://vercel.com> → Sign up → **Add New… → Project** → เลือก repo
3. ตั้งค่า: **Framework Preset = Other**, **Root Directory = `./`** (มี `vercel.json` กำหนด output เป็น `public/` ให้แล้ว) → **Deploy**
4. ได้ลิงก์ `https://your-app.vercel.app` ใช้งานได้จากทุกที่ทันที

**วิธี B — ผ่าน Vercel CLI:**
```bash
npm i -g vercel
vercel        # ครั้งแรกให้ทำตามขั้นตอน login + ตอบ Yes
vercel --prod
```

เปลี่ยนชื่อโดเมนย่อยฟรีได้ที่ Vercel → Project → **Settings → Domains** (หรือผูกโดเมนของคุณเองภายหลัง)

---

## ▶️ ทดสอบในเครื่อง (Local dev — ไม่บังคับ)
ใส่คีย์ใน `config.js` แล้วเปิดเซิร์ฟเวอร์สแตติกในเครื่อง (ต้องมี Node ≥ 22.5):
```bash
npm start        # เสิร์ฟโฟลเดอร์ public/ ที่ http://localhost:3000
```
ตอนรันในเครื่องก็ยังต่อฐานข้อมูล + ระบบสมาชิกบน Supabase (cloud) ชุดเดียวกับ production

---

## 🔐 ระบบสมาชิก (Auth)
- หน้าแรกมีปุ่มสลับ **เข้าสู่ระบบ / สมัครสมาชิก** — สมัครด้วยอีเมล + รหัสผ่าน
- จัดการผู้ใช้ทั้งหมดได้ที่ Supabase → **Authentication → Users** (ดู/ลบ/รีเซ็ตรหัสผ่าน)
- อยากจำกัดไม่ให้คนนอกสมัครเอง: Supabase → Authentication → ปิด "Allow new users to sign up"
  แล้วเพิ่มผู้ใช้เองจากหน้า Users (โหมด invite-only)

## 🗂 โครงสร้างไฟล์
```
public/                 ← เว็บที่ deploy (Vercel เสิร์ฟโฟลเดอร์นี้)
  index.html
  app/
    config.js           ← ⚙️ ใส่คีย์ Supabase ที่นี่
    uro-supabase.js     ← auth + เชื่อมฐานข้อมูล Supabase
    main.jsx · ui-shell.jsx · screens.jsx · data.jsx · tweaks-panel.jsx
  vendor/ (React, ReactDOM, Babel) · assets/ (ฟอนต์)
supabase-setup.sql      ← SQL สร้างตาราง + RLS (รันใน Supabase ครั้งเดียว)
vercel.json             ← ตั้ง output เป็น public/
server.js               ← (ออปชัน) static server สำหรับทดสอบในเครื่อง
```

## ℹ️ หมายเหตุ
- `public/` คือ source of truth — แก้โค้ดที่นี่ได้เลย แล้ว deploy ใหม่
- ไฟล์ `build.cjs` / `store/` / `URO All Around (deploy) (1).html` เป็นของขั้นตอน import ดีไซน์ครั้งแรก — **ไม่ต้องรัน `npm run build` อีก** (จะเขียนทับไฟล์ใน `public/` รวมถึง config.js)
- ฐานข้อมูลเริ่มต้นว่างเปล่า ไม่มีข้อมูลตัวอย่าง — กรอกข้อมูลจริงได้เลย (โหลดข้อมูลตัวอย่างได้จากแผง Tweaks มุมขวาล่าง)

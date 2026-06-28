/* Supabase — ฐานข้อมูลกลาง */
window.SUPABASE_URL = 'https://mwafupfncuczckdfvvjw.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13YWZ1cGZuY3VjemNrZGZ2dmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NjAyMTksImV4cCI6MjA5ODEzNjIxOX0.uYLxIY6Hx2RsTCIloeyWPBL9-_bGKwoiulxAFxX-f4Q';

/* ผู้ใช้งานระบบ — เพิ่มหรือแก้ไขได้ที่นี่
   role: 'admin'  → แก้ไข/ลบ/เพิ่มได้ทุกอย่าง
   role: 'editor' → แก้ไข/ลบ/เพิ่มได้ (เหมือน admin)
   role: 'viewer' → ดูข้อมูลได้อย่างเดียว ไม่สามารถแก้ไขได้
*/
window.URO_USERS = [
  { username: 'Baheang',  password: '46590024166', name: 'Baheang', role: 'admin'  },
  { username: 'test',     password: '12345678',     name: 'test',    role: 'viewer' },
];

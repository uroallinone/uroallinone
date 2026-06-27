-- ============================================================
-- Uro All Around — Supabase database setup
-- รันใน Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- ตารางเดียวเก็บข้อมูลทั้งระบบเป็น JSON (items / txns / equipment / po)
create table if not exists public.uro_data (
  id          int primary key default 1,
  data        jsonb not null default '{"items":[],"txns":[],"equipment":[],"po":[]}'::jsonb,
  updated_by  text,
  updated_at  timestamptz not null default now(),
  constraint uro_data_single_row check (id = 1)
);

-- แถวเริ่มต้น (ว่างเปล่า)
insert into public.uro_data (id) values (1)
  on conflict (id) do nothing;

-- เปิด Row Level Security: เฉพาะผู้ที่ล็อกอินแล้วเท่านั้นที่อ่าน/แก้ไขได้
alter table public.uro_data enable row level security;

drop policy if exists "authenticated read"   on public.uro_data;
drop policy if exists "authenticated update" on public.uro_data;
drop policy if exists "authenticated insert" on public.uro_data;

create policy "authenticated read"
  on public.uro_data for select to authenticated using (true);

create policy "authenticated update"
  on public.uro_data for update to authenticated using (true) with check (true);

create policy "authenticated insert"
  on public.uro_data for insert to authenticated with check (true);

-- เปิด Realtime เพื่อให้ทุกเครื่องเห็นข้อมูลตรงกันแบบเรียลไทม์
alter publication supabase_realtime add table public.uro_data;

-- =====================================================================
-- Monster Breakout — lưu tiến trình & bảng xếp hạng (Supabase)
-- Chạy 1 lần trong Supabase Dashboard → SQL Editor → New query → Run.
-- Chạy lại nhiều lần cũng an toàn (idempotent).
-- =====================================================================

-- 1) Bản lưu tiến trình: mỗi tài khoản Google 1 dòng
create table if not exists public.mb_saves (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  save        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  constraint mb_saves_size check (pg_column_size(save) < 40000)
);
alter table public.mb_saves enable row level security;

drop policy if exists "mb_saves: đọc bản của mình"  on public.mb_saves;
drop policy if exists "mb_saves: tạo bản của mình"  on public.mb_saves;
drop policy if exists "mb_saves: sửa bản của mình"  on public.mb_saves;
create policy "mb_saves: đọc bản của mình" on public.mb_saves for select to authenticated using ((select auth.uid()) = user_id);
create policy "mb_saves: tạo bản của mình" on public.mb_saves for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "mb_saves: sửa bản của mình" on public.mb_saves for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update on public.mb_saves to authenticated;

-- 2) Bảng xếp hạng: thành tích tốt nhất của mỗi người theo (gate, chế độ)
create table if not exists public.mb_scores (
  user_id     uuid not null references auth.users (id) on delete cascade,
  gate        smallint not null check (gate between 1 and 30),
  mode        text not null check (mode in ('campaign', 'survival')),
  name        text not null check (char_length(name) between 1 and 40),
  avatar      text,
  score       integer not null check (score between 0 and 10000000),
  wave        integer not null default 0 check (wave between 0 and 10000),
  time_s      real not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (user_id, gate, mode)
);
-- (v6.0) mở rộng số Gate cho Màn 2 — an toàn khi bảng đã có từ trước
alter table public.mb_scores drop constraint if exists mb_scores_gate_check;
alter table public.mb_scores add constraint mb_scores_gate_check check (gate between 1 and 30);
create index if not exists mb_scores_rank_campaign on public.mb_scores (gate, mode, score desc);
create index if not exists mb_scores_rank_survival on public.mb_scores (gate, mode, wave desc, score desc);
alter table public.mb_scores enable row level security;

drop policy if exists "mb_scores: ai cũng xem được" on public.mb_scores;
create policy "mb_scores: ai cũng xem được" on public.mb_scores for select to anon, authenticated using (true);
grant select on public.mb_scores to anon, authenticated;
-- Không cấp insert/update trực tiếp: điểm chỉ được ghi qua hàm mb_submit_score bên dưới.
revoke insert, update, delete on public.mb_scores from anon, authenticated;

-- 3) Ghi điểm: chỉ giữ thành tích tốt hơn (chiến dịch: điểm cao; sinh tồn: wave cao rồi tới điểm)
create or replace function public.mb_submit_score(p_gate int, p_mode text, p_score int, p_wave int, p_time real)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  meta jsonb;
  nm text;
  av text;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_gate not between 1 and 30 or p_mode not in ('campaign', 'survival') then raise exception 'bad gate/mode'; end if;
  if p_score not between 0 and 10000000 or coalesce(p_wave, 0) not between 0 and 10000 then raise exception 'bad score'; end if;
  select u.raw_user_meta_data into meta from auth.users u where u.id = uid;
  nm := left(coalesce(nullif(meta->>'full_name', ''), nullif(meta->>'name', ''), 'Hunter'), 40);
  av := meta->>'avatar_url';
  insert into public.mb_scores as s (user_id, gate, mode, name, avatar, score, wave, time_s, updated_at)
  values (uid, p_gate, p_mode, nm, av, p_score, coalesce(p_wave, 0), coalesce(p_time, 0), now())
  on conflict (user_id, gate, mode) do update
    set name = excluded.name, avatar = excluded.avatar,
        score = case when (p_mode = 'campaign' and excluded.score > s.score)
                       or (p_mode = 'survival' and (excluded.wave, excluded.score) > (s.wave, s.score))
                     then excluded.score else s.score end,
        wave  = case when p_mode = 'survival' and (excluded.wave, excluded.score) > (s.wave, s.score) then excluded.wave else s.wave end,
        time_s = case when (p_mode = 'campaign' and excluded.score > s.score)
                        or (p_mode = 'survival' and (excluded.wave, excluded.score) > (s.wave, s.score))
                      then excluded.time_s else s.time_s end,
        updated_at = now();
end;
$$;
revoke all on function public.mb_submit_score(int, text, int, int, real) from public, anon;
grant execute on function public.mb_submit_score(int, text, int, int, real) to authenticated;

-- =====================================================================
-- 4) QUYỀN CHƠI ĐÃ MUA (v7.0): Màn 2 trở đi cần gói.
--    Người chơi chỉ ĐỌC được quyền của mình. Chỉ máy chủ (service role: webhook cổng thanh toán)
--    hoặc quản trị viên (SQL Editor) mới ghi được.
-- =====================================================================
create table if not exists public.mb_entitlements (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  plan text not null,                       -- 'act2' | 'pass' | 'month' …
  acts int[],                               -- các Màn được mở; null = mọi Màn
  expires_at timestamptz,                   -- null = vĩnh viễn
  amount int,                               -- số tiền (VNĐ)
  source text,                              -- 'payos' | 'momo' | 'manual' …
  ref text unique,                          -- mã giao dịch của cổng (chống ghi trùng)
  created_at timestamptz not null default now()
);
create index if not exists mb_entitlements_user on public.mb_entitlements (user_id);
alter table public.mb_entitlements enable row level security;
drop policy if exists "mb_entitlements: chủ tài khoản xem" on public.mb_entitlements;
create policy "mb_entitlements: chủ tài khoản xem" on public.mb_entitlements for select to authenticated using (auth.uid() = user_id);
grant select on public.mb_entitlements to authenticated;
revoke insert, update, delete on public.mb_entitlements from anon, authenticated;

-- có quyền chơi Màn p_act không (dùng trong các hàm khác)
create or replace function public.mb_has_act(p_uid uuid, p_act int)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.mb_entitlements e
    where e.user_id = p_uid and (e.expires_at is null or e.expires_at > now()) and (e.acts is null or p_act = any (e.acts))
  );
$$;
revoke all on function public.mb_has_act(uuid, int) from public, anon, authenticated;

-- bảng xếp hạng: điểm Gate 11+ (chiến dịch) chỉ nhận khi đã có gói
create or replace function public.mb_guard_score()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.mode = 'campaign' and new.gate between 11 and 29 and not public.mb_has_act(new.user_id, case when new.gate <= 21 then 2 else 3 end) then
    raise exception 'locked content';
  end if;
  return new;
end;
$$;
drop trigger if exists mb_guard_score on public.mb_scores;
create trigger mb_guard_score before insert or update on public.mb_scores for each row execute function public.mb_guard_score();

-- Cấp quyền thủ công (ví dụ khi nhận chuyển khoản trực tiếp, hoặc để thử):
--   insert into public.mb_entitlements (user_id, plan, acts, amount, source, ref)
--   select id, 'act2', array[2], 49000, 'manual', 'CK-0001' from auth.users where email = 'email-nguoi-choi@gmail.com';
-- Gói 30 ngày:  …, 'month', null, …, expires_at = now() + interval '30 days'

-- =====================================================================
-- 5) QUẢN TRỊ + CẤU HÌNH TỪ XA + ĐƠN HÀNG (v7.1)
--    - mb_admins: ai được vào trang quản trị (admin.html)
--    - mb_config: cấu hình công khai, chỉ admin sửa: bật/tắt thu phí, thông tin donate, bảng giá gói
--    - mb_orders: đơn mua gói (mã đơn ghi vào nội dung chuyển khoản); webhook SePay hoặc admin duyệt
-- =====================================================================
create table if not exists public.mb_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.mb_admins enable row level security;
drop policy if exists "mb_admins: tự xem" on public.mb_admins;
create policy "mb_admins: tự xem" on public.mb_admins for select to authenticated using ((select auth.uid()) = user_id);
grant select on public.mb_admins to authenticated;

create or replace function public.mb_is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.mb_admins a where a.user_id = auth.uid()); $$;
grant execute on function public.mb_is_admin() to authenticated;

create table if not exists public.mb_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.mb_config enable row level security;
drop policy if exists "mb_config: ai cũng đọc" on public.mb_config;
drop policy if exists "mb_config: admin sửa" on public.mb_config;
create policy "mb_config: ai cũng đọc" on public.mb_config for select to anon, authenticated using (true);
create policy "mb_config: admin sửa" on public.mb_config for all to authenticated using (public.mb_is_admin()) with check (public.mb_is_admin());
grant select on public.mb_config to anon, authenticated;
grant insert, update, delete on public.mb_config to authenticated;

insert into public.mb_config (key, value) values
  ('paywall', '{"enabled": false, "loginFrom": 8, "paidFrom": 11}'),
  ('donate', '{"bank": "", "account": "", "name": "", "note": "Ủng hộ duy trì server Monster Breakout", "qr": ""}'),
  ('plans', '{
    "act15": {"name": "Gói 15 ngày", "price": 29000, "next": 29000, "days": 15, "scope": "act", "perks": {}, "desc": "Chiến dịch của màn này trong 15 ngày."},
    "act30": {"name": "Gói 30 ngày", "price": 49000, "next": 25000, "days": 30, "scope": "act", "perks": {"survival": true, "board": true}, "desc": "Chiến dịch + Sinh tồn/Bất tận + bảng xếp hạng của màn này trong 30 ngày. Màn tiếp theo chỉ 25.000đ."},
    "year": {"name": "Gói 1 năm · Mọi màn", "price": 525000, "days": 365, "scope": "all", "perks": {"survival": true, "board": true, "ngplus": true}, "desc": "Mọi màn hiện có và sắp ra mắt, Sinh tồn, bảng xếp hạng, và Chu kỳ+ trong lúc chờ màn mới."},
    "gate": {"name": "Ủng hộ mở 1 cửa", "price": 5000, "days": 15, "scope": "gate", "perks": {}, "desc": "Mở riêng cửa này trong 15 ngày."}
  }')
on conflict (key) do nothing;

-- quyền: thêm cửa lẻ + đặc quyền theo gói
alter table public.mb_entitlements add column if not exists gates int[];
alter table public.mb_entitlements add column if not exists perks jsonb not null default '{}';
drop policy if exists "mb_entitlements: admin quản lý" on public.mb_entitlements;
create policy "mb_entitlements: admin quản lý" on public.mb_entitlements for all to authenticated using (public.mb_is_admin()) with check (public.mb_is_admin());
grant insert, update, delete on public.mb_entitlements to authenticated;   -- RLS: chỉ admin

create table if not exists public.mb_orders (
  code text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  email text,
  plan text not null,
  act int,
  gate int,
  amount int not null,
  status text not null default 'pending',   -- pending | paid | cancelled
  tx_ref text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
alter table public.mb_orders enable row level security;
drop policy if exists "mb_orders: chủ đơn hoặc admin xem" on public.mb_orders;
drop policy if exists "mb_orders: admin sửa" on public.mb_orders;
create policy "mb_orders: chủ đơn hoặc admin xem" on public.mb_orders for select to authenticated using ((select auth.uid()) = user_id or public.mb_is_admin());
create policy "mb_orders: admin sửa" on public.mb_orders for update to authenticated using (public.mb_is_admin()) with check (public.mb_is_admin());
grant select, update on public.mb_orders to authenticated;

-- cấp quyền theo gói (nội bộ)
create or replace function public.mb_grant(p_uid uuid, p_plan text, p_act int, p_gate int, p_amount int, p_source text, p_ref text)
returns void language plpgsql security definer set search_path = ''
as $$
declare pl jsonb := (select value -> p_plan from public.mb_config where key = 'plans');
begin
  if pl is null then raise exception 'unknown plan %', p_plan; end if;
  insert into public.mb_entitlements (user_id, plan, acts, gates, perks, expires_at, amount, source, ref)
  values (p_uid, p_plan,
    case pl->>'scope' when 'all' then null when 'gate' then '{}'::int[] else array[p_act] end,
    case when pl->>'scope' = 'gate' then array[p_gate] else null end,
    coalesce(pl->'perks', '{}'),
    case when pl ? 'days' then now() + make_interval(days => (pl->>'days')::int) else null end,
    p_amount, p_source, p_ref)
  on conflict (ref) do nothing;
end;
$$;
revoke all on function public.mb_grant(uuid, text, int, int, int, text, text) from public, anon, authenticated;

-- tạo đơn: giá tính trên máy chủ (gói theo màn: đã từng mua cùng gói cho màn khác → giá "màn tiếp theo")
create or replace function public.mb_create_order(p_plan text, p_act int, p_gate int)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  pl jsonb := (select value -> p_plan from public.mb_config where key = 'plans');
  amt int; c text;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if pl is null then raise exception 'unknown plan'; end if;
  if not coalesce((select (value->>'enabled')::boolean from public.mb_config where key = 'paywall'), false) then raise exception 'paywall off'; end if;
  amt := (pl->>'price')::int;
  if pl->>'scope' = 'act' and pl ? 'next' and exists (
    select 1 from public.mb_entitlements e where e.user_id = uid and e.plan = p_plan and not (coalesce(p_act, 0) = any (coalesce(e.acts, '{}')))
  ) then amt := (pl->>'next')::int; end if;
  -- dùng lại đơn đang chờ cùng nội dung (tránh tạo nhiều mã)
  select o.code into c from public.mb_orders o where o.user_id = uid and o.plan = p_plan and o.act is not distinct from p_act and o.gate is not distinct from p_gate and o.status = 'pending' and o.created_at > now() - interval '1 day' limit 1;
  if c is null then
    c := 'MB' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    insert into public.mb_orders (code, user_id, email, plan, act, gate, amount) values (c, uid, auth.jwt()->>'email', p_plan, p_act, p_gate, amt);
  else update public.mb_orders set amount = amt where code = c;
  end if;
  return jsonb_build_object('code', c, 'amount', amt);
end;
$$;
revoke all on function public.mb_create_order(text, int, int) from public, anon;
grant execute on function public.mb_create_order(text, int, int) to authenticated;

-- xác nhận đơn đã trả (webhook SePay qua service role, hoặc admin bấm duyệt)
create or replace function public.mb_apply_order(p_code text, p_amount int, p_ref text)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare o public.mb_orders;
begin
  if not (public.mb_is_admin() or coalesce(auth.jwt()->>'role', '') = 'service_role') then raise exception 'forbidden'; end if;
  select * into o from public.mb_orders where code = upper(p_code) for update;
  if o.code is null or o.status = 'paid' then return false; end if;
  if p_amount is not null and p_amount < o.amount then return false; end if;
  perform public.mb_grant(o.user_id, o.plan, o.act, o.gate, coalesce(p_amount, o.amount), case when public.mb_is_admin() then 'manual' else 'sepay' end, o.code);
  update public.mb_orders set status = 'paid', paid_at = now(), tx_ref = p_ref where code = o.code;
  return true;
end;
$$;
revoke all on function public.mb_apply_order(text, int, text) from public, anon;
grant execute on function public.mb_apply_order(text, int, text) to authenticated, service_role;

-- admin cấp quyền thủ công theo email
create or replace function public.mb_admin_grant(p_email text, p_plan text, p_act int, p_gate int)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare uid uuid;
begin
  if not public.mb_is_admin() then raise exception 'forbidden'; end if;
  select id into uid from auth.users where lower(email) = lower(p_email);
  if uid is null then raise exception 'Không tìm thấy tài khoản %', p_email; end if;
  perform public.mb_grant(uid, p_plan, p_act, p_gate, 0, 'manual', 'ADM-' || upper(substr(md5(random()::text), 1, 8)));
  return true;
end;
$$;
revoke all on function public.mb_admin_grant(text, text, int, int) from public, anon;
grant execute on function public.mb_admin_grant(text, text, int, int) to authenticated;

-- bảng xếp hạng: chỉ chặn khi đang BẬT thu phí; cần gói có quyền bảng xếp hạng (gói 30 ngày / 1 năm)
create or replace function public.mb_guard_score()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if not coalesce((select (value->>'enabled')::boolean from public.mb_config where key = 'paywall'), false) then return new; end if;
  if new.gate between 11 and 29 and not exists (
    select 1 from public.mb_entitlements e
    where e.user_id = new.user_id and (e.expires_at is null or e.expires_at > now())
      and (e.acts is null or (case when new.gate <= 21 then 2 else 3 end) = any (e.acts))
      and coalesce((e.perks->>'board')::boolean, false)
  ) then raise exception 'locked content'; end if;
  return new;
end;
$$;

-- ĐẶT ADMIN (chạy 1 lần, thay email của bạn):
--   insert into public.mb_admins (user_id) select id from auth.users where email = 'email-cua-ban@gmail.com' on conflict do nothing;

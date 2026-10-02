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

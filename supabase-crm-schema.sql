-- Fine Design CRM — leads, invoices & reviews tables
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query)
-- Safe to re-run in full even if leads/invoices already exist.

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  event_type text,
  status text not null default 'new',
  notes text,
  added_date date not null default current_date,
  updated_at date not null default current_date
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null,
  client_name text not null,
  event_type text,
  amount numeric not null default 0,
  date date not null default current_date,
  paid boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  event_type text,
  rating int not null default 5,
  review_text text not null,
  created_at timestamptz not null default now()
);

alter table leads enable row level security;
alter table invoices enable row level security;
alter table reviews enable row level security;

-- The admin panel is gated by a client-side password, not Supabase auth,
-- so the anon key needs direct read/write access to these tables only.
create policy "anon full access to leads" on leads
  for all using (true) with check (true);

create policy "anon full access to invoices" on invoices
  for all using (true) with check (true);

-- Reviews are publicly readable (shown on the site) and publicly
-- insertable (the public review form), but only deletable by anon
-- since admin auth is client-side only.
create policy "anon full access to reviews" on reviews
  for all using (true) with check (true);

-- Seed the 3 testimonials that used to be hardcoded on the homepage,
-- so they keep showing once the section switches to loading from this table.
-- Safe to re-run: only inserts if the table is still empty.
insert into reviews (name, event_type, rating, review_text, created_at)
select * from (values
  ('מיכל ואביב', 'חתונה', 5, 'עמית הקשיבה לכל פרט קטן, והתוצאה עברה את כל הציפיות שלנו. ההזמנה הייתה הכי יפה שראיתי, ובאמת הרגשנו שזה אנחנו.', now() - interval '60 days'),
  ('מאיה כ.', 'חינה', 5, 'ההזמנה לחינה שלי הייתה הכי יפה שראיתי. כולן שאלו מי עיצבה. שירות מהיר, מדויק ומקסים — מומלץ בחום.', now() - interval '45 days'),
  ('דינה ש.', 'בר מצווה', 5, 'הזמנתי עיצוב לבר מצווה של הבן שלי, ולא יכולתי להיות מרוצה יותר. עמית עבדה מהר, באהבה ובדיוק לפרטים הכי קטנים.', now() - interval '30 days')
) as seed(name, event_type, rating, review_text, created_at)
where not exists (select 1 from reviews);

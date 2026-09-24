insert into public.todos (title, is_completed, created_at)
values
  ('牛乳と卵を買う', true, now() - interval '4 days'),
  ('図書館の本を返す', false, now() - interval '3 days'),
  ('部屋を掃除する', true, now() - interval '2 days'),
  ('歯医者を予約する', false, now() - interval '1 day'),
  ('週末の予定を確認する', false, now());

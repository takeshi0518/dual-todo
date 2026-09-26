-- 練習用。認証導入時に auth.uid() = user_id へ差し替える。
create policy "anon can select todos"
on public.todos
for select
to anon
using (true);

-- 練習用。認証導入時に auth.uid() = user_id へ差し替える。
create policy "anon can insert todos"
on public.todos
for insert
to anon
with check (true);

-- 練習用。認証導入時に auth.uid() = user_id へ差し替える。
create policy "anon can update todos"
on public.todos
for update
to anon
using (true)
with check (true);

-- 練習用。認証導入時に auth.uid() = user_id へ差し替える。
create policy "anon can delete todos"
on public.todos
for delete
to anon
using (true);

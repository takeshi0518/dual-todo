# Todo 完了切り替え・削除 設計

- ブランチ: `feat/todo-update-delete`
- ステータス: 設計確定

## 背景・前提

追加（feat/todo-create）が終わったので、`is_completed` の切り替えと削除を作る。どちらも Server Action で検証してから update / delete し、`revalidatePath("/")` で一覧を更新する。失敗は既存の `error.tsx` に任せる（todo-create と同じ方針）。

## 確認済みの事実

- RLS は `update` / `delete` とも anon に全許可済み（`supabase/migrations/20260926140000_add_todos_rls_policies.sql`）
- `updated_at` は trigger（`set_todos_updated_at`）で自動更新される。アプリから渡さない
- Supabase の update / delete は、対象行が 0 件でも `error` を返さない
- Base UI の `Checkbox` は `onCheckedChange?: (checked: boolean, eventDetails) => void` と `disabled` を持つ（`node_modules/@base-ui/react/checkbox/root/CheckboxRoot.d.ts`）
- **Server Action の throw が error boundary に届くのは、transition の中で呼んだときだけ**（`node_modules/next/dist/docs/01-app/02-guides/interactive-apps.md`）。todo-create と同じく `startTransition` で呼ぶ
- zod v4 の `z.uuid()` は `gen_random_uuid()`（v4）の値を通し、不正な文字列を弾く（手元で確認済み）

## 作業範囲

0. 設計書 `docs/design/todo-update-delete.md` を作成する（この内容）
1. スキーマ
2. Server Action（切り替え・削除）
3. Client Component（`TodoCheckbox` / `DeleteTodoButton`）
4. `todo-card.tsx` への組み込み

### スコープ外

- 楽観的更新（`useOptimistic`）
- 削除の確認ダイアログ
- タイトルの編集
- 対象行が 0 件だった場合のエラー扱い（別タブで削除済みなど。`revalidatePath` で一覧が最新になるので、それで良しとする）

## 1. スキーマ: `src/app/_lib/todo-schema.ts` に追記

```ts
export const toggleTodoSchema = z.object({
  id: z.uuid(),
  isCompleted: z.boolean(),
});

export const deleteTodoSchema = z.object({
  id: z.uuid(),
});
```

- 既存の `todoSchema` と同じファイルに置く（Todo の入力検証をまとめるため）
- クライアント側では使わない（フォーム入力がないため）。`z.infer` の型 export も作らない（必要になったら足す）

## 2. Server Action

### `src/app/_actions/toggle-todo.ts`

- ファイル先頭に `'use server'`
- `export async function toggleTodo(input: unknown)`
  1. `toggleTodoSchema.safeParse(input)`。失敗したら `throw new Error('入力が不正です')`
  2. `.from('todos').update({ is_completed: parsed.data.isCompleted }).eq('id', parsed.data.id)`
     - 反転後の値をクライアントから受け取る（DB 側で読んで反転しない）。同じ値を 2 回送っても結果が変わらない
  3. `error` があれば `throw new Error('Todo の更新に失敗しました', { cause: error })`
  4. `revalidatePath('/')`

### `src/app/_actions/delete-todo.ts`

- ファイル先頭に `'use server'`
- `export async function deleteTodo(input: unknown)`

  1. `deleteTodoSchema.safeParse(input)`。失敗したら `throw new Error('入力が不正です')`
  2. `.from('todos').delete().eq('id', parsed.data.id)`
  3. `error` があれば `throw new Error('Todo の削除に失敗しました', { cause: error })`
  4. `revalidatePath('/')`

- どちらも戻り値はなし。引数を `unknown` にする理由は `createTodo` と同じ

## 3. Client Component

`TodoCard` は Server Component のままにし、操作が必要な部分だけを小さな Client Component に切り出す。

### `src/app/_components/todo-checkbox.tsx`（`TodoCheckbox`）

- `'use client'`
- props: `type TodoCheckboxProps = { id: string; isCompleted: boolean }`
- `const [isPending, startTransition] = useTransition()`
- ```tsx
  <Checkbox
    checked={isCompleted}
    disabled={isPending}
    onCheckedChange={(checked) => {
      startTransition(async () => {
        await toggleTodo({ id, isCompleted: checked });
      });
    }}
  />
  ```
  - `checked` は props のまま（楽観的更新なし）。再描画で新しい props が届いた時点でチェックが切り替わる
  - 処理中は `disabled` にして連打を防ぐ
  - `readOnly` は外す

### `src/app/_components/delete-todo-button.tsx`（`DeleteTodoButton`）

- `'use client'`
- props: `type DeleteTodoButtonProps = { id: string }`
- `const [isPending, startTransition] = useTransition()`
- 見た目は既存の削除ボタンをそのまま移す（`variant="ghost"` / `size="icon-sm"` / `type="button"` / `aria-label="削除"` / `Trash2Icon`）
- `disabled={isPending}`、`onClick` で `startTransition(async () => { await deleteTodo({ id }); })`

## 4. 組み込み: `src/app/_components/todo-card.tsx`

- `<Checkbox checked={todo.is_completed} readOnly />` → `<TodoCheckbox id={todo.id} isCompleted={todo.is_completed} />`
  - `Label` で包む構成は変えない（タイトルのクリックでも切り替わる）
- 削除の `<Button>…</Button>` → `<DeleteTodoButton id={todo.id} />`（`Label` の外のまま）
- 不要になった `Button` / `Checkbox` / `Trash2Icon` の import を消す
- タイトルの取り消し線は、これまでどおり `todo.is_completed` で切り替える

## 完了条件（検証）

- [ ] 未完了の Todo の Checkbox をクリックするとチェックが入り、タイトルに取り消し線と薄い色が付く。もう一度クリックすると戻る
- [ ] タイトルのクリックでも切り替わる
- [ ] 切り替え後にリロードしても状態が保たれ、Studio で `updated_at` が更新されている
- [ ] 削除ボタンをクリックすると、その Todo が一覧から消える。リロードしても戻らない
- [ ] 削除ボタンのクリックで Checkbox の状態は変わらない
- [ ] 全件削除すると「Todo がありません」が出る（確認後に `supabase db reset`）
- [ ] 処理中は対象の Checkbox / 削除ボタンが disabled になる
- [ ] `supabase stop` した状態で切り替え・削除すると error.tsx（「エラーが発生しました」）が出る
- [ ] `npm run lint` と `npm run build` が通る

# Todo 追加 設計

- ブランチ: `feat/todo-create`
- ステータス: 設計確定

## 背景・前提

一覧表示（feat/todo-list）が終わったので、Todo の追加機能を作る。クライアントでは zod + react-hook-form で検証する。Server Action でも同じスキーマで検証し直してから insert し、`revalidatePath("/")` で一覧を更新する。失敗は既存の `error.tsx` に任せる。

## 確認済みの事実

- `zod@4` / `react-hook-form@7` / `@hookform/resolvers@5` は追加済み（`package.json`・lock は未コミット）。`src/components/ui/input.tsx` も追加済み（未コミット）。このブランチでまとめてコミットする
- DB 制約（`supabase/migrations/20260924075647_create_todos.sql`）:
  - `todos_title_not_blank`: 半角スペース・タブ・全角スペースを除いて 1 文字以上
  - `todos_title_max_length`: `char_length <= 100`
  - trim はアプリ側で行う方針
- zod の `.trim()` は JS の `String.prototype.trim` を使うため、全角スペース（U+3000）も除去される。DB 制約と整合する
- `.max(100)` は UTF-16 単位で数える。DB の `char_length` より厳しい側に倒れるので、DB 制約に違反することはない
- **Server Action の throw が error boundary に届くのは、transition の中で呼んだときだけ**（`node_modules/next/dist/docs/01-app/02-guides/interactive-apps.md:174`）
  - そのため `handleSubmit` のコールバック内で `startTransition` を使う
  - RHF の `isSubmitting` は transition の完了を待たないので、送信中の判定には `useTransition` の `isPending` を使う
- `revalidatePath` は throw しない（`server-actions.md:152`）

## 作業範囲

0. 設計書 `docs/design/todo-create.md` を作成する（todo-list.md と同じ形式で、この内容を書き出す）
1. スキーマ
2. Server Action
3. shadcn `field` の追加と `todo-form.tsx`
4. `page.tsx` への組み込みと `error.tsx` の文言変更

### スコープ外

- 完了切り替え・編集・削除
- 楽観的更新（`useOptimistic`）
- サーバー検証エラーをフィールドに返す処理（改ざんされたリクエストでしか起きないため、throw で済ませる）

## 1. スキーマ: `src/app/_lib/todo-schema.ts`

```ts
export const todoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'タイトルを入力してください')
    .max(100, '100文字以内で入力してください'),
});
export type TodoInput = z.infer<typeof todoSchema>;
```

- `"use server"` / `"use client"` は付けない（クライアントとサーバーの両方から import するため）
- zod v4 の API は Context7 で確認する

## 2. Server Action: `src/app/_actions/create-todo.ts`

- ファイル先頭に `"use server"`
- `export async function createTodo(input: unknown)`
  - 引数を `unknown` にするのは、信頼できない入力だと明示するため
  1. `todoSchema.safeParse(input)`。失敗したら `throw new Error("入力が不正です")`
  2. `createClient()`（`@/lib/supabase/server`）で `.from("todos").insert({ title: parsed.data.title })`
     - スプレッドを使わず、列を明示して渡す
  3. `error` があれば `throw new Error("Todo の追加に失敗しました", { cause: error })`
  4. `revalidatePath("/")`
- 戻り値はなし

## 3. フォーム

### shadcn `field` の追加

- `npx shadcn@latest add field` を実行する（npm 依存は増えず、`src/components/ui/field.tsx` が追加される）
- 追加後に `field.tsx` を読み、`Field` / `FieldLabel` / `FieldError` の props（`orientation`、`errors` の型）を確認する

### `src/app/_components/todo-form.tsx`（`TodoForm`）

- `"use client"`
- `const form = useForm({ resolver: zodResolver(todoSchema), defaultValues: { title: "" } })`
  - 検証タイミングは RHF のデフォルトのまま（送信時に検証し、その後は変更のたびに再検証）
- `const [isPending, startTransition] = useTransition()`
- 送信処理:
  ```ts
  function onSubmit(data: TodoInput) {
    startTransition(async () => {
      await createTodo(data);
      form.reset();
      form.setFocus('title');
    });
  }
  ```
  - `data` は resolver を通っているので trim 済み
  - 失敗時は throw され、error.tsx に表示される
- レイアウト（横並び。ラベルは `sr-only`）:
  ```
  <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
    <Controller name="title" control={form.control} render={({ field, fieldState }) => (
      <Field data-invalid={fieldState.invalid} className="flex-1">
        <FieldLabel htmlFor="todo-title" className="sr-only">タイトル</FieldLabel>
        <Input {...field} id="todo-title" placeholder="新しいTodo" aria-invalid={fieldState.invalid} autoComplete="off" />
        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
      </Field>
    )} />
    <Button type="submit" disabled={isPending}>追加</Button>
  </form>
  ```
  - `{...field}` で `ref` も Input に渡るので、`setFocus` が動く
  - 送信中も Input は disabled にしない（フォーカスを保つため）
  - 送信中にボタンの文言は切り替えない。二重送信は `disabled` で防ぐ（ローカルでは一瞬で終わり、文言の切り替えがちらつきになるため）

## 4. 組み込み

- `src/app/page.tsx`: `<h1>` と `<TodoList>` の間に `<TodoForm />` を置く
  - 間隔を取るため、`<main>` を `mx-auto flex max-w-xl flex-col gap-6 p-6` にする
- `src/app/error.tsx`: 文言を「Todo の取得に失敗しました」から「エラーが発生しました」に変える（取得・追加のどちらにも合う文言にする）

## 完了条件（検証）

- [ ] `npm run dev` で追加すると、一覧の先頭に表示される。入力欄は空になり、フォーカスが入力欄に残る
- [ ] 前後に空白がある入力（例: `　買い物　`）は trim されて保存される
- [ ] 空・空白のみ（全角スペースを含む）で送信すると「タイトルを入力してください」と表示され、Server Action は呼ばれない
- [ ] 101 文字で「100 文字以内で入力してください」、100 文字は追加できる
- [ ] エラー表示中に入力を直すと、その場でエラーが消える
- [ ] 送信中はボタンが disabled になる（文言は「追加」のまま）
- [ ] `supabase stop` した状態で送信すると error.tsx（「エラーが発生しました」）が出る
- [ ] `npm run lint` と `npm run build` が通る

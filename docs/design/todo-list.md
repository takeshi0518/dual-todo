# Todo 一覧表示 設計

- ブランチ: `feat/todo-list`
- ステータス: 設計確定

## 背景・前提

- `todos` テーブル・seed・RLS（anon に全許可）は作成済み
- 認証なし・ローカル開発のみ。接続は publishable（anon）キー
- 環境変数（`.env` に設定済み）: `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `@supabase/supabase-js` / `@supabase/ssr` はインストール済み。shadcn/ui の `card` / `checkbox` / `label` / `button` は `src/components/ui/` に追加済み（**新しい依存は追加しない**）

## このブランチの作業範囲

1. Supabase クライアント（server / browser）
2. Server Component で todos を取得
3. 一覧 UI（`app/page.tsx`）、0 件表示、`app/error.tsx`、削除ボタン（UI のみ）
4. `package.json` の `db:types` の出力先を修正

### スコープ外

- 追加・完了切り替え・編集
- 削除の処理（ボタンの見た目だけ置き、クリックしても何も起きない）
- `proxy.ts`（旧 middleware）でのセッション更新（認証がないため不要）
- `loading.tsx`、ページネーション

## 1. Supabase クライアント

複数の機能から使う共通モジュールのため `src/lib/supabase/` に置く。

| ファイル                     | 関数                            | 実装                                                                                                                                    |
| ---------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/supabase/server.ts` | `async function createClient()` | `@supabase/ssr` の `createServerClient<Database>`。`await cookies()`（`next/headers`、Next 16 では async）の `getAll` / `setAll` を渡す |
| `src/lib/supabase/client.ts` | `function createClient()`       | `@supabase/ssr` の `createBrowserClient<Database>`                                                                                      |

- `Database` 型は `@/types/database` から import する
- `setAll` は `try/catch` で囲む。Server Component の描画中は cookie を書けないため（`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md`「Setting cookies is not supported during Server Component rendering」）。catch では何もしない旨をコメントで書く
- 環境変数は `process.env.NEXT_PUBLIC_SUPABASE_URL!` のように非 null アサーションで読む（検証処理は作らない）
- `client.ts` はこのブランチでは未使用（次の完了切り替えで使う）
- API は Context7 で `@supabase/ssr` の Next.js 向けドキュメントを確認すること

## 2. データ取得: `src/app/page.tsx`

- `export default async function Home()`（Server Component）
- `const supabase = await createClient()`（server 用）
- クエリ: `.from("todos").select("id, title, is_completed").order("created_at", { ascending: false })`
- `error` があれば `throw new Error("Todo の取得に失敗しました", { cause: error })` → `app/error.tsx` が受ける
- `cookies()` を使うため、ページは動的レンダリングになる（ビルド時に DB は不要）

## 3. UI

### 型

- `type Todo = Pick<Tables<"todos">, "id" | "title" | "is_completed">`（`Tables` は `@/types/database`）
- 定義場所は `todo-card.tsx`（使う場所の近く）。`todo-list.tsx` から import する

### `src/app/page.tsx`

- データ取得（「2. データ取得」）を行い、結果を `<TodoList todos={todos} />` に props で渡す
- `<main className="mx-auto max-w-xl p-6">`、見出し `<h1>` は「Todo」。見出しは件数に関係なく常に表示する（`TodoList` の外に置く）

### `src/app/_components/todo-list.tsx`（`TodoList`）

- Server Component（`"use client"` は付けない）
- props: `type TodoListProps = { todos: Todo[] }`
- 0 件: 早期 return で `<p className="text-muted-foreground">Todoがありません</p>` を返す
- 1 件以上: `<ul className="flex flex-col gap-3">` の各 `<li key={todo.id}>` に `<TodoCard todo={todo} />`

### `src/app/_components/todo-card.tsx`（`TodoCard`）

- Server Component（`"use client"` は付けない。`Checkbox` / `Label` は ui 側で client 指定済み）
- 並び: `| Checkbox | タイトル | 削除ボタン |`
- 構成:
  ```
  <Card size="sm">
    <CardContent className="flex items-center gap-3">
      <Label className="min-w-0 flex-1">   ← Checkbox とタイトルを包む（タイトルがチェックボックスのアクセシブルネームになる）
        <Checkbox />
        <span>タイトル</span>
      </Label>
      <Button />                            ← 削除ボタン。Label の外に置く
    </CardContent>
  </Card>
  ```
- 削除ボタンを Label の中に入れない（ボタンのクリックが Checkbox に伝わらないようにするため）
- `Label` に `min-w-0 flex-1` を付け、長いタイトルは折り返してボタンを右端に保つ。タイトルの `span` には `break-words` を付ける
- `Checkbox`: `checked={todo.is_completed}` と `readOnly`。`onCheckedChange` は渡さない
- タイトル: `is_completed` が true のとき `line-through text-muted-foreground` を付ける（`cn` は `@/lib/utils`）

#### 削除ボタン（UI のみ）

- shadcn の `Button`（`@/components/ui/button`）を使う
- `variant="ghost"`、`size="icon-sm"`、`type="button"`
- 中身は `lucide-react` の `Trash2Icon`（インストール済み）。アイコンだけのボタンなので `aria-label="削除"` を付ける
- `onClick` は渡さない（処理は次の削除機能で実装する）。`disabled` にはしない（見た目を本番どおりにするため）
- `TodoCard` は Server Component のままでよい（`onClick` を渡さないため。Base UI の Button は内部で `"use client"` 指定済み）

### `src/app/error.tsx`

- `"use client"`（error boundary は Client Component 必須）
- props は **`{ error, retry }`**（Next 16 の API。`reset` ではない。`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md` を確認）
- `useEffect` で `console.error(error)`
- 表示: 「Todo の取得に失敗しました」＋ shadcn の `Button` で「再試行」→ `retry()`

## 4. `package.json`

- `db:types`: 出力先を `src/types/supabase.ts` → `src/types/database.ts` に修正（AGENTS.md・既存ファイルに合わせる）

## 完了条件

- [ ] `supabase db reset` 後、`npm run dev` で `/` に seed の 5 件が新しい順（先頭が「週末の予定を確認する」）に Card で表示される
- [ ] 完了済み 2 件（「部屋を掃除する」「牛乳と卵を買う」）はチェックが入り、取り消し線と薄い色になっている
- [ ] Checkbox・タイトルをクリックしてもチェック状態が変わらない
- [ ] 各カードの右端にゴミ箱アイコンの削除ボタンが表示される。クリックしても何も起きず、Checkbox の状態も変わらない
- [ ] 長いタイトル（100 文字）でも折り返され、削除ボタンが右端からはみ出さない
- [ ] SQL Editor で `delete from todos;` → リロードで「Todo がありません」が出る（見出し「Todo」は表示されたまま）（確認後に `supabase db reset`）
- [ ] `supabase stop` した状態でアクセス → error.tsx の画面が出る。`supabase start` 後に「再試行」で一覧が表示される
- [ ] `npm run db:types` で `src/types/database.ts` が更新され、差分が出ない
- [ ] `npm run lint` と `npm run build` が通る

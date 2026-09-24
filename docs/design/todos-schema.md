# todos スキーマ設計

- ブランチ: `feat/todos-schema`
- ステータス: 設計確定（RLS ポリシーは別途設計）

## 背景・前提

- 機能: Todo の追加・一覧・完了切り替え・タイトル編集・削除
- 期限・メモ・優先度・フィルタはスコープ外
- 一覧は新しい順（`created_at desc`）
- 認証なし・デプロイなし（ローカル開発のみ）

## このブランチの作業範囲

1. migration: `todos` テーブル、`updated_at` トリガー、RLS 有効化
2. seed データ
3. 型生成（`src/types/database.ts`）

RLS ポリシーはこのブランチでは作らない（次のステップで別 migration として設計・実装）。

## テーブル定義: `public.todos`

| 列             | 型            | 制約・デフォルト                                     |
| -------------- | ------------- | ---------------------------------------------------- |
| `id`           | `uuid`        | primary key, `default gen_random_uuid()`             |
| `title`        | `text`        | `not null`, check 制約（下記）                       |
| `is_completed` | `boolean`     | `not null default false`                             |
| `created_at`   | `timestamptz` | `not null default now()`                             |
| `updated_at`   | `timestamptz` | `not null default now()`、更新時にトリガーで自動更新 |

- `user_id` は持たない（認証導入時に migration で追加する）
- `created_at` へのインデックスは作らない（件数規模的に不要）

### `title` の check 制約

1. **空白だけのタイトルを禁止する**。半角スペース・タブ・全角スペース（U+3000）を除いて 1 文字以上
   - Postgres の `trim()` は半角スペースしか除去しないため、除去対象を明示する
   - 例: `char_length(btrim(title, E' \t　')) > 0`
2. **最大 100 文字**。生の値に対して `char_length(title) <= 100`
   - 前後の空白の除去（trim）はアプリ側で保存前に行う。DB では「trim 済みであること」を強制しない

制約には名前を付ける（例: `todos_title_not_blank`, `todos_title_max_length`）。

## `updated_at` の自動更新

- 汎用のトリガー関数 `public.set_updated_at()` を作る（他のテーブルでも再利用できるように）
  - `returns trigger`、`language plpgsql`
  - `new.updated_at := now()` をセットして `new` を返す
  - **`set search_path = ''` を指定する**（Supabase linter の `function_search_path_mutable` 対策）
- `todos` に `before update ... for each row` のトリガーを張る

## RLS

- この migration 内で `alter table public.todos enable row level security;` を実行する
- ポリシーはまだ作らない。したがって、ポリシーが入るまでは anon からアクセスできない（想定どおり）

## migration

- 作成: `supabase migration new create_todos`
- 1 ファイルに、テーブル → トリガー関数 → トリガー → RLS 有効化 の順で書く

## seed: `supabase/seed.sql`

- 4〜5 件
- 未完了と完了を混ぜる
- `created_at` をずらす（例: `now() - interval '2 days'`）。並び順が画面で確認できるように
- タイトルは日本語で、実際の Todo らしいもの

## 型生成

```bash
supabase gen types typescript --local > src/types/database.ts
```

生成したファイルはコミットする。

## 前提環境

- Supabase CLI **v2.117.0 以上**（`config.toml` がこのバージョンで生成されており、古い CLI では `[local_smtp]` を解釈できず起動に失敗する）

## 完了条件

- [ ] `supabase db reset` がエラーなく完了する
- [ ] 以下が期待どおり動く（Studio の SQL Editor か psql で確認）
  - [ ] `insert into todos (title) values ('買い物')` → 成功。`is_completed = false`、`created_at` と `updated_at` が入る
  - [ ] `title` が `''` / `'   '` / `'　'`（全角スペース） → check 制約違反
  - [ ] `title` が 101 文字 → check 制約違反、100 文字 → 成功
  - [ ] `update` すると `updated_at` だけが更新され、`created_at` は変わらない
  - [ ] `select relrowsecurity from pg_class where relname = 'todos'` → `true`
- [ ] seed データが投入されている
- [ ] `src/types/database.ts` が生成され、`todos` の型が含まれる
- [ ] `npm run lint` と `npm run build` が通る

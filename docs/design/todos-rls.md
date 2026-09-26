# todos RLS ポリシー設計

- ブランチ: `feat/todos-rls`
- ステータス: 設計確定

## 背景・前提

- `todos` は `create_todos` migration で RLS 有効化済みだが、ポリシーがないため anon から一切アクセスできない
- 認証なし・デプロイなし（ローカル開発のみ）
- AGENTS.md の方針どおり、練習用として全許可ポリシーを置く（認証追加時に差し替える）

## 方針

| 論点       | 決定                                              | 理由                                                                                        |
| ---------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 接続キー   | publishable（anon）キー                           | secret（service_role）キーは RLS をバイパスし、ポリシーが意味を持たない                     |
| 粒度       | `select` / `insert` / `update` / `delete` の 4 本 | 認証導入時に操作単位で差し替えやすい（Supabase 推奨）                                       |
| 対象ロール | `to anon` のみ                                    | 現状アプリが使うロールに限定し意図を明確にする。認証導入時に `authenticated` 用へ差し替える |

## このブランチの作業範囲

1. migration: `todos` への RLS ポリシー 4 本

### スコープ外

- 認証、`user_id` 列の追加
- `authenticated` ロール向けのポリシー
- アプリ側の Supabase クライアント実装
- 型生成（スキーマ変更がないため不要）

## migration

- 作成: `supabase migration new add_todos_rls_policies`
- 既存の `create_todos` migration は編集しない

## ポリシー

| 名前                    | 操作     | 対象   | 条件                             |
| ----------------------- | -------- | ------ | -------------------------------- |
| `anon can select todos` | `select` | `anon` | `using (true)`                   |
| `anon can insert todos` | `insert` | `anon` | `with check (true)`              |
| `anon can update todos` | `update` | `anon` | `using (true) with check (true)` |
| `anon can delete todos` | `delete` | `anon` | `using (true)`                   |

- 各ポリシーに SQL コメントで「練習用。認証導入時に `auth.uid() = user_id` へ差し替える」旨を書く

## 注意: GRANT について

- ポリシー（行の可視性）とテーブル権限（GRANT）は別物。anon へのテーブル権限は Supabase の既定で付与されている想定
- 検証で `permission denied for table todos` などの権限エラーが出た場合は、GRANT を追加せずに確認を求める（設計外の判断のため）

## 完了条件

- [ ] `supabase db reset` がエラーなく完了する
- [ ] `select policyname, cmd, roles from pg_policies where tablename = 'todos'` → 4 行、`roles` がすべて `{anon}`
- [ ] Studio の SQL Editor か psql で `set role anon;` した上で以下が期待どおり動く（最後に `reset role;`）
  - [ ] `select` → seed の 5 件が見える
  - [ ] `insert` → 成功
  - [ ] `update` → 成功し、`updated_at` が更新される
  - [ ] `delete` → 成功
- [ ] `set role authenticated;` で `select` → 0 件（ポリシー対象外であることの確認。最後に `reset role;`）
- [ ] `npm run lint` と `npm run build` が通る

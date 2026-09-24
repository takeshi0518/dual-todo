# dual-todo

学習用のシンプルな Todo アプリ。

## 役割分担

- 設計の相談（壁打ち）: Claude Code
- 実装: Codex

合意した設計に沿って実装する。設計にない判断（仕様の追加・変更、構成の変更など）が必要になったら、実装を進めずに確認すること。

## 技術スタック

- Next.js 16.3（App Router）/ React 19.2 / TypeScript
- React Compiler 有効（`next.config.ts`）: `useMemo` / `useCallback` / `memo` を手で書かない
- Tailwind CSS v4
- ESLint 9（flat config, `eslint.config.mjs`）
- Supabase（ローカル開発は Supabase CLI + Docker）
- パッケージマネージャ: npm

## コマンド

```bash
npm run dev      # 開発サーバー
npm run build    # 本番ビルド
npm run lint     # Lint

supabase start                 # ローカル Supabase 起動
supabase stop                  # 停止
supabase db reset              # migrations と seed を再適用
supabase migration new <name>  # migration ファイル作成
```

## ディレクトリ構成

- `src/app/` — App Router のページ・レイアウト
- `supabase/config.toml` — ローカル Supabase 設定
- `supabase/migrations/` — スキーマ変更（migration ファイル）
- import エイリアス: `@/*` → `./src/*`

## 実装ルール

- Next.js の API は学習データを当てにせず、`node_modules/next/dist/docs/` か Context7 で確認する
- Server Components を基本にし、`"use client"` は必要な箇所だけに付ける
- スタイリングは Tailwind で行う
- 依存パッケージを追加するときは理由を説明する

## Supabase 運用

- スキーマ変更は必ず migration ファイルで行う（Studio で直接変更しない）
- テーブルには RLS を有効にする
- API キーなどの秘密情報や `.env*` はコミットしない

## Git 規約

- ブランチ名: `<type>/<topic>`（例: `feat/todo-list`, `chore/setup`）
- コミットメッセージ: Conventional Commits の type + 日本語の説明（例: `feat: Todo一覧を表示`）

## 完了条件

- `npm run lint` と `npm run build` が通ること

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

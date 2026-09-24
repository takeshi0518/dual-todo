# dual-todo

このプロジェクトは設計、レビューを`Claude Code`、実装を`Codex`で作成した学習用のシンプルな Todo アプリです。

## セットアップ

### 前提

- Node.js
- Docker（ローカル Supabase 用）
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)

### 手順

```bash
npm install
supabase start
npm run dev
```

http://localhost:3000 で起動します。Supabase Studio は http://localhost:54323 です。

### 停止

```bash
supabase stop
```

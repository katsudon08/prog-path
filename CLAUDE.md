# CLAUDE.md

このファイルは Claude Code がこのリポジトリで作業する際の指針です。

## プロジェクト概要

**ProgPath** — 小学生（高学年中心）向けのプログラミング教育導入アプリ。

- **利用前提**: 学校の授業での利用。1 クラスに複数台の PC を用意し、児童 **2〜3 人で 1 台を囲んで** 使う。協調学習の基本単位はこの「2〜3 人で 1 台」グループ。役割分担は運用に委ね、アプリでは強制しない。家庭学習・1人1台・イベント展示は主対象ではない。
- **中心価値**: 3D / AR 表現 と QR カードによる命令作成。迷路エディタは補助的な位置づけ。
- 機能・UI・成功指標を検討するときは、常に「2〜3 人で 1 台を囲む授業」を基準に判断する。

## 現在のフェーズ

**ゼロから全面再開発中**。要件定義を起点に理想形を作る。

- 既存実装（Next.js + Electron）は **破棄予定**。既存コードを「正」として提案しないこと。
- 詳細な要件 / アーキテクチャ / DB 設計は `docs/` 配下に整備していく。確定済みのものはそちらを参照する。

## 技術スタック（to-be）

| 領域 | 採用 |
| --- | --- |
| ランタイム | Node |
| ツールチェーン | Vite+（vp） |
| パッケージマネージャー | pnpm |
| 開発環境管理ツール | mise（ランタイム固定 + コマンド/タスク実行） |
| Lint / Format / 型チェック | Vite+（Oxlint / Oxfmt / tsgo） |
| テスト | Vite+（Vitest） |
| 言語 | TypeScript |
| UI | React |
| UI コンポーネント | Radix UI + Tailwind CSS |
| 3D | Three.js（React Three Fiber） |
| QR 認識 | qr-scanner（jsQR を Web Worker でラップ） |
| デスクトップ | Tauri |
| バリデーション | Zod |
| DB アクセス | TanStack DB |
| ローカルDB | IndexedDB |
| 状態管理 | Zustand / 複雑な遷移は XState |

- **Vite+（vp）** は dev/build に加え、lint・format・型チェック（Oxlint/Oxfmt/tsgo）、テスト（`vp test`）、モノレポ対応のタスク実行、パッケージングを一本化する統合 CLI。Vite/Rolldown ベース。
- 住み分け: **mise** が言語ランタイム・CLI ツールのバージョン固定と、プロジェクトのコマンド/タスク実行（`mise run <task>`、`mise.toml` の `[tasks]`）の入口を担う。各タスクの中身は **pnpm**（依存解決）や **vp**（ビルド・lint・format・型チェック・テスト）を呼び出す。バージョン固定の正は mise に置く（vp 自身もランタイム管理／PM 選択機能を持つが、本プロジェクトでは使わない）。
- AR は「カメラ映像を背景に 3D を重ねる」方式（マーカートラッキングは将来拡張）。
- Tauri のカメラ（`getUserMedia`）は OS の WebView 依存のため要検証。

## アーキテクチャ（FSD）

Feature-Sliced Design を厳守する。

- **レイヤー（上位→下位）**: `app` → `pages` → `widgets` → `features` → `entities` → `shared`。依存は上位→下位の **一方向のみ**。
- **同一レイヤー内の直接参照は禁止**（例: `entities/robot` → `entities/maze`）。必要なら上位で組み合わせるか `shared` へ抽出する。循環参照は厳禁。
- **Public API**: 他スライスからの import は必ずスライス直下の `index.ts` 経由。`export * from` は避け、公開対象を明示する。
- **セグメント**: 各スライスは `ui` / `model`（状態・型・ロジック） / `lib`（スライス内ユーティリティ）/（任意）`api`。
- **ロジックと UI の分離**: 純粋な遷移・計算ロジックは `ui` を持たない `model` / `lib` に集約する。実行は明示的なステートマシンで表現する。

> 詳細なディレクトリ構成・機能仕様は `docs/`（整備後）を参照。

## コーディング規約（要点）

- **命名**: ファイル/ディレクトリ `kebab-case` / コンポーネント・型 `PascalCase` / 変数・関数 `camelCase` / 定数 `UPPER_SNAKE_CASE`。Hook は `use-` 始まり（例 `use-maze-state.ts`）。
- **TypeScript**: `any` 禁止（`unknown` + 型ガード）。オブジェクト形状は `interface`、ユニオン/交差/別名は `type`。関数は引数・戻り値の型を明示。`async/await` は `try-catch` を伴う。
- **React**: `const` アロー関数で定義。Props はデストラクチャ + デフォルト値。ビジネスロジックは UI に直接書かず Hook / model に分離。
- **R3F**: 高頻度更新は `useFrame` 内で `ref.current` を直接操作し `setState` を避ける。アセットは `useGLTF`/`useLoader` でキャッシュ。`useFrame` 内では一時ベクトルを再利用して GC を抑制。
- **コメント**: 公開関数は JSDoc。3D 座標変換など数式箇所は意図を残す。

## Git 運用

- **ブランチ**:
  - `main` … **開発のベース**。作業ブランチを切り、`main` に向けて PR を出す。`main` への直接コミットは避ける。
  - `release` … リリース済みコードを置くブランチ。リポジトリにアクセスした人に最初に表示させる目的（デフォルト表示）であり、**開発 PR のベースにはしない**。
- **開発フロー**: Issue ごとに作業ブランチ（例 `feat/<issue>-...`）を `main` から切り、`main` に向けて PR を作成する。
- **コミット前のブランチ確認（必須）**: `commit` skill を使うかどうかに関わらず、**コミットする直前に必ず `git branch --show-current` で現在のブランチを確認する**。`main` / `release` 上にいる場合は直接コミットせず、作業ブランチを切り直してから行う。PR マージ後のローカル同期などで HEAD が `main` に移っていることがあるため、「さっきまで作業ブランチにいた」前提で確認を省略しない。
- **ブランチ命名**: `<type>/<issue>-<kebab-case-summary>` 形式。区切りは必ず**ハイフン（`-`）**を使い、**アンダースコア（`_`）は使わない**（例: ✅ `docs/144-requirements` / ❌ `docs/144_requirements`）。`type` はコミット規約と同じ（`feat` / `fix` / `docs` など）。
- **コミット規約**: Conventional Commits + 日本語。

  ```
  <type>(<scope>): <日本語サマリ>

  <本文（任意）: 何を・なぜ。関連 Issue: #N / closes #N>
  ```

  - **type**: `feat` / `fix` / `docs` / `style` / `refactor` / `perf` / `test` / `chore` / `build` / `ci`
  - **scope**: FSD レイヤー/スライス名（例 `entities/robot`、`features/maze-edit`、`shared/ui`）。横断的な変更では省略可。
- **署名・帰属の禁止**: コミットメッセージ・PR・Issue に Claude による署名や帰属（`Co-Authored-By: Claude ...`、`🤖 Generated with Claude Code` 等）を一切付けない。

## Skills（このプロジェクトの開発フロー）

`.claude/skills/` に定義。標準フロー: **plan → issue → （実装） → commit → push → pr → docs**。

| skill | いつ使うか |
| --- | --- |
| `plan` | 新機能・変更の実装前に、要件・仕様・制約をユーザーと壁打ちして固めるとき。必要に応じて `issue` を起動 |
| `issue` | 作業項目を GitHub Issue 化・整理するとき（Project #5 と連携） |
| `commit` | 変更を Conventional Commits + 日本語でコミットするとき |
| `push` | コミットをリモートへ反映するとき |
| `pr` | プルリクエストを作成するとき（ベースは `main`） |
| `docs` | あらゆる Markdown（`docs/`・`README`・その他の `.md`）を構造化して作成・編集するとき。`plan` のドキュメント版。実装との同期もここで行う |

## GitHub Project

- 管理ボード: **Project #5**（`https://github.com/users/katsudon08/projects/5`）。
- フィールド: **Status**（Todo / In Progress / Done）、**Priority**（High / Medium / Low）、**Estimate**（フィボナッチ 1/2/3/5/8/13）。

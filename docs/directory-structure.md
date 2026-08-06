# ディレクトリ構成

ProgPath（再開発版）の **`src/` 配下のディレクトリ構成**を定義する。[architecture.md](./architecture.md) で定めた FSD レイヤー/依存規則を、実際のスライス・セグメントへ具体化したもの。

- 対象読者: 新規開発者、および設計判断の参照者（人・AI）。
- 記述の方針: **スライス＋代表セグメント**まで示す。全ファイルは列挙せず、代表例のファイル名のみ提示し、細部は実装時の裁量に委ねる。
- 前提: FSD 規則・依存方向は [architecture.md](./architecture.md) 3 章を正とする。機能の対応は [features.md](./features.md)。
- 命名は [CLAUDE.md](../CLAUDE.md) のコーディング規約に従う（ディレクトリ/ファイル: `kebab-case`、Hook: `use-` 始まり）。

> 〔要確認〕が付いた箇所は暫定。実装着手時に確定させる。

---

## 1. ルート構成

```
/
├─ src/
│  ├─ app/        … 初期化・エントリ・プロバイダ・ルーティング・グローバルスタイル
│  ├─ pages/      … 画面
│  ├─ widgets/    … 画面ブロック
│  ├─ features/   … 機能単位
│  ├─ entities/   … ドメインオブジェクト
│  └─ shared/     … 共通基盤
├─ src-tauri/     … Tauri（デスクトップ）側
├─ public/        … 静的アセット
└─ docs/          … ドキュメント
```

- `src/` 内はすべて FSD レイヤー。レイヤー間の依存は上位→下位の一方向のみ（→ [architecture.md](./architecture.md) 3.2）。
- `src-tauri/` は Tauri の Rust/設定側。フロントの FSD とは分離する。
- 3D アセット（glTF 等）は `public/` 配下に置き、`useGLTF` でロードする〔要確認: アセット配置の細部〕。

---

## 2. レイヤーとセグメントの規則

### 2.1 セグメント

各スライスは以下のセグメントを持つ（`api` は任意）。

| セグメント | 内容 |
| --- | --- |
| `ui` | コンポーネント・見た目 |
| `model` | 状態・型・ビジネスロジック |
| `lib` | スライス内ユーティリティ |
| `api`（任意） | 外部 I/O |

### 2.2 Public API（`index.ts`）

- 他スライスからの import は必ずスライス直下の `index.ts` 経由。
- `export * from` は避け、**公開対象を明示**する。
- スライス内部（`ui` の個別ファイル等）への直接 import は禁止。

```typescript
// entities/maze/index.ts の例（公開対象を明示）
export { MazePreview } from "./ui/maze-preview";
export type { Maze, TileKind } from "./model/types";
export { createInitialMaze } from "./lib/create-initial-maze";
```

---

## 3. 全体ツリー

```
src/
├─ app/
│  ├─ entrypoint/         … アプリ起点（createRoot・global.css 読込）
│  ├─ providers/          … テーマ等のプロバイダ
│  ├─ routing/            … ルート定義
│  ├─ styles/             … グローバルスタイル（Tailwind 読込・@theme）
│  └─ index.ts
│
├─ pages/
│  ├─ home/               … ホーム画面
│  ├─ maze-edit/          … 迷路作成・編集画面
│  ├─ ar-run/             … AR 実行画面
│  └─ download/           … ダウンロード画面
│
├─ widgets/
│  ├─ maze-library/       … ホーム主要部（フォルダ＋迷路一覧＋詳細）
│  ├─ maze-editor/        … 編集主要部（グリッド＋パレット＋階層/サイズ）
│  ├─ ar-stage/           … AR 描画ブロック（カメラ＋3D＋オーバーレイ）
│  └─ command-panel/      … コマンド操作ブロック（スタック＋位置選択）
│
├─ features/
│  ├─ maze-management/    … 迷路 CRUD
│  ├─ folder-management/  … フォルダ管理
│  ├─ maze-qr-management/ … 迷路の QR 共有（import/export）
│  ├─ maze-edit/          … グリッド編集・整合チェック
│  ├─ command-management/ … QR からの命令作成・スタック構築
│  ├─ maze-simulation/    … 迷路実行エンジン（XState）
│  └─ app-download/       … Desktop 版入手導線
│
├─ entities/
│  ├─ maze/               … 迷路（構造・タイル）
│  ├─ robot/              … ロボット（位置・向き・階層・カギ）
│  ├─ command/            … コマンド（種別・ネスト構造）
│  └─ folder/             … フォルダ（分類）
│
└─ shared/
   ├─ ui/                 … 共通 UI（Radix + Tailwind ラッパ）
   ├─ lib/                … 汎用ユーティリティ
   ├─ qr/                 … QR デコーダ抽象（qr-scanner）
   ├─ camera/             … カメラ取得抽象（getUserMedia / 環境差吸収）
   ├─ db/                 … TanStack DB + SQLite(WASM+OPFS) アクセス
   └─ config/             … 定数・設定
```

---

## 4. レイヤー別の詳細

### 4.1 app

全体の初期化を担う。エントリ（`entrypoint`）、プロバイダ（テーマ等）、ルーティング、グローバルスタイル（`styles`）、グローバル設定を置く。ビジネスロジックは持たない。

- **`entrypoint`**: アプリ起点。`entrypoint/main.tsx` を `index.html` が読み込み、`createRoot` で描画する。FSD 公式の `app/entrypoint` セグメントに対応。
- **`styles`**: グローバルスタイル。`styles/global.css` が Tailwind を読み込み、デザイントークンを `@theme` に定義する（トークンの中身は #174）。`entrypoint` から import する。

> **TanStack DB は Provider 不要**。`useLiveQuery` はコレクションを直接購読し、コレクションは `shared/db` でモジュールレベルのシングルトンとして定義する。`QueryClientProvider` が要るのは Query Collection（サーバ同期）を使う場合のみで、本プロジェクト（オフライン・SQLite）では使わない。

### 4.2 pages

各画面を組み立てる。widgets と features を配置し、画面固有のレイアウトのみを持つ。

| ページ | 対応画面（features.md） | 主に配置する widgets |
| --- | --- | --- |
| `home` | ホーム画面 | `maze-library` |
| `maze-edit` | 迷路作成・編集画面 | `maze-editor` |
| `ar-run` | AR 実行画面 | `ar-stage` / `command-panel` |
| `download` | ダウンロード画面 | （`features/app-download` を直接利用） |

### 4.3 widgets

複数の feature/entity を束ねた、再利用可能な画面ブロック。pages の肥大化を防ぐ。

| widget | 役割 | 束ねる主な要素 |
| --- | --- | --- |
| `maze-library` | ホーム主要部 | folder-management / maze-management / entities(maze, folder) |
| `maze-editor` | 編集主要部 | maze-edit / entities(maze) |
| `ar-stage` | AR 描画＋実行 | maze-simulation / entities(maze, robot) / shared(camera) |
| `command-panel` | コマンド操作 | command-management / entities(command) |

### 4.4 features

ユーザー価値を生む機能単位。複数エンティティをまたぐロジックはここに置く（→ [architecture.md](./architecture.md) 4.2）。

| feature | 責務 | 代表セグメント |
| --- | --- | --- |
| `maze-management` | 迷路 CRUD・空状態 | model（CRUD ロジック）/ ui |
| `folder-management` | フォルダ作成/リネーム/削除（中の迷路ごと）・DnD。可否の判定は `entities/folder` の権限マトリクスに従う | model / ui |
| `maze-qr-management` | 迷路の QR 共有（1 迷路 = 1 QR） | model（エンコード/デコード）/ ui |
| `maze-edit` | グリッド編集・タイル配置・テレポート整合 | model（整合チェック）/ ui |
| `command-management` | QR からの命令作成・スタック構築・ループのネスト | model（スタック操作）/ ui |
| `maze-simulation` | 実行エンジン・成功/失敗判定・AR 実行フロー | model（XState マシン・実行ロジック）/ lib |
| `app-download` | Desktop 版入手導線・環境判定 | model / ui |

> `maze-simulation` は maze / robot / command をまたぐ実行ロジックの置き場所。`model` に XState マシンと純粋な実行ロジック（移動・衝突/落下/カギ/ゴール判定）を集約し、UI は持たない（描画は widgets/entities 側）。

### 4.5 entities

ドメインの中核オブジェクト。**相互参照しない**（→ [architecture.md](./architecture.md) 3.2）。自身の型・状態・純粋ロジックのみを持つ。

| entity | model（型・ロジック） | ui（代表） |
| --- | --- | --- |
| `maze` | `Maze` / `TileKind` 型、初期迷路生成 | `MazePreview`（2D 俯瞰）、`Maze3d`（3D） |
| `robot` | 位置・向き・階層・取得カギの状態と型 | `Robot3d`（3D・アニメーション） |
| `command` | コマンド種別、ループのネスト構造の型 | `CommandItem`（アイコン・名称） |
| `folder` | `Folder` 型の再エクスポート、フォルダ種別（予約 ID から判別）、種別ごとの権限マトリクス、サイドバー 3 セクションへの振り分け | `FolderItem`（アイコン・名前・件数・行末スロット） |

### 4.6 shared

レイヤー非依存の共通基盤。環境差（カメラ・永続化）はここに閉じ込め、上位は環境を意識しない（→ [architecture.md](./architecture.md) 7.1）。

| ディレクトリ | 責務 |
| --- | --- |
| `ui` | Radix UI + Tailwind をラップした共通部品（Button / Dialog / Overlay 等） |
| `lib` | フレームワーク非依存の汎用ユーティリティ |
| `qr` | **QR デコーダ抽象**。`qr-scanner` を内部実装とし、デコード I/F を提供 |
| `camera` | **カメラ取得抽象**。`getUserMedia` の環境差（Web / Tauri WebView）を吸収 |
| `db` | **永続化抽象**。TanStack DB のコレクション定義（モジュールレベルのシングルトン）と SQLite(WASM+OPFS) アクセス（→ [db-design.md](./db-design.md)） |
| `config` | 定数・設定値（サイズ上限・loop 回数範囲・予約フォルダ ID `UNCATEGORIZED_FOLDER_ID` / `TUTORIAL_FOLDER_ID` 等） |

> `qr` / `camera` / `db` はインターフェースを公開し、実装を差し替え可能にする。インターフェースの型定義は実装時／[db-design.md](./db-design.md) に委ねる。

---

## 5. スライス内セグメントの例

`entities/maze` を例に、セグメント構成を示す。

```
entities/maze/
├─ ui/
│  ├─ maze-preview.tsx     … 2D 俯瞰プレビュー
│  └─ maze-3d.tsx          … 3D 表示（R3F）
├─ model/
│  ├─ types.ts             … Maze / TileKind 等の型
│  └─ tile.ts              … タイル種別の定義・判定
├─ lib/
│  └─ create-initial-maze.ts … 初期迷路生成
└─ index.ts                … Public API（公開対象を明示）
```

- ロジック（`model` / `lib`）と表示（`ui`）を分離する。
- 高頻度更新（`maze-3d` / `robot-3d` のアニメーション）は `useFrame` 内で ref 直接操作とし、`setState` を避ける（→ [architecture.md](./architecture.md) 6.2）。

---

## 6. 機能 ↔ スライス対応表

[features.md](./features.md) の主な機能が、どのスライスに載るか。

| 機能（features.md） | 主なスライス |
| --- | --- |
| 迷路の CRUD・空状態（3.2/3.3） | features/maze-management、entities/maze |
| フォルダ管理・DnD（3.4） | features/folder-management、entities/folder |
| QR 共有 import/export（3.5） | features/maze-qr-management、shared/camera |
| グリッド編集・タイル・整合（4 章） | features/maze-edit、widgets/maze-editor、entities/maze |
| QR カード命令作成・ループ構築（5.3） | features/command-management、widgets/command-panel、entities/command、shared/qr |
| 実行フロー・成功/失敗判定（5.4/5.5） | features/maze-simulation、widgets/ar-stage、entities/robot |
| 3D / AR 表示（5.2/5.6） | widgets/ar-stage、entities/maze(maze-3d)、entities/robot(robot-3d)、shared/camera |
| ダウンロード（6 章） | features/app-download、pages/download |

---

## 7. 関連ドキュメント

- [architecture.md](./architecture.md) — アーキテクチャ設計（FSD 規則の正）
- [features.md](./features.md) — 機能仕様（画面別の振る舞い）
- [db-design.md](./db-design.md) — DB 設計（shared/db の詳細）
- [requirements.md](./requirements.md) — 要件定義
- [glossary.md](./glossary.md) — 用語集
- [CLAUDE.md](../CLAUDE.md) — リポジトリ運用指針（命名規約）

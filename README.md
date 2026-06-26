<div id="top"/>

![ProgPath](docs/img/header/prog-path.png)

<h1 align="center">🚀 ProgPath</h1>

<h3 align="center">小学生（高学年）向けのプログラミング教育導入アプリ</h3>

<p align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=ts,react,tailwind,threejs,vite,tauri,git,github" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/katsudon08/prog-path/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" />
  </a>
</p>

> [!NOTE]
> **本プロジェクトはゼロから全面再開発中です。** 既存実装（Next.js + Electron）は破棄予定で、要件定義を起点に to-be 設計（Vite+ / Tauri / TanStack DB ほか）へ引き直しています。ドキュメント整備を終え、実装フェーズ（開発基盤＝ツールチェーンの構築）に着手しました。確定済みの設計は [`docs/`](#ドキュメント) を参照してください。

## サービス概要

ProgPath は、小学校高学年をターゲットとしたプログラミング教育導入アプリです。物理的な QR コードカードをカメラで読み取って命令を組み立て、カメラ映像に重ねて表示される 3D ロボットを操作し、迷路のゴールを目指します。

**中心価値**

- **3D / AR 表現**: カメラ映像に 3D の迷路・ロボットを重ね、命令の結果を直感的に見せる。
- **QR カードによる命令作成**: 物理カードをカメラで読み取って命令を組み立て、複数人で手を動かせる。
- **迷路エディタ（補助）**: 迷路を作成・編集する。中心価値を支える補助的な位置づけ。

## 利用前提

- **学校の授業**での利用を想定。1 クラスに複数台の PC を用意する。
- 児童 **2〜3 人で 1 台を囲んで**使う。協調学習の基本単位はこの「2〜3 人で 1 台」グループ。
- 家庭学習・1人1台・イベント展示は主対象ではない。
- 機能・UI・成功指標は、常にこの「2〜3 人で 1 台を囲む授業」を基準に判断する。

## 主な機能

- **迷路実行（AR）**: 「前にすすむ」「右にまがる」などの QR カードをカメラにかざして命令を構築し、3D ロボットを動かす。繰り返し（ループ）にも対応。
- **迷路作成・編集**: 1〜3 階・5×5〜7×7 のグリッドでオリジナル迷路を作成する。
- **迷路の共有**: 迷路データを QR コードに変換して書き出し・読み込みできる（1 迷路 = 1 QR）。
- **管理機能**: 迷路をフォルダで分類・整理する。
- **デスクトップ版**: Tauri によるデスクトップアプリとして提供予定（Web 版と同一機能）。

> 各機能の詳細な振る舞いは [docs/features.md](docs/features.md) を参照。

## 技術スタック（to-be）

| 領域 | 採用 |
| --- | --- |
| 言語 | TypeScript |
| UI | React / Radix UI + Tailwind CSS |
| 3D / AR | Three.js（React Three Fiber） |
| QR 認識 | qr-scanner |
| 状態管理 | Zustand（複雑な遷移は XState） |
| バリデーション | Zod |
| 永続化 | TanStack DB + IndexedDB |
| デスクトップ | Tauri |
| ツールチェーン | Vite+（vp） |
| 環境管理 / パッケージ | mise / pnpm |
| アーキテクチャ | Feature-Sliced Design (FSD) |

> 技術選定の理由・システム構成は [docs/architecture.md](docs/architecture.md) を参照。

## ドキュメント

再開発の設計は `docs/` 配下に整備しています。

| ドキュメント | 内容 |
| --- | --- |
| [requirements.md](docs/requirements.md) | 要件定義（何を作るか） |
| [features.md](docs/features.md) | 機能仕様（画面別の振る舞い） |
| [architecture.md](docs/architecture.md) | アーキテクチャ設計（FSD・スタック・構成図） |
| [directory-structure.md](docs/directory-structure.md) | ディレクトリ構成 |
| [db-design.md](docs/db-design.md) | DB 設計 |
| [glossary.md](docs/glossary.md) | 用語集 |

## セットアップ

開発環境は [mise](https://mise.jdx.dev/) でランタイム（Node / pnpm）を固定し、`mise run <task>` を入口に Vite+（vp）を実行します。

### 前提

- [mise](https://mise.jdx.dev/) がインストール済みであること。

### 初回手順

```bash
mise install   # Node / pnpm を固定バージョンで導入
pnpm install   # 依存をインストール
mise run dev   # 開発サーバを起動
```

### よく使うコマンド

| コマンド | 内容 |
| --- | --- |
| `mise run dev` | 開発サーバ起動 |
| `mise run build` | 本番ビルド |
| `mise run check` | format + lint（静的検査） |
| `mise run format` | フォーマット適用 |
| `mise run test` | テスト実行 |

> 全タスクは `mise tasks` で確認できます。デスクトップ版（Tauri）のセットアップは別途整備予定です。

> ツールチェーンの方針・技術選定の理由は [docs/architecture.md](docs/architecture.md) を参照してください。

## ライセンス

[MIT License](LICENSE)

<p align="center">
    (<a href="#top">トップへ</a>)
</p>

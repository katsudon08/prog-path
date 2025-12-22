# ディレクトリ構成

```
prog-path/
├── app/                          # Next.js App Router
│   ├── globals.css               # グローバルスタイル・デザインシステム
│   ├── layout.tsx                # ルートレイアウト
│   ├── page.tsx                  # ホームページ（/）
│   ├── ar/                       # AR実行画面ルート（/ar）
│   ├── download/                 # ダウンロードページ（/download）
│   └── editor/                   # 迷路エディターページ（/editor）
│
├── components/                   # Reactコンポーネント
│   ├── ui/                       # 汎用UIコンポーネント（shadcn/ui）
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── label.tsx
│   │
│   ├── home-screen.tsx           # ホーム画面（821行）
│   ├── ar-execution-screen.tsx   # AR実行画面（1132行）
│   ├── maze-view-3d.tsx          # 3D迷路ビュー（1204行）
│   ├── maze-editor.tsx           # 迷路エディター（514行）
│   ├── command-stack.tsx         # コマンドスタック表示（411行）
│   ├── maze-preview.tsx          # 迷路プレビュー
│   ├── minimap-view.tsx          # ミニマップ表示
│   └── navbar.tsx                # ナビゲーションバー
│
├── lib/                          # ユーティリティ・型定義
│   ├── types.ts                  # 型定義（MazeData, Command, RobotStateなど）
│   ├── initial-mazes.ts          # 初期迷路データ（10個のサンプル迷路）
│   ├── maze-encoder.ts           # 迷路QRエンコード/デコード
│   └── utils.ts                  # 汎用ユーティリティ（cn関数）
│
├── public/                       # 静的ファイル
├── docs/                         # ドキュメント・画像
├── build/                        # Electronビルド用アイコン
├── dist/                         # Electron配布ファイル
├── out/                          # Next.js静的書き出し
│
├── main.js                       # Electronメインプロセス
├── package.json                  # 依存関係・スクリプト
├── tsconfig.json                 # TypeScript設定
├── next.config.ts                # Next.js設定
├── components.json               # shadcn/ui設定
├── postcss.config.mjs            # PostCSS設定
└── eslint.config.mjs             # ESLint設定
```

## ルーティング構成

| パス | ページ | コンポーネント |
|------|--------|----------------|
| `/` | ホーム | `HomeScreen` |
| `/ar` | AR実行 | `ARExecutionScreen` |
| `/editor` | 迷路エディター | `MazeEditor` |
| `/download` | ダウンロード | （専用ページ） |

## データフロー

```
localStorage
    ↓
HomeScreen (迷路一覧管理)
    ↓
┌───────────────┬──────────────────┐
↓               ↓                  ↓
MazeEditor   ARExecutionScreen   QR共有
             ↓
       ┌─────┴─────┐
       ↓           ↓
   MazeView3D   CommandStack
       ↓
   MinimapView
```

# 技術スタック

## フレームワーク・言語

| カテゴリ | 技術 | バージョン |
|----------|------|------------|
| **フレームワーク** | Next.js | ^16.0.7 |
| **言語** | TypeScript | ^5 |
| **ランタイム** | React | ^19.2.1 |

## スタイリング

| ライブラリ | バージョン | 用途 |
|------------|------------|------|
| Tailwind CSS | ^4.1.9 | ユーティリティファーストCSS |
| tailwindcss-animate | ^1.0.7 | アニメーションユーティリティ |
| tw-animate-css | ^1.3.3 | CSSアニメーション統合 |

## UIコンポーネント

| ライブラリ | バージョン | 用途 |
|------------|------------|------|
| **Radix UI** | 各種 | ヘッドレスUIプリミティブ |
| shadcn/ui | - | UIコンポーネントシステム（new-yorkスタイル） |
| Lucide React | ^0.454.0 | アイコン |
| cmdk | 1.0.4 | コマンドメニュー |

### 使用中のRadix UIコンポーネント
- accordion, alert-dialog, aspect-ratio, avatar, checkbox
- collapsible, context-menu, dialog, dropdown-menu
- hover-card, label, menubar, navigation-menu, popover
- progress, radio-group, scroll-area, select, separator
- slider, slot, switch, tabs, toast, toggle, toggle-group, tooltip

## 3D・グラフィックス

| ライブラリ | バージョン | 用途 |
|------------|------------|------|
| Three.js | ^0.180.0 | 3Dレンダリングエンジン |
| @react-three/fiber | ^9.4.0 | React用Three.jsバインディング |
| @react-three/drei | ^10.7.6 | React Three Fiberヘルパー |

## QRコード処理

| ライブラリ | バージョン | 用途 |
|------------|------------|------|
| jsQR | ^1.4.0 | QRコード読み取り |
| qrcode.react | ^4.2.0 | QRコード生成（React） |

## デスクトップアプリ

| ライブラリ | バージョン | 用途 |
|------------|------------|------|
| Electron | ^39.2.3 | デスクトップアプリフレームワーク |
| electron-builder | ^26.0.12 | パッケージング |
| electron-serve | ^3.0.0 | 静的ファイル配信 |

## ユーティリティ

| ライブラリ | バージョン | 用途 |
|------------|------------|------|
| class-variance-authority | ^0.7.1 | 条件付きCSSクラス管理 |
| clsx | ^2.1.1 | クラス名結合 |
| tailwind-merge | ^3.3.1 | Tailwindクラスマージ |
| zod | 3.25.76 | スキーマバリデーション |
| react-hook-form | ^7.60.0 | フォーム管理 |
| date-fns | 4.1.0 | 日付操作 |
| sonner | ^1.7.4 | トースト通知 |

## デプロイ・分析

| サービス | 用途 |
|----------|------|
| Vercel | Webホスティング |
| @vercel/analytics | アクセス分析 |

## 開発ツール

| ツール | バージョン | 用途 |
|--------|------------|------|
| PostCSS | ^8.5 | CSSトランスパイル |
| @tailwindcss/postcss | ^4.1.9 | Tailwind CSS処理 |
| concurrently | ^9.2.1 | 並列コマンド実行 |
| wait-on | ^9.0.3 | プロセス待機 |

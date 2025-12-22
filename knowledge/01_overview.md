# prog-path アプリケーション概要（エンジニア向け）

## プロジェクト概要

**prog-path** は、Next.js 16 + React 19 + TypeScript で構築された、プログラミング教育向けのインタラクティブWebアプリケーションです。

| 項目 | 内容 |
|------|------|
| **リポジトリ名** | prog-path |
| **バージョン** | 0.1.0 |
| **作者** | katsudon08 |
| **本番URL** | https://prog-path.vercel.app/ |
| **ライセンス** | private |

---

## アーキテクチャ概要

### ランタイム構成

```
┌─────────────────────────────────────────────────────────────┐
│                        ユーザー                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Web版: Vercel (SSG)  │  デスクトップ版: Electron           │
│  静的ホスティング      │  electron-serve による静的配信       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js App Router                         │
│  ・静的書き出し (output: 'export')                           │
│  ・クライアントサイドレンダリング                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      localStorage                            │
│  ・迷路データの永続化                                         │
│  ・バックエンドサーバーなし（完全オフライン動作）               │
└─────────────────────────────────────────────────────────────┘
```

### 技術選定のポイント

| 選定項目 | 技術 | 選定理由 |
|----------|------|----------|
| **フレームワーク** | Next.js (SSG) | 静的書き出しでElectronと互換性を持たせる |
| **3D描画** | Three.js + React Three Fiber | React統合の3Dレンダリング |
| **カメラ/QR** | jsQR + getUserMedia API | ブラウザ標準APIでカメラアクセス |
| **データ永続化** | localStorage | サーバーレス、オフライン対応 |
| **デスクトップ配布** | Electron + electron-builder | クロスプラットフォーム対応 |

---

## アプリケーションフロー

### 迷路プレイのフロー

```
1. ホーム画面でプレイする迷路を選択
   ↓
2. ARExecutionScreen に遷移（URLパラメータで迷路IDを渡す）
   ↓
3. localStorageから迷路データを読み込み
   ↓
4. Webカメラを起動してQRコードスキャンループを開始
   ↓
5. QRコード検出 → コマンド追加（forward, turnRight, turnLeft, loop, ifHole）
   ↓
6. 実行ボタン押下 → コマンドを順次実行
   ↓
7. ロボットの状態（x, y, z, direction）を更新
   ↓
8. Three.jsでロボットモデルをアニメーション
   ↓
9. ゴール到達で成功 / 壁衝突・穴落下で失敗
```

### データの流れ

```
[初期データ]                    [ユーザーデータ]
lib/initial-mazes.ts     ←統合→   localStorage('mazes')
        │
        ▼
    HomeScreen
        │
    ┌───┴───┬──────────────┐
    ▼       ▼              ▼
MazeEditor  ARExecutionScreen  QR共有/読み込み
    │       │
    │       ├→ MazeView3D (Three.js Canvas)
    │       ├→ CommandStack (コマンド表示)
    │       └→ MinimapView (2D俯瞰)
    │
    └→ localStorage 保存
```

---

## 主要機能の技術実装

### 1. QRコードスキャン

```typescript
// jsQRを使用したQRコード読み取り
const scanLoop = () => {
    ctx.drawImage(video, ...);
    const imageData = ctx.getImageData(...);
    const code = jsQR(imageData.data, width, height);
    if (code) {
        // コマンドQR: "forward", "turnRight" など
        // 迷路QR: "maze:<Base64>"
    }
    requestAnimationFrame(scanLoop);
};
```

### 2. 3Dレンダリング

- **Canvas**: `@react-three/fiber` の `<Canvas>` コンポーネント
- **ロボット**: GLTFモデル (`useGLTF` でロード)
- **アニメーション**: `useFrame` フックで毎フレーム更新
- **カメラ映像**: `<Html>` コンポーネントで3D空間内にDOM要素を配置

### 3. コマンド実行エンジン

```typescript
// コマンドの平坦化（ループを展開）
flattenCommands(commands: Command[]): Command[]

// 非同期コマンド実行
executeCommand = async () => {
    switch (command.type) {
        case 'forward': // 1マス前進
        case 'turnRight': // 90度右回転
        case 'turnLeft': // 90度左回転
        case 'ifHole': // 穴があれば埋める
    }
    // アニメーション完了を待機してから次のコマンドへ
};
```

### 4. 迷路エンコード/デコード

```typescript
// 迷路データ → QRコード文字列
encodeMazeToQR(maze: MazeData): string
// → "maze:" + Base64(JSON.stringify(maze))

// QRコード文字列 → 迷路データ
decodeMazeFromQR(qrData: string): MazeData | null
```

---

## 状態管理

### React Hooks ベース（状態管理ライブラリなし）

| コンポーネント | 主な状態 |
|----------------|----------|
| `HomeScreen` | `mazes`, `selectedMaze`, `expandedCategories`, `isScanning` |
| `ARExecutionScreen` | `commands`, `robotState`, `isExecuting`, `currentCommandIndex` |
| `MazeEditor` | `layers`, `currentLayer`, `selectedTile`, `mazeName` |

### データの永続化

```typescript
// 保存
localStorage.setItem('mazes', JSON.stringify(mazes));

// 読み込み
const saved = localStorage.getItem('mazes');
const mazes = saved ? JSON.parse(saved) : getInitialMazes();
```

---

## ビルド・デプロイ

### Web版（Vercel）
1. `npm run build` → `out/` に静的ファイル生成
2. Vercelが自動デプロイ

### デスクトップ版（Electron）
1. `npm run electron:build`
2. `dist/` に各プラットフォーム用インストーラー生成
   - Windows: `.exe` (NSIS)
   - macOS: `.dmg`
   - Linux: `.AppImage`

---

## 既知の技術的課題（READMEより）

1. **パフォーマンス**: 小学校の実機で動作が重い
2. **QRコードサイズ**: 迷路データのエンコードサイズが大きい
3. **コード品質**: 保守性向上のためのリファクタリングが必要

---

## 開発に際しての注意点

| 項目 | 注意点 |
|------|--------|
| **SSG制約** | `output: 'export'` のため、サーバーサイド機能（API Routes等）は使用不可 |
| **カメラ権限** | HTTPS環境でのみ `getUserMedia` が動作 |
| **ブラウザ互換** | WebGL対応ブラウザが必須 |
| **データ移行** | `migrateMazeData` 関数で旧フォーマットからの移行処理あり |

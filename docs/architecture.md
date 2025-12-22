# Feature-Sliced Design (FSD) アーキテクチャ

このドキュメントでは、prog-path プロジェクトで採用している Feature-Sliced Design (FSD) アーキテクチャについて解説します。

## 概要

FSDは、フロントエンドアプリケーションを「層」と「スライス」に分割するアーキテクチャ設計手法です。各層には明確な責務があり、一方向の依存関係によって高いモジュール性と保守性を実現します。

## ディレクトリ構成

```
prog-path/
├── app/           # [Next.js] ルーティング層
├── widgets/       # [Composition] UI統合層
├── features/      # [User Actions] ビジネスロジック層
├── entities/      # [Business Domain] ドメインモデル層
├── shared/        # [General Purpose] 共有資産層
└── components/    # [Legacy] 旧コンポーネント（段階的移行中）
```

## 層の責務

### App 層 (`app/`)

```
app/
├── layout.tsx        # ルートレイアウト
├── page.tsx          # ホームページ → HomePortalWidget
├── ar/page.tsx       # AR実行ページ → ARExecutionWidget
├── editor/page.tsx   # 迷路エディター → MazeEditorWidget
└── download/page.tsx # ダウンロードページ
```

**責務**: Next.js App Routerのルーティング定義のみ。ビジネスロジックを持たない。

### Widgets 層 (`widgets/`)

```
widgets/
├── maze-editor/     # 迷路編集画面
├── ar-execution/    # AR実行画面
└── home-portal/     # ホーム画面
```

**責務**: 複数のFeaturesを統合し、画面単位のUIを構成。レイアウトとコンポジションに専念。

### Features 層 (`features/`)

```
features/
├── maze-grid-editing/   # グリッド編集操作
├── maze-serialization/  # QRコードエンコード/デコード
├── maze-storage/        # LocalStorage永続化
└── command-processing/  # コマンド実行ロジック
```

**責務**: ユーザーの目的を達成するためのビジネスロジック。各Featureは独立して動作。

### Entities 層 (`entities/`)

```
entities/
├── maze/
│   ├── model/
│   │   ├── types.ts      # MazeData, TileType
│   │   ├── store.ts      # Zustand store
│   │   └── validator.ts  # バリデーション
│   └── index.ts
└── robot/
    ├── model/
    │   ├── types.ts      # RobotState, Command
    │   └── position.ts   # 座標計算
    └── index.ts
```

**責務**: ビジネスドメインのデータ構造と純粋なロジック。UIに依存しない。

### Shared 層 (`shared/`)

```
shared/
├── ui/        # shadcn/ui コンポーネント
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   └── label.tsx
└── lib/
    └── utils.ts  # cn関数など
```

**責務**: プロジェクトに依存しない汎用的な資産。どの層からも参照可能。

---

## 依存関係ルール

```
app → widgets → features → entities → shared
```

**重要**: 下の層が上の層をインポートすることは禁止。

### ✅ 正しいインポート

```typescript
// widgets/maze-editor から features をインポート
import { useMazeEdit } from "@features/maze-grid-editing"

// features/maze-storage から entities をインポート
import type { MazeData } from "@entities/maze"

// entities/maze から shared をインポート
import { cn } from "@shared/lib/utils"
```

### ❌ 禁止されるインポート

```typescript
// ❌ entities から features をインポート（上方向への依存）
import { loadMazesFromStorage } from "@features/maze-storage"

// ❌ features 間のクロスインポート
import { encodeMazeToQR } from "@features/maze-serialization"
// ↑ 共通化が必要な場合は entities に移動
```

---

## パスエイリアス

`tsconfig.json` で以下のエイリアスが設定されています：

| エイリアス | パス |
|---|---|
| `@/*` | `./` |
| `@shared/*` | `./shared/*` |
| `@entities/*` | `./entities/*` |
| `@features/*` | `./features/*` |
| `@widgets/*` | `./widgets/*` |

---

## 新機能追加ガイドライン

### 1. 新しいデータ型を追加する場合

`entities/` に追加します。

```
entities/
└── new-entity/
    ├── model/
    │   └── types.ts
    └── index.ts
```

### 2. 新しいユーザー操作を追加する場合

`features/` に追加します。

```
features/
└── new-feature/
    ├── model/
    │   └── useNewFeature.ts
    ├── lib/
    │   └── new-logic.ts
    └── index.ts
```

### 3. 新しい画面を追加する場合

1. `widgets/` に Widget を作成
2. `app/` にルーティングを追加

---

## 状態管理

Zustand を使用してグローバル状態を管理しています。

### 迷路ストア (`entities/maze/model/store.ts`)

```typescript
import { useMazeStore } from "@entities/maze"

// 使用例
const mazes = useMazeStore((state) => state.mazes)
const addMaze = useMazeStore((state) => state.addMaze)
```

---

## テスト戦略

| 層 | テストタイプ | 優先度 |
|---|---|---|
| Entities | Unit | **最高** |
| Features | Integration | 高 |
| Widgets | Integration/VRT | 中 |
| App | E2E | 低 |

テストファイルの配置：

```
entities/maze/model/__tests__/
├── validator.test.ts
└── store.test.ts
```

---

## 参考リンク

- [Feature-Sliced Design 公式](https://feature-sliced.design/)
- [Zustand ドキュメント](https://docs.pmnd.rs/zustand/getting-started/introduction)

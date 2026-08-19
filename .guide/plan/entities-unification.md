# Entities Layer Unification & Optimization Plan

## 目的
`entities`層の統合と最適化を行い、FSDの実践を強化する。具体的には、`maze-2d`と`maze-3d`を統合し、データモデルの一元化とUIコンポーネントの整理を行う。

## 設計変更点
1.  **スライスの統合**: `maze-2d` + `maze-3d` -> `entities/maze`
    *   2Dと3Dは同じ「迷路」データに対する異なるビューであるため、同一スライスにまとめるのがFSD的に適切（凝集度の向上）。
2.  **Modelの一本化**: 単一の `MazeData`, `TileType` 定義とストア
    *   データの不整合を防ぎ、管理を容易にする。
3.  **UIのフラット化**: ファイル名で識別 (`MazePreview2D`, `MazeMap3D` etc)
    *   `ui` ディレクトリ内をシンプルに保つ。
4.  **Shared層の活用**: `_src/shared/lib/storage` を導入
    *   LocalStorage操作などの共通ロジックをshared層に切り出し、DRY原則を徹底する。

## ディレクトリ構成（新）

```
_src/
├── shared/
│   └── lib/
│       └── storage.ts      ← [NEW] 汎用LocalStorageラッパー
└── entities/
    ├── maze/               ← [NEW] maze-2d/3dを統合
    │   ├── index.ts        ← 境界（公開API）
    │   ├── model/
    │   │   ├── types.ts    ← 統合された型定義
    │   │   └── store.ts    ← 統合されたストア
    │   ├── lib/
    │   │   ├── storage.ts  ← shared/lib/storageを使用（ドメインキー管理）
    │   │   ├── validator.ts
    │   │   ├── find-start.ts
    │   │   ├── tile-colors.ts
    │   │   └── tile-icons.tsx
    │   └── ui/             ← フラット構造（2D/3Dをファイル名で区別）
    │       ├── MazeCard.tsx
    │       ├── MazePreview2D.tsx    ← (旧: maze-2d/MazePreview)
    │       ├── MazeTile2D.tsx       ← (旧: maze-2d/Tile)
    │       ├── MazeMap3D.tsx        ← (旧: maze-3d/MazeMap)
    │       ├── MazeStartTile3D.tsx  ← (旧: maze-3d/StartTile)
    │       ├── MazeGoalTile3D.tsx   ← (旧: maze-3d/GoalTile)
    │       ├── MazeHoleTile3D.tsx
    │       ├── MazeTeleportTile3D.tsx
    │       └── MazeKeyTile3D.tsx
    ├── command/ ...
    ├── robot/ ...
    └── folder/ ...
```

## 実装ステップ

1.  **Shared層の実装**: `_src/shared/lib/storage.ts` の作成。
2.  **entities/maze の作成**: ディレクトリ構造の作成。
3.  **Modelの統合**: `maze-2d`と`maze-3d`の型定義を統合。
4.  **Libの移行**: 既存ロジックを移行・修正。
5.  **UIの移行・リネーム**: コンポーネントファイルの移動とリネーム。
6.  **API境界の定義**: `index.ts` の作成。
7.  **旧ディレクトリの削除**: `maze-2d`, `maze-3d` を削除。
8.  **動作確認**: 型チェックとビルド確認。

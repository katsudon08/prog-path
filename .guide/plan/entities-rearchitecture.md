# FSD Entities層 再構築計画（Strict版）

## 目標
`architecture.md` に基づき、StrictなFSD原則に従って `entities` レイヤーを再構築します。
**型定義は各Entitiesスライス内に閉じ込め**、スライス間の連携やロジックの組み合わせは **Features層** で行います。
また、各スライスのディレクトリ構成は指定されたセグメント（`ui`, `model`, `lib`）のみを使用します。

## アーキテクチャガイドライン
- **クロスインポートの完全排除**: `entities` 内のスライス同士は一切依存しない。
- **型の局所化**: 共有型を作らず、各スライスが必要な定義を持つ。
- **ロジックの分離**: `Robot` が `Maze` の情報を必要とするような処理は、両者を知る上位レイヤー（Features）に委譲する。
- **セグメント構成**: `ui`, `model`, `lib` のみを使用する。

## 1. Entities レイヤー構成詳細

### 1.1 entities/maze-2d
**ロジック** と **2D表現** にフォーカス。

- **model/**
  - `types.ts`: `MazeData`, `TileType` (2D用) 定義
  - `store.ts`: `useMazeStore` (迷路リスト管理)
- **lib/**
  - `validator.ts`: 迷路データのバリデーション
  - `find-start.ts`: スタート位置探索
  - `storage.ts`: LocalStorageI/O
- **ui/**
  - `MazePreview.tsx`: 2Dプレビューコンポーネント
  - `MazeCard.tsx`: 迷路カードコンポーネント

### 1.2 entities/maze-3d
**3D表現** コンポーネントにフォーカス。

- **model/**
  - `types.ts`: `TileType` (3D表示用) 定義
  - `constants.ts`: 必要であれば定義
- **ui/**
  - `MazeMap.tsx`: 3D迷路コンテナ。`TileType[][]` 等を受け取る（`MazeData`依存なし）。
  - `StartTile.tsx`, `GoalTile.tsx`, `HoleTile.tsx`, `TeleportTile.tsx`, `KeyTile.tsx`: 各タイルコンポーネント

### 1.3 entities/command
**コマンドエンティティ**。

- **model/**
  - `types.ts`: `Command`, `CommandType` 定義
- **ui/**
  - (必要に応じてアイコン等)
- **lib/**
  - (コマンド関連ヘルパー等)

### 1.4 entities/robot
**ロボットエンティティ**。

- **model/**
  - `types.ts`: `RobotState`, `DirectionVector`, `RobotAnimationState` 定義
- **lib/**
  - `position.ts`: 純粋な座標計算ロジック（`MazeData` 依存なし）
- **ui/**
  - `RobotModel.tsx`: ロボット3D表示 & アニメーション。
  - **変更**: `maze` Propsを削除し、`currentTileType` や `isFalling` などのプリミティブな情報を受け取る設計に変更。

### 1.5 entities/folder
**フォルダ/カテゴリ管理**。

- **model/**
  - `types.ts`: Folder/Category関連型定義
  - `store.ts`: `useCategoryStore`
- **lib/**
  - `storage.ts`: カテゴリストレージロジック

## 2. 実装への影響とFeatures層
Entitiesの独立性を高めるため、以下のロジックは **Features層** (`features/ar-execution`, `features/maze-editor` 等) で実装する必要があります。

- **衝突判定**: 「ロボットの次の位置が壁か？」という判定（MazeとRobotの両方の情報が必要なため）。
- **3Dシーン構築**: `MazeMap` (maze-3d) と `RobotModel` (robot) を同じCanvas内に配置し、状態を同期させる責務。

## 3. 次のステップ
ユーザーの指示に基づき、現段階では計画の策定のみを行います。
実装フェーズでは、上記構成に従ってファイルを配置・移動させてください。

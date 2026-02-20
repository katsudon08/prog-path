# データ基盤の構築（Issue #86）実装計画

`design.md` のドメイン要件と `directory.md` のFSD設計に基づき、アプリケーション全体のデータ基盤を構築する。

## 決定事項

| 項目 | 決定 |
|---|---|
| IndexedDB ラッパー | **Dexie.js** |
| ID 生成方式 | **crypto.randomUUID()** |
| ソート基準 | **createdAt**（将来的にソート切替機能を追加） |
| テストフレームワーク | **Vitest** |
| テスト戦略 | **Testing Trophy** |
| 開発方式 | **TDD**（Red → Green → Refactor） |

## TODO

- [ ] テスト環境の構築（Vitest + fake-indexeddb）
- [ ] 迷路（maze）エンティティの型定義・定数（`entities/maze/model/`）
- [ ] フォルダ（folder）エンティティの型定義（`entities/folder/model/`）
- [ ] バリデーションのテストコード実装（Red）
- [ ] バリデーション関数の実装（Green）
- [ ] Dexie.js DBセットアップ（`shared/api/db.ts`）
- [ ] リポジトリのテストコード実装（Red）
- [ ] リポジトリ関数の実装（Green）
- [ ] ビルド・Lint通過の確認

## Proposed Changes

### 0. テスト環境の構築

```bash
npm install -D vitest fake-indexeddb
```

- **Vitest**: テストランナー
- **fake-indexeddb**: Node.js 上で IndexedDB API をインメモリでエミュレート

### 1. shared レイヤー（データアクセス層）

`shared/api/` に Dexie.js を用いた IndexedDB のセットアップとCRUD操作関数を実装する。

#### [NEW] `src/shared/api/db.ts`
- Dexie.js によるデータベース初期化（DB名: `progpath_db`）
- テーブル: `mazes`（keyPath: `id`, index: `folderId`）、`folders`（keyPath: `id`）

#### [NEW] `src/shared/api/maze-repository.ts`
- `getAllMazes()` / `getMazeById(id)` / `createMaze(maze)` / `updateMaze(maze)` / `deleteMaze(id)` / `getMazesByFolderId(folderId)`

#### [NEW] `src/shared/api/folder-repository.ts`
- `getAllFolders()` / `createFolder(folder)` / `updateFolder(folder)` / `deleteFolder(id)`

#### [MODIFY] `src/shared/api/index.ts`
- Public API バレルファイル

### 2. entities/maze（迷路エンティティ）

#### [NEW] `src/entities/maze/model/types.ts`
- `TileType`（8種）、`MazeLayer`（`TileType[][]`）、`Maze`

#### [NEW] `src/entities/maze/model/constants.ts`
- タイル種別定数、サイズ・階数の制約値、デフォルト値

#### [NEW] `src/entities/maze/model/validation.ts`

即時バリデーション（引数は全て `layers: MazeLayer[]`）:
- `validateUniqueStartGoal(layers)` — スタート/ゴール各1つ以下
- `validateTeleportFloor(layers)` — 階層外テレポートがないか
- `validateTeleportTarget(layers)` — テレポート先に壁・穴・テレポートがないか

保存時バリデーション:
- `validateMazeForSave(maze)`:
  - スタート/ゴール各1つ存在
  - テレポート整合性（隣接階層間に双方向テレポートの組が最低1つ）
  - 到達可能性（BFS/DFS、テレポート考慮）

### 3. entities/folder（フォルダエンティティ）

#### [NEW] `src/entities/folder/model/types.ts`
- `Folder` — `{ id, name, createdAt, updatedAt }`
- 開閉状態はUIの関心事のため型に含めない

## Verification Plan

### テスト分類（Testing Trophy）

| 層 | 対象 | テスト方法 |
|---|---|---|
| Static | 全コード | TypeScript + ESLint |
| Unit | バリデーション関数 | 純粋関数の入出力テスト |
| Integration | リポジトリ関数 | Dexie + fake-indexeddb |

### コマンド
```bash
npx vitest run
npm run build
npm run lint
```

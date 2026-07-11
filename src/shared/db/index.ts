/**
 * Public API — `shared/db`
 *
 * 永続化抽象。迷路・フォルダの Zod スキーマ（単一の正）と、SQLite(WASM+OPFS) バックの
 * TanStack DB コレクション（モジュールシングルトン）、起動時の初期データ保証・不正データ復旧を担う
 * （→ docs/db-design.md）。
 *
 * 他スライスからの import はこの index.ts 経由のみ。`export * from` は使わず
 * 公開対象を個別に明示する（→ docs/directory-structure.md 2.2）。
 */

// スキーマ・型・定数（entities/maze(#182)・entities/folder(#192) が再利用する単一の正）
export { TILE_KIND, TileKindSchema, FolderSchema, MazeSchema } from "./model/schema";
export type { TileKind, Folder, Maze } from "./model/schema";

// コレクションと初期化（アプリ起動時に initDb() を呼び、UI は useLiveQuery で購読）
export { initDb, ensureInitialData } from "./model/bootstrap";
export type { AppDatabase, FolderCollection, MazeCollection } from "./model/collections";
export { DB_NAME, SCHEMA_VERSION } from "./model/persistence";

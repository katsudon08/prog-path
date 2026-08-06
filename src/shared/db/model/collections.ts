import { persistedCollectionOptions } from "@tanstack/browser-db-sqlite-persistence";
import type { PersistedCollectionPersistence } from "@tanstack/browser-db-sqlite-persistence";
import { createCollection } from "@tanstack/react-db";
import type { Collection } from "@tanstack/react-db";

import { createPersistence, SCHEMA_VERSION } from "./persistence";
import type { Folder, Maze } from "./schema";

// NOTE: `persistedCollectionOptions` は Zod スキーマ（collection の `schema` フック）を
// 受け取らず、行の型を `<T, TKey>` で与える設計（→ 公式 quick start）。
// そのため Zod 検証は「起動時の復旧掃引（bootstrap）」と「書き込み境界（entities/features）」で
// 明示的に行い、スキーマの正は `shared/db`（→ model/schema.ts）に置く。

/** フォルダコレクション（SQLite 永続・モジュールシングルトン）。 */
export type FolderCollection = Collection<Folder, string>;
/** 迷路コレクション（SQLite 永続・モジュールシングルトン）。 */
export type MazeCollection = Collection<Maze, string>;

const buildFolderCollection = (persistence: PersistedCollectionPersistence): FolderCollection =>
  createCollection(
    persistedCollectionOptions<Folder, string>({
      id: "folders",
      getKey: (folder: Folder) => folder.id,
      persistence,
      schemaVersion: SCHEMA_VERSION,
    }),
  );

const buildMazeCollection = (persistence: PersistedCollectionPersistence): MazeCollection =>
  createCollection(
    persistedCollectionOptions<Maze, string>({
      id: "mazes",
      getKey: (maze: Maze) => maze.id,
      persistence,
      schemaVersion: SCHEMA_VERSION,
    }),
  );

/** 永続化コレクション一式。UI は `useLiveQuery` でこれらを直接購読する。 */
export interface AppDatabase {
  readonly folderCollection: FolderCollection;
  readonly mazeCollection: MazeCollection;
}

/**
 * 迷路・フォルダのコレクションを生成する。OPFS DB を開いてから両コレクションを作るため
 * 非同期。ブラウザ実行時のみ呼べる（→ {@link createPersistence}）。
 *
 * @param persistence 差し替え用の永続化。省略時は OPFS 上の DB を開く（＝本番の経路）。
 *   統合テストが `node:sqlite` バックの persistence を渡すための seam
 *   （→ `bootstrap.integration.test.ts`）。コレクション ID・`getKey`・`schemaVersion` は
 *   差し替えられないので、テストも本番と同じ設定で動く。
 */
export const createCollections = async (
  persistence?: PersistedCollectionPersistence,
): Promise<AppDatabase> => {
  const resolved = persistence ?? (await createPersistence());
  return {
    folderCollection: buildFolderCollection(resolved),
    mazeCollection: buildMazeCollection(resolved),
  };
};

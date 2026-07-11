import {
  createBrowserWASQLitePersistence,
  openBrowserWASQLiteOPFSDatabase,
} from "@tanstack/browser-db-sqlite-persistence";
import type { PersistedCollectionPersistence } from "@tanstack/browser-db-sqlite-persistence";

/** OPFS 上の SQLite データベース名（→ docs/db-design.md 6）。 */
export const DB_NAME = "prog-path";

/**
 * 永続化スキーマのバージョン。破壊的なスキーマ変更時に増やすとローカルコピーが更新される
 * （`persistedCollectionOptions` の `schemaVersion`。→ docs/db-design.md 6）。
 */
export const SCHEMA_VERSION = 1;

/**
 * OPFS バックの SQLite データベースを開き、コレクション間で共有する persistence を生成する。
 *
 * OPFS（OPFSCoopSyncVFS）はブラウザ／WebView の Worker 環境に依存するため、この関数は
 * ブラウザ実行時のみ呼べる（node のユニットテストからは呼ばない）。Tauri WebView での
 * OPFS 挙動はスパイクで検証する（→ docs/db-design.md 6 / #179）。
 */
export const createPersistence = async (): Promise<PersistedCollectionPersistence> => {
  const database = await openBrowserWASQLiteOPFSDatabase({ databaseName: DB_NAME });
  return createBrowserWASQLitePersistence({ database });
};

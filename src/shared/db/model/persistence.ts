import {
  createBrowserWASQLitePersistence,
  openBrowserWASQLiteOPFSDatabase,
} from "@tanstack/browser-db-sqlite-persistence";
import type {
  BrowserWASQLiteDatabase,
  PersistedCollectionPersistence,
} from "@tanstack/browser-db-sqlite-persistence";

/** OPFS 上の SQLite データベース名（→ docs/db-design.md 6）。 */
export const DB_NAME = "prog-path";

/**
 * 永続化スキーマのバージョン（`persistedCollectionOptions` の `schemaVersion`。→ docs/db-design.md 6）。
 *
 * 増やすと、保存済みバージョンと食い違う端末では**ローカルの迷路・フォルダが全て破棄され、
 * 空の状態で作り直される**（folders / mazes が本定数を共有しているのでどちらも消える）。
 * 起動時の `ensureInitialData` で未分類・チュートリアルは復帰するが、ユーザーが作った迷路は
 * 戻らない。この「消して作り直す」挙動は {@link createPersistence} が
 * `schemaMismatchPolicy: "reset"` を明示していて初めて成立する（既定のままだと壊れる。理由は同関数）。
 *
 * 判定は単純な不一致（`!==`）なので、**バージョンを戻したとき（リリース差し戻し）も同様に破棄される**。
 *
 * **フィールドを削除するだけなら増やさなくてよい。** Zod の `z.object` は未知キーを黙って剥がすため、
 * 保存済み行に残った旧フィールドはそのまま検証を通り、起動時の掃引でも消えない。
 * `Folder.isDefault` の廃止（#192）はこれに該当するので据え置いた
 * （この前提は `schema.test.ts` / `bootstrap.test.ts` の移行テストが固定している）。
 */
export const SCHEMA_VERSION = 1;

/**
 * OPFS バックの SQLite データベースを開き、コレクション間で共有する persistence を生成する。
 *
 * OPFS（OPFSCoopSyncVFS）はブラウザ／WebView の Worker 環境に依存するため、この関数は
 * ブラウザ実行時のみ呼べる（node のユニットテストからは呼ばない）。Tauri WebView での
 * OPFS 挙動はスパイクで検証する（→ docs/db-design.md 6 / #179）。
 *
 * **`schemaMismatchPolicy: "reset"` は必須。外すと {@link SCHEMA_VERSION} の変更が
 * 「作り直し」ではなく「無言の全断」になる。**
 * 本アプリは sync を渡さないローカル専用構成なので、省略すると
 * `resolveSchemaMismatchPolicy(undefined, "sync-absent")` が `sync-absent-error` を返す。
 * この既定ではアダプタがテーブルを消さず `InvalidPersistedCollectionConfigError` を throw し、
 * さらにその例外を loopback sync が `console.warn` だけして ready 扱いにするため、
 * **エラー画面も出ないまま全件 0 件に見え、以後の書き込みが静かに全て失敗し続ける**
 * （リロードしても直らず、アプリ内に復旧手段が無い）。#192 のレビューで両方の挙動を実機再現して確認した。
 *
 * @param database 差し替え用の SQLite ドライバ。省略時は OPFS を開く（＝本番の経路）。
 *   node には OPFS が無いため、統合テストはここに `node:sqlite` バックのドライバを渡す。
 *   **ドライバだけを差し替え、`schemaMismatchPolicy` は本番と同じものを通す**ための seam。
 */
export const createPersistence = async (
  database?: BrowserWASQLiteDatabase,
): Promise<PersistedCollectionPersistence> => {
  const resolved = database ?? (await openBrowserWASQLiteOPFSDatabase({ databaseName: DB_NAME }));
  return createBrowserWASQLitePersistence({
    database: resolved,
    schemaMismatchPolicy: "reset",
  });
};

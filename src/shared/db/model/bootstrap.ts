import { buildUncategorizedFolder, hasUncategorizedFolder, partitionValid } from "../lib/recovery";
import type { Validatable } from "../lib/recovery";
import { createCollections } from "./collections";
import type { AppDatabase } from "./collections";
import { FolderSchema, MazeSchema } from "./schema";
import type { Folder } from "./schema";

/** コレクションの読み書き最小インターフェース（テスト時に差し替え可能なよう構造的に受ける）。 */
interface PurgeableCollection {
  toArrayWhenReady: () => Promise<ReadonlyArray<unknown>>;
  delete: (key: string) => unknown;
}

/** レコードから文字列 `id` を安全に取り出す（無ければ null）。 */
const extractId = (row: unknown): string | null => {
  if (typeof row === "object" && row !== null && "id" in row) {
    const { id } = row as { id: unknown };
    if (typeof id === "string") {
      return id;
    }
  }
  return null;
};

/**
 * コレクションの現在レコードをスキーマ検証し、不正なものを破棄する（→ docs/db-design.md 7）。
 * key を特定できる（`id` を持つ）不正レコードのみ削除する。
 */
const purgeInvalid = async <T>(
  collection: PurgeableCollection,
  schema: Validatable<T>,
): Promise<void> => {
  const rows = await collection.toArrayWhenReady();
  const { invalid } = partitionValid(rows, schema);
  for (const row of invalid) {
    const id = extractId(row);
    if (id !== null) {
      collection.delete(id);
    }
  }
};

/**
 * 起動時の初期データ保証・不正データ復旧を行う。
 * 1. 不正レコードを破棄（迷路・フォルダ）
 * 2. 未分類フォルダ（予約 ID）の存在を保証（無ければ再生成）
 *
 * 迷路 0 件は正常状態として扱い、サンプル迷路の自動投入はしない（→ docs/db-design.md 7）。
 */
export const ensureInitialData = async (db: AppDatabase): Promise<void> => {
  await purgeInvalid(db.folderCollection, FolderSchema);
  await purgeInvalid(db.mazeCollection, MazeSchema);

  const folders: ReadonlyArray<Folder> = await db.folderCollection.toArrayWhenReady();
  if (!hasUncategorizedFolder(folders)) {
    db.folderCollection.insert(buildUncategorizedFolder());
  }
};

let databasePromise: Promise<AppDatabase> | null = null;

/**
 * 迷路・フォルダの永続化 DB を初期化して返す（コレクション生成＋初期データ保証）。
 * 冪等: 2 回目以降は同じ Promise を返し、コレクションはモジュールシングルトンになる。
 * ブラウザ実行時のみ呼べる（OPFS 依存。→ {@link createCollections}）。
 */
export const initDb = (): Promise<AppDatabase> => {
  databasePromise ??= createCollections().then(async (db) => {
    await ensureInitialData(db);
    return db;
  });
  return databasePromise;
};

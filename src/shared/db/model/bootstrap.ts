import { TUTORIAL_FOLDER_ID } from "@/shared/config";

import { buildUncategorizedFolder, hasUncategorizedFolder, partitionValid } from "../lib/recovery";
import type { Validatable } from "../lib/recovery";
import { buildTutorialFolder, buildTutorialMazes } from "../lib/tutorial-seed";
import { createCollections } from "./collections";
import type { AppDatabase } from "./collections";
import { FolderSchema, MazeSchema } from "./schema";
import type { Folder, Maze } from "./schema";

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
 * チュートリアル（専用フォルダ＋教材迷路）の存在を保証する。
 * 予約固定 ID を持ち削除不可の扱い（強制は UI 側）のため、未分類フォルダと同じ発想で
 * 「無ければ作る／欠損 ID の迷路だけ補う」。既存レコードは上書きしない（編集は保持）。
 * → docs/db-design.md 7。
 */
const ensureTutorialContent = async (db: AppDatabase): Promise<void> => {
  const folders: ReadonlyArray<Folder> = await db.folderCollection.toArrayWhenReady();
  if (!folders.some((folder) => folder.id === TUTORIAL_FOLDER_ID)) {
    db.folderCollection.insert(buildTutorialFolder());
  }

  const mazes: ReadonlyArray<Maze> = await db.mazeCollection.toArrayWhenReady();
  const existingIds = new Set(mazes.map((maze) => maze.id));
  for (const maze of buildTutorialMazes()) {
    if (!existingIds.has(maze.id)) {
      db.mazeCollection.insert(maze);
    }
  }
};

/**
 * 起動時の初期データ保証・不正データ復旧を行う。
 * 1. 不正レコードを破棄（迷路・フォルダ）
 * 2. 未分類フォルダ（予約 ID）の存在を保証（無ければ再生成）
 * 3. チュートリアル（専用フォルダ＋教材迷路）を予約 ID で常に保証（無ければ作る／欠損分を補う）
 *
 * 迷路 0 件は正常状態だが、チュートリアル迷路は常に存在保証されるため実質 0 件にはならない
 * （→ docs/db-design.md 7）。
 */
export const ensureInitialData = async (db: AppDatabase): Promise<void> => {
  await purgeInvalid(db.folderCollection, FolderSchema);
  await purgeInvalid(db.mazeCollection, MazeSchema);

  const folders: ReadonlyArray<Folder> = await db.folderCollection.toArrayWhenReady();
  if (!hasUncategorizedFolder(folders)) {
    db.folderCollection.insert(buildUncategorizedFolder());
  }

  await ensureTutorialContent(db);
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

/**
 * 起動ゲートのリトライ用: キャッシュした Promise（成功・失敗のどちらも）を破棄し、次回 `initDb()`
 * で作り直せるようにする。
 *
 * `initDb` 自身は失敗 Promise を保持し続ける（自動で null に戻さない）。これは `use(initDb())` が
 * 失敗を Error Boundary へ throw するために必須で、もし失敗時に null へ戻すと、Error Boundary へ
 * 向かうリプレイレンダーで `initDb()` が新しい pending Promise を生成して再サスペンドし、境界に
 * 到達せず無限ループになる。リトライは AsyncBoundary の reset から本関数を呼び、その後の再レンダーで
 * `initDb()` が新しい Promise を作る形で行う。
 */
export const resetDb = (): void => {
  databasePromise = null;
};

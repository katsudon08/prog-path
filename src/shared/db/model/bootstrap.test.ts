import { describe, expect, it } from "vitest";

import { UNCATEGORIZED_FOLDER_ID } from "@/shared/config";

import type { AppDatabase } from "./collections";
import { ensureInitialData } from "./bootstrap";

const V4_A = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const V4_B = "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d";

/** ensureInitialData が使う最小メソッドだけを持つインメモリ・フェイクコレクション。 */
const makeFakeCollection = (initial: ReadonlyArray<Record<string, unknown>>) => {
  const rows = new Map<string, Record<string, unknown>>();
  for (const row of initial) {
    rows.set(String(row.id), row);
  }
  return {
    rows,
    toArrayWhenReady: async () => [...rows.values()],
    delete: (key: string): void => {
      rows.delete(key);
    },
    insert: (data: Record<string, unknown>): void => {
      rows.set(String(data.id), data);
    },
  };
};

type FakeCollection = ReturnType<typeof makeFakeCollection>;

const makeDb = (
  folders: ReadonlyArray<Record<string, unknown>>,
  mazes: ReadonlyArray<Record<string, unknown>> = [],
): { db: AppDatabase; folderCollection: FakeCollection; mazeCollection: FakeCollection } => {
  const folderCollection = makeFakeCollection(folders);
  const mazeCollection = makeFakeCollection(mazes);
  const db = { folderCollection, mazeCollection } as unknown as AppDatabase;
  return { db, folderCollection, mazeCollection };
};

describe("ensureInitialData", () => {
  it("空 DB では未分類フォルダを 1 つ生成し、迷路は 0 件のまま", async () => {
    const { db, folderCollection, mazeCollection } = makeDb([]);
    await ensureInitialData(db);
    expect(folderCollection.rows.has(UNCATEGORIZED_FOLDER_ID)).toBe(true);
    expect(folderCollection.rows.size).toBe(1);
    expect(mazeCollection.rows.size).toBe(0);
  });

  it("不正フォルダを破棄し、妥当フォルダは残し、未分類を補う", async () => {
    const valid = { id: V4_A, name: "算数", isDefault: false, createdAt: 1 };
    const invalid = { id: V4_B, name: "", isDefault: false, createdAt: 1 }; // name 空で不正
    const { db, folderCollection } = makeDb([valid, invalid]);
    await ensureInitialData(db);
    expect(folderCollection.rows.has(V4_A)).toBe(true);
    expect(folderCollection.rows.has(V4_B)).toBe(false);
    expect(folderCollection.rows.has(UNCATEGORIZED_FOLDER_ID)).toBe(true);
  });

  it("未分類フォルダが既にあれば重複させない", async () => {
    const existing = { id: UNCATEGORIZED_FOLDER_ID, name: "未分類", isDefault: true, createdAt: 0 };
    const { db, folderCollection } = makeDb([existing]);
    await ensureInitialData(db);
    expect(folderCollection.rows.size).toBe(1);
  });

  it("不正な迷路レコードを破棄する", async () => {
    const invalidMaze = {
      id: V4_A,
      name: "壊れ迷路",
      size: 4,
      floors: 1,
      tiles: [],
      folderId: UNCATEGORIZED_FOLDER_ID,
      createdAt: 1,
      updatedAt: 1,
    };
    const { db, mazeCollection } = makeDb([], [invalidMaze]);
    await ensureInitialData(db);
    expect(mazeCollection.rows.has(V4_A)).toBe(false);
  });
});

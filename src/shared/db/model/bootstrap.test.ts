import { describe, expect, it } from "vitest";

import { TUTORIAL_FOLDER_ID, UNCATEGORIZED_FOLDER_ID } from "@/shared/config";

import { buildTutorialMazes } from "../lib/tutorial-seed";
import type { AppDatabase } from "./collections";
import { ensureInitialData } from "./bootstrap";
import { TILE_KIND, type TileKind } from "./schema";

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

/** 構造は妥当だが、テレポート先が壁で着地できない 2 階建て迷路レコード。 */
const makeTeleportBrokenMaze = (id: string): Record<string, unknown> => {
  const makeFloor = (): TileKind[][] =>
    Array.from({ length: 5 }, () => Array.from({ length: 5 }, (): TileKind => TILE_KIND.FLOOR));
  const lower = makeFloor();
  lower[0][0] = TILE_KIND.START;
  lower[0][1] = TILE_KIND.GOAL;
  lower[2][2] = TILE_KIND.TELEPORT_UP; // 移動先は upper[2][2]
  const upper = makeFloor();
  upper[2][2] = TILE_KIND.WALL; // 着地先を壁にしてテレポートを不正化
  return {
    id,
    name: "テレポート不正・構造妥当",
    size: 5,
    floors: 2,
    tiles: [lower, upper],
    folderId: UNCATEGORIZED_FOLDER_ID,
    createdAt: 1,
    updatedAt: 1,
  };
};

describe("ensureInitialData", () => {
  it("空 DB では未分類＋チュートリアルフォルダを生成し、チュートリアル迷路を投入する", async () => {
    const { db, folderCollection, mazeCollection } = makeDb([]);
    await ensureInitialData(db);
    expect(folderCollection.rows.has(UNCATEGORIZED_FOLDER_ID)).toBe(true);
    expect(folderCollection.rows.has(TUTORIAL_FOLDER_ID)).toBe(true);
    expect(folderCollection.rows.size).toBe(2);
    expect(mazeCollection.rows.size).toBe(buildTutorialMazes().length);
  });

  it("2 回実行してもチュートリアルを重複投入しない（冪等）", async () => {
    const { db, folderCollection, mazeCollection } = makeDb([]);
    await ensureInitialData(db);
    await ensureInitialData(db);
    expect(folderCollection.rows.size).toBe(2);
    expect(mazeCollection.rows.size).toBe(buildTutorialMazes().length);
  });

  it("チュートリアル迷路が一部欠損していれば欠損分だけ補い、既存は上書きしない", async () => {
    const seeds = buildTutorialMazes();
    const edited = { ...seeds[0], name: "先生が編集した" };
    const { db, mazeCollection } = makeDb([], [edited as unknown as Record<string, unknown>]);
    await ensureInitialData(db);
    expect(mazeCollection.rows.size).toBe(seeds.length);
    expect((mazeCollection.rows.get(seeds[0].id) as { name: string }).name).toBe("先生が編集した");
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

  it("未分類フォルダが既にあれば重複させず、チュートリアルフォルダを補う", async () => {
    const existing = { id: UNCATEGORIZED_FOLDER_ID, name: "未分類", isDefault: true, createdAt: 0 };
    const { db, folderCollection } = makeDb([existing]);
    await ensureInitialData(db);
    expect(folderCollection.rows.has(UNCATEGORIZED_FOLDER_ID)).toBe(true);
    expect(folderCollection.rows.has(TUTORIAL_FOLDER_ID)).toBe(true);
    expect(folderCollection.rows.size).toBe(2);
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

  it("テレポート不正でも構造が妥当な迷路は破棄しない（データ損失を防ぐ）", async () => {
    const brokenMaze = makeTeleportBrokenMaze(V4_A);
    const { db, mazeCollection } = makeDb([], [brokenMaze]);
    await ensureInitialData(db);
    expect(mazeCollection.rows.has(V4_A)).toBe(true);
  });
});

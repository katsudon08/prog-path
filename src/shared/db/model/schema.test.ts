import { describe, expect, it } from "vitest";

import { UNCATEGORIZED_FOLDER_ID } from "@/shared/config";

import type { TileKind } from "./schema";
import { FolderSchema, MazeSchema, PlayableMazeSchema, TILE_KIND } from "./schema";

const V4_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

/** floor 埋めの size×size グリッドを作り、start/goal を 1 つずつ置いた 1 階分のタイルを返す。 */
const makeFloor = (size: number): TileKind[][] => {
  const floor: TileKind[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, (): TileKind => TILE_KIND.FLOOR),
  );
  floor[0][0] = TILE_KIND.START;
  floor[0][1] = TILE_KIND.GOAL;
  return floor;
};

const makeTwoFloorTiles = (): TileKind[][][] => {
  const lower = makeFloor(5);
  const upper = Array.from({ length: 5 }, () =>
    Array.from({ length: 5 }, (): TileKind => TILE_KIND.FLOOR),
  );
  lower[2][2] = TILE_KIND.TELEPORT_UP;
  upper[3][3] = TILE_KIND.TELEPORT_DOWN;
  return [lower, upper];
};

const validMaze = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: V4_ID,
  name: "テスト迷路",
  size: 5,
  floors: 1,
  tiles: [makeFloor(5)],
  folderId: UNCATEGORIZED_FOLDER_ID,
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_000_000,
  ...overrides,
});

describe("FolderSchema", () => {
  it("妥当なフォルダを通す", () => {
    const folder = { id: V4_ID, name: "算数", isDefault: false, createdAt: 1 };
    expect(FolderSchema.safeParse(folder).success).toBe(true);
  });

  it("未分類フォルダの予約 nil UUID を id として許容する", () => {
    const folder = { id: UNCATEGORIZED_FOLDER_ID, name: "未分類", isDefault: true, createdAt: 0 };
    expect(FolderSchema.safeParse(folder).success).toBe(true);
  });

  it("空の name を弾く", () => {
    const folder = { id: V4_ID, name: "", isDefault: false, createdAt: 1 };
    expect(FolderSchema.safeParse(folder).success).toBe(false);
  });

  it("UUID でない id を弾く", () => {
    const folder = { id: "not-a-uuid", name: "算数", isDefault: false, createdAt: 1 };
    expect(FolderSchema.safeParse(folder).success).toBe(false);
  });
});

describe("MazeSchema", () => {
  it("妥当な迷路を通す", () => {
    expect(MazeSchema.safeParse(validMaze()).success).toBe(true);
  });

  it("folderId に予約 nil UUID を許容する", () => {
    expect(MazeSchema.safeParse(validMaze({ folderId: UNCATEGORIZED_FOLDER_ID })).success).toBe(
      true,
    );
  });

  it("size 範囲外（4）を弾く", () => {
    expect(MazeSchema.safeParse(validMaze({ size: 4, tiles: [makeFloor(4)] })).success).toBe(false);
  });

  it("floors と tiles の階層数不一致を弾く", () => {
    expect(MazeSchema.safeParse(validMaze({ floors: 2 })).success).toBe(false);
  });

  it("各階の寸法が size と不一致なら弾く", () => {
    const tiles = [makeFloor(6)]; // size=5 なのに 6×6
    expect(MazeSchema.safeParse(validMaze({ tiles })).success).toBe(false);
  });

  it("スタートが無い迷路を弾く", () => {
    const floor = makeFloor(5);
    floor[0][0] = TILE_KIND.FLOOR; // start を消す
    expect(MazeSchema.safeParse(validMaze({ tiles: [floor] })).success).toBe(false);
  });

  it("ゴールが 2 つある迷路を弾く", () => {
    const floor = makeFloor(5);
    floor[0][2] = TILE_KIND.GOAL; // goal を 1 つ追加
    expect(MazeSchema.safeParse(validMaze({ tiles: [floor] })).success).toBe(false);
  });

  it("未知のタイル種別を弾く", () => {
    const floor = makeFloor(5);
    (floor[1] as unknown[])[1] = "lava";
    expect(MazeSchema.safeParse(validMaze({ tiles: [floor] })).success).toBe(false);
  });

  it("構造が妥当なら、テレポート不正でも通す（purge で消さないため）", () => {
    // 移動先の階が存在しない（範囲外）テレポート。構造としては妥当。
    const outOfBounds = makeTwoFloorTiles();
    outOfBounds[1][1][1] = TILE_KIND.TELEPORT_UP; // 最上階からさらに上はない
    expect(MazeSchema.safeParse(validMaze({ floors: 2, tiles: outOfBounds })).success).toBe(true);

    // 移動先が壁で着地できないテレポート。構造としては妥当。
    const blocked = makeTwoFloorTiles();
    blocked[1][2][2] = TILE_KIND.WALL; // lower[2][2] の TELEPORT_UP の移動先
    expect(MazeSchema.safeParse(validMaze({ floors: 2, tiles: blocked })).success).toBe(true);
  });
});

describe("PlayableMazeSchema", () => {
  it("有効なテレポートの移動先を通す", () => {
    expect(
      PlayableMazeSchema.safeParse(validMaze({ floors: 2, tiles: makeTwoFloorTiles() })).success,
    ).toBe(true);
  });

  it("存在しない階へのテレポートを弾く", () => {
    const tiles = makeTwoFloorTiles();
    tiles[1][1][1] = TILE_KIND.TELEPORT_UP;

    expect(PlayableMazeSchema.safeParse(validMaze({ floors: 2, tiles })).success).toBe(false);
  });

  it("壁・穴・テレポートへのテレポートを弾く", () => {
    const tiles = makeTwoFloorTiles();
    tiles[1][2][2] = TILE_KIND.WALL;

    expect(PlayableMazeSchema.safeParse(validMaze({ floors: 2, tiles })).success).toBe(false);
  });
});

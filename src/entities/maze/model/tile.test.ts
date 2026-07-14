// 同一スライス内なので Public API を介さず相対 import する。
import { describe, expect, it } from "vitest";

import {
  findStartFloor,
  findTiles,
  getTileAt,
  isFloor,
  isGoal,
  isHole,
  isKey,
  isStart,
  isTeleport,
  isWall,
  isWithinBounds,
} from "./tile";
import { TILE_KIND } from "./types";
import type { Maze, TileKind } from "./types";

/** size×size を floor 埋めしたグリッドを作る。 */
const makeFloor = (size: number): TileKind[][] =>
  Array.from({ length: size }, () => Array.from({ length: size }, (): TileKind => TILE_KIND.FLOOR));

/** テスト用の 2 階建て迷路。1 階に start/goal、2 階にカギを置く。 */
const buildMaze = (): Maze => {
  const size = 5;
  const floor0 = makeFloor(size);
  floor0[0][0] = TILE_KIND.START;
  floor0[4][4] = TILE_KIND.GOAL;
  floor0[2][2] = TILE_KIND.WALL;
  const floor1 = makeFloor(size);
  floor1[1][1] = TILE_KIND.KEY;
  return {
    id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
    name: "テスト迷路",
    size,
    floors: 2,
    tiles: [floor0, floor1],
    folderId: "00000000-0000-0000-0000-000000000000",
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
  };
};

describe("isWithinBounds", () => {
  const maze = buildMaze();

  it("範囲内の座標を true とする", () => {
    expect(isWithinBounds(maze, { floor: 0, row: 0, col: 0 })).toBe(true);
    expect(isWithinBounds(maze, { floor: 1, row: 4, col: 4 })).toBe(true);
  });

  it("各軸の範囲外を false とする", () => {
    expect(isWithinBounds(maze, { floor: -1, row: 0, col: 0 })).toBe(false);
    expect(isWithinBounds(maze, { floor: 2, row: 0, col: 0 })).toBe(false); // floors=2 → 有効は 0,1
    expect(isWithinBounds(maze, { floor: 0, row: 5, col: 0 })).toBe(false); // size=5 → 有効は 0..4
    expect(isWithinBounds(maze, { floor: 0, row: 0, col: -1 })).toBe(false);
  });
});

describe("getTileAt", () => {
  const maze = buildMaze();

  it("指定位置のタイル種別を返す", () => {
    expect(getTileAt(maze, { floor: 0, row: 0, col: 0 })).toBe(TILE_KIND.START);
    expect(getTileAt(maze, { floor: 0, row: 4, col: 4 })).toBe(TILE_KIND.GOAL);
    expect(getTileAt(maze, { floor: 0, row: 2, col: 2 })).toBe(TILE_KIND.WALL);
    expect(getTileAt(maze, { floor: 1, row: 1, col: 1 })).toBe(TILE_KIND.KEY);
    expect(getTileAt(maze, { floor: 1, row: 0, col: 0 })).toBe(TILE_KIND.FLOOR);
  });

  it("範囲外アクセスは RangeError を投げる", () => {
    expect(() => getTileAt(maze, { floor: 5, row: 0, col: 0 })).toThrow(RangeError);
  });
});

describe("findTiles", () => {
  const maze = buildMaze();

  it("指定種別の全座標を floor→row→col 順で返す", () => {
    expect(findTiles(maze, TILE_KIND.START)).toEqual([{ floor: 0, row: 0, col: 0 }]);
    expect(findTiles(maze, TILE_KIND.KEY)).toEqual([{ floor: 1, row: 1, col: 1 }]);
  });

  it("該当なしは空配列を返す", () => {
    expect(findTiles(maze, TILE_KIND.TELEPORT_UP)).toEqual([]);
  });
});

describe("findStartFloor", () => {
  it("スタートのある階を返す", () => {
    const maze = buildMaze();
    // start を 2 階（index 1）に移す
    maze.tiles[0][0][0] = TILE_KIND.FLOOR;
    maze.tiles[1][0][0] = TILE_KIND.START;
    expect(findStartFloor(maze)).toBe(1);
  });

  it("スタートが無い場合は先頭階 0 を返す", () => {
    const maze = buildMaze();
    maze.tiles[0][0][0] = TILE_KIND.FLOOR;
    expect(findStartFloor(maze)).toBe(0);
  });
});

describe("種別述語", () => {
  it("各述語が対応する種別のみ true", () => {
    expect(isFloor(TILE_KIND.FLOOR)).toBe(true);
    expect(isFloor(TILE_KIND.WALL)).toBe(false);
    expect(isWall(TILE_KIND.WALL)).toBe(true);
    expect(isHole(TILE_KIND.HOLE)).toBe(true);
    expect(isStart(TILE_KIND.START)).toBe(true);
    expect(isGoal(TILE_KIND.GOAL)).toBe(true);
    expect(isKey(TILE_KIND.KEY)).toBe(true);
  });

  it("isTeleport は上下いずれも true", () => {
    expect(isTeleport(TILE_KIND.TELEPORT_UP)).toBe(true);
    expect(isTeleport(TILE_KIND.TELEPORT_DOWN)).toBe(true);
    expect(isTeleport(TILE_KIND.FLOOR)).toBe(false);
  });
});

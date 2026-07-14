import { describe, expect, it } from "vitest";

// 同一スライス内は相対 import、他スライス（shared）は Public API 経由。
import { MAZE_DEFAULT_SIZE, UNCATEGORIZED_FOLDER_ID } from "@/shared/config";
import { MazeSchema } from "@/shared/db";

import { findTiles, getTileAt } from "../model/tile";
import { TILE_KIND } from "../model/types";
import type { Maze } from "../model/types";
import { createInitialMaze } from "./create-initial-maze";

/** 構造コアにダミーの永続メタを足して完全な Maze に合成する（スキーマ適合検証用）。 */
const withMeta = (structure: ReturnType<typeof createInitialMaze>): Maze => ({
  id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  name: "新しい迷路",
  folderId: UNCATEGORIZED_FOLDER_ID,
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_000_000,
  ...structure,
});

describe("createInitialMaze", () => {
  it("既定は 5×5・1 階", () => {
    const maze = createInitialMaze();
    expect(maze.size).toBe(MAZE_DEFAULT_SIZE);
    expect(maze.floors).toBe(1);
    expect(maze.tiles).toHaveLength(1);
    expect(maze.tiles[0]).toHaveLength(MAZE_DEFAULT_SIZE);
    expect(maze.tiles[0][0]).toHaveLength(MAZE_DEFAULT_SIZE);
  });

  it("引数で size / floors を指定できる", () => {
    const maze = createInitialMaze(7, 3);
    expect(maze.size).toBe(7);
    expect(maze.floors).toBe(3);
    expect(maze.tiles).toHaveLength(3);
    expect(
      maze.tiles.every((floor) => floor.length === 7 && floor.every((r) => r.length === 7)),
    ).toBe(true);
  });

  it("floor 0 の左上に start・右下に goal を置く", () => {
    const size = 5;
    const maze = createInitialMaze(size);
    expect(getTileAt(withMeta(maze), { floor: 0, row: 0, col: 0 })).toBe(TILE_KIND.START);
    expect(getTileAt(withMeta(maze), { floor: 0, row: size - 1, col: size - 1 })).toBe(
      TILE_KIND.GOAL,
    );
  });

  it("start / goal は各 1 つ、他は全て床", () => {
    const maze = withMeta(createInitialMaze(6, 2));
    expect(findTiles(maze, TILE_KIND.START)).toHaveLength(1);
    expect(findTiles(maze, TILE_KIND.GOAL)).toHaveLength(1);
    // 6×6×2 = 72 セル。start/goal を除く 70 が床。
    expect(findTiles(maze, TILE_KIND.FLOOR)).toHaveLength(70);
  });

  it("生成物にメタを足すと MazeSchema（shared/db）の構造検証を通る", () => {
    for (const [size, floors] of [
      [5, 1],
      [7, 3],
    ] as const) {
      const maze = withMeta(createInitialMaze(size, floors));
      expect(MazeSchema.safeParse(maze).success).toBe(true);
    }
  });

  it("純粋・決定的（同じ引数で同じ結果）", () => {
    expect(createInitialMaze(5, 1)).toEqual(createInitialMaze(5, 1));
  });
});

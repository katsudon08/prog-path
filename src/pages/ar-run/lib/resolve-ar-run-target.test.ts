import { describe, expect, it } from "vitest";

import { buildTutorialMazes, TILE_KIND, TUTORIAL_MAZE_ID } from "@/shared/db";
import type { Maze } from "@/shared/db";

import { resolveArRunTarget } from "./resolve-ar-run-target";
import type { ArRunTarget } from "./resolve-ar-run-target";

const mazes = buildTutorialMazes();

const byId = (id: string): Maze => {
  const maze = mazes.find((candidate) => candidate.id === id);
  if (maze === undefined) throw new Error(`チュートリアル迷路が見つからない: ${id}`);
  return maze;
};

/** `ready` であることを確かめて中身の迷路を取り出す（判別共用体の絞り込みヘルパ）。 */
const expectReady = (target: ArRunTarget): Maze => {
  if (target.kind !== "ready") throw new Error(`ready ではない: ${target.kind}`);
  return target.maze;
};

/**
 * テレポート先だけを壊した迷路を作る。
 * 「上の階へ」は F0(4,0) が teleportUp で、着地点は F1(4,0)。ここを壁にすると着地不可になり
 * PlayableMazeSchema だけが落ちる（寸法・スタート/ゴール数は保たれるので MazeSchema は通る）。
 */
const buildUnplayableTeleportMaze = (): Maze => {
  const maze = byId(TUTORIAL_MAZE_ID.TELEPORT);
  const tiles = maze.tiles.map((floor) => floor.map((row) => [...row]));
  tiles[1][4][0] = TILE_KIND.WALL;
  return { ...maze, tiles };
};

describe("resolveArRunTarget", () => {
  it("mazeId が null なら unselected", () => {
    expect(resolveArRunTarget(null, undefined)).toEqual({ kind: "unselected" });
  });

  it("mazeId が空文字なら unselected（行があっても迷路を選ばせる）", () => {
    expect(resolveArRunTarget("", byId(TUTORIAL_MAZE_ID.STRAIGHT))).toEqual({ kind: "unselected" });
  });

  it("行が無ければ not-found", () => {
    expect(resolveArRunTarget(TUTORIAL_MAZE_ID.STRAIGHT, undefined)).toEqual({ kind: "not-found" });
  });

  it("スキーマを満たさない壊れた行は not-found（無いのと同じ扱い）", () => {
    expect(resolveArRunTarget("broken", { id: "broken", name: "" })).toEqual({ kind: "not-found" });
  });

  it("プレイ可能な迷路は ready", () => {
    const maze = byId(TUTORIAL_MAZE_ID.LOOP);

    expect(expectReady(resolveArRunTarget(maze.id, maze))).toEqual(maze);
  });

  it("テレポート先が壊れた迷路は unplayable（迷路名を添える）", () => {
    const maze = buildUnplayableTeleportMaze();

    expect(resolveArRunTarget(maze.id, maze)).toEqual({
      kind: "unplayable",
      mazeName: "上の階へ",
    });
  });

  it("ready の迷路から TanStack DB の virtual props が剥がれる", () => {
    const maze = byId(TUTORIAL_MAZE_ID.STRAIGHT);
    const row = { ...maze, $key: maze.id, $synced: true, $origin: "sync", $collectionId: "mazes" };

    const resolved = expectReady(resolveArRunTarget(maze.id, row));

    expect(Object.keys(resolved)).not.toContain("$key");
    expect(resolved).toEqual(maze);
  });
});

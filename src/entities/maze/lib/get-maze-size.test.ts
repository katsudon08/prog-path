import { describe, expect, it } from "vitest";

import { UNCATEGORIZED_FOLDER_ID } from "../model/constants";
import type { Maze, MazeLayer } from "../model/types";
import { getMazeGridSize, getMazeLayerCount } from "./get-maze-size";

const createLayer = (size: number): MazeLayer =>
  Array.from({ length: size }, () => Array.from({ length: size }, (): "floor" => "floor"));

const createMaze = (layers: MazeLayer[]): Maze => ({
  id: crypto.randomUUID(),
  name: "テスト用の迷路",
  layers,
  folderId: UNCATEGORIZED_FOLDER_ID,
});

describe("getMazeGridSize", () => {
  it("1階のマスの数を一辺の大きさとして返す", () => {
    expect(getMazeGridSize(createMaze([createLayer(5)]))).toBe(5);
  });

  it("階が増えても一辺の大きさは変わらない", () => {
    expect(getMazeGridSize(createMaze([createLayer(7), createLayer(7)]))).toBe(7);
  });

  it("階が1つも無ければ undefined を返す", () => {
    expect(getMazeGridSize(createMaze([]))).toBeUndefined();
  });
});

describe("getMazeLayerCount", () => {
  it("階の数を返す", () => {
    expect(getMazeLayerCount(createMaze([createLayer(5), createLayer(5)]))).toBe(2);
  });

  it("階が1つも無ければ 0 を返す", () => {
    expect(getMazeLayerCount(createMaze([]))).toBe(0);
  });
});

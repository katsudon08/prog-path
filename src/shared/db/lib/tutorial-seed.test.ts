import { describe, expect, it } from "vitest";

import { TUTORIAL_FOLDER_ID } from "@/shared/config";

import { FolderSchema, PlayableMazeSchema } from "../model/schema";
import { buildTutorialFolder, buildTutorialMazes } from "./tutorial-seed";

describe("tutorial-seed", () => {
  it("チュートリアル迷路は 6 件ある", () => {
    expect(buildTutorialMazes()).toHaveLength(6);
  });

  it("全チュートリアル迷路が PlayableMazeSchema（構造＋テレポート整合）を通る", () => {
    for (const maze of buildTutorialMazes()) {
      const result = PlayableMazeSchema.safeParse(maze);
      expect(result.success, `${maze.name} が不正`).toBe(true);
    }
  });

  it("チュートリアルフォルダが FolderSchema を通る", () => {
    expect(FolderSchema.safeParse(buildTutorialFolder()).success).toBe(true);
  });

  it("フォルダ ID と迷路 ID は互いに一意で衝突しない", () => {
    const mazeIds = buildTutorialMazes().map((maze) => maze.id);
    const allIds = [TUTORIAL_FOLDER_ID, ...mazeIds];
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it("全迷路の folderId がチュートリアルフォルダを指し、作成順が昇順", () => {
    const mazes = buildTutorialMazes();
    expect(mazes.every((maze) => maze.folderId === TUTORIAL_FOLDER_ID)).toBe(true);
    const createdAts = mazes.map((maze) => maze.createdAt);
    expect(createdAts).toEqual([...createdAts].sort((a, b) => a - b));
  });
});

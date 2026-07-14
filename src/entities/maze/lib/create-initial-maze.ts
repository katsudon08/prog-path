/**
 * 初期迷路生成（FSD: entities/maze/lib）
 *
 * 作成時の初期状態を組み立てる純粋・決定的な関数。全マスを床で埋め、floor 0 の左上に
 * スタート・右下にゴールを置く（→ docs/features.md 4.2）。
 *
 * 純粋性のため `crypto.randomUUID()` / `Date.now()` は呼ばず、構造コア（{@link MazeStructure}）
 * のみを返す。id・name・folderId・日時は生成フロー（features/maze-management #193・
 * features/maze-edit #195）が付与して {@link Maze} に合成する。
 */
import { MAZE_DEFAULT_SIZE, MAZE_FLOOR_COUNT_MIN } from "@/shared/config";

import { TILE_KIND } from "../model/types";
import type { MazeStructure, TileKind } from "../model/types";

/**
 * 初期迷路の構造コアを生成する。
 *
 * @param size 一辺のマス数（既定 {@link MAZE_DEFAULT_SIZE} = 5）。全階共通。
 * @param floors 階層数（既定 {@link MAZE_FLOOR_COUNT_MIN} = 1）。
 * @returns 全床 + floor 0 の左上 start・右下 goal を配置した {@link MazeStructure}。
 */
export const createInitialMaze = (
  size: number = MAZE_DEFAULT_SIZE,
  floors: number = MAZE_FLOOR_COUNT_MIN,
): MazeStructure => {
  const tiles: TileKind[][][] = Array.from({ length: floors }, () =>
    Array.from({ length: size }, () =>
      Array.from({ length: size }, (): TileKind => TILE_KIND.FLOOR),
    ),
  );

  // floor 0 の左上（row 0, col 0）= スタート、右下（row size-1, col size-1）= ゴール。
  tiles[0][0][0] = TILE_KIND.START;
  tiles[0][size - 1][size - 1] = TILE_KIND.GOAL;

  return { size, floors, tiles };
};

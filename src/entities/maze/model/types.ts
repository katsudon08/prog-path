/**
 * 迷路の型（FSD: entities/maze/model）
 *
 * `Maze` / `TileKind` / `TILE_KIND` の「単一の正」は shared/db（#179）にあり、本 entity は
 * 再定義せず再エクスポートする（→ docs/db-design.md 5.1）。ここでは entity 固有の補助型
 * （位置・構造コア）のみを新規に定義する。他 entity（robot/command）は参照しない。
 */
export { TILE_KIND } from "@/shared/db";
export type { Maze, TileKind } from "@/shared/db";

import type { Maze } from "@/shared/db";

/**
 * 迷路内のセル位置。`tiles[floor][row][col]` に対応し、`floor` は 0 始まり（表示階 = floor + 1）。
 * 実行エンジン（#185）がロボット位置から O(1) でタイルを引く際の座標（→ docs/db-design.md 3.4）。
 */
export interface MazeCoord {
  floor: number;
  row: number;
  col: number;
}

/**
 * 迷路の構造コア（永続メタ id/folderId/日時を除いた、グリッドとしての本質）。
 * `createInitialMaze` の戻り値であり、QR 共有ペイロード（#201）の土台にもなる。
 * 生成側（#193/#195）が id・name・folderId・日時を付与して {@link Maze} に合成する。
 */
export type MazeStructure = Pick<Maze, "size" | "floors" | "tiles">;

/**
 * Public API — `entities/maze` スライス
 *
 * 迷路（構造・タイル）のドメインオブジェクト。`Maze` / `TileKind` 型、初期迷路生成、
 * タイル判定、2D/3D 表示を持つ。型・状態・純粋ロジックのみで、他 entity を参照しない。
 * 型・スキーマの正は shared/db（#179）にあり、本スライスは再エクスポートで単一の正を保つ。
 *
 * 他スライスからの import はこの index.ts 経由のみ。`export * from` は使わず
 * 公開対象を個別に明示する（→ docs/directory-structure.md 2.2）。
 */

// 型（正は shared/db。本スライスの補助型 MazeCoord / MazeStructure を含む）
export type { Maze, TileKind, MazeCoord, MazeStructure } from "./model/types";
export { TILE_KIND } from "./model/types";

// タイル判定（構造的・純粋。ゲームルールは features/maze-simulation #185）
export {
  getTileAt,
  isWithinBounds,
  findTiles,
  findStartFloor,
  isFloor,
  isWall,
  isHole,
  isStart,
  isGoal,
  isKey,
  isTeleport,
} from "./model/tile";

// 見た目マッピング（2D ユーティリティ / 3D hex 色）
export { TILE_VISUALS, TILE_COLOR_3D } from "./model/tile-visual";
export type { TileVisual } from "./model/tile-visual";

// 初期迷路生成
export { createInitialMaze } from "./lib/create-initial-maze";

// 表示コンポーネント
export { MazePreview } from "./ui/maze-preview";
export { Maze3d } from "./ui/maze-3d";

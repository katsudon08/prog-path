/**
 * タイルの構造的判定（FSD: entities/maze/model）
 *
 * 「ある位置のタイルは何か」「盤面のどこに特定種別があるか」といった純粋・構造的な問い合わせのみを扱う。
 * 移動可否・衝突・穴落下・カギ/ゴール判定などの**ゲームルール（意味論）は持たない**——それらは
 * 複数エンティティを合成する features/maze-simulation（#185）の責務（→ docs/architecture.md 3, directory-structure.md 4.5）。
 */
import { TILE_KIND } from "./types";
import type { Maze, MazeCoord, TileKind } from "./types";

/** 座標が迷路の範囲内か（floor/row/col すべてが 0..上限-1）。 */
export const isWithinBounds = (maze: Maze, { floor, row, col }: MazeCoord): boolean =>
  floor >= 0 && floor < maze.floors && row >= 0 && row < maze.size && col >= 0 && col < maze.size;

/**
 * 指定位置のタイル種別を返す（O(1)）。範囲外の座標は呼び出し側が {@link isWithinBounds} で
 * 保証する前提とし、範囲外アクセスは例外を投げる（不正な座標を黙って通さない）。
 */
export const getTileAt = (maze: Maze, coord: MazeCoord): TileKind => {
  if (!isWithinBounds(maze, coord)) {
    throw new RangeError(
      `座標が迷路の範囲外です: floor=${coord.floor}, row=${coord.row}, col=${coord.col}`,
    );
  }
  return maze.tiles[coord.floor][coord.row][coord.col];
};

/** 指定種別のタイルが存在する全座標を、floor→row→col の走査順で返す。 */
export const findTiles = (maze: Maze, kind: TileKind): MazeCoord[] => {
  const found: MazeCoord[] = [];
  maze.tiles.forEach((floorTiles, floor) => {
    floorTiles.forEach((rowTiles, row) => {
      rowTiles.forEach((tile, col) => {
        if (tile === kind) {
          found.push({ floor, row, col });
        }
      });
    });
  });
  return found;
};

/**
 * スタートのある階（0 始まり）。プレビュー既定階や「スタートのある階の俯瞰」（#196）に使う。
 * スタートは構造上ちょうど 1 つ（MazeSchema で保証）だが、万一無い場合は 0（先頭階）を返す。
 */
export const findStartFloor = (maze: Maze): number =>
  findTiles(maze, TILE_KIND.START)[0]?.floor ?? 0;

/** 床か。 */
export const isFloor = (kind: TileKind): boolean => kind === TILE_KIND.FLOOR;
/** 壁か。 */
export const isWall = (kind: TileKind): boolean => kind === TILE_KIND.WALL;
/** 穴か。 */
export const isHole = (kind: TileKind): boolean => kind === TILE_KIND.HOLE;
/** スタートか。 */
export const isStart = (kind: TileKind): boolean => kind === TILE_KIND.START;
/** ゴールか。 */
export const isGoal = (kind: TileKind): boolean => kind === TILE_KIND.GOAL;
/** カギか。 */
export const isKey = (kind: TileKind): boolean => kind === TILE_KIND.KEY;
/** テレポート（上・下いずれか）か。 */
export const isTeleport = (kind: TileKind): boolean =>
  kind === TILE_KIND.TELEPORT_UP || kind === TILE_KIND.TELEPORT_DOWN;

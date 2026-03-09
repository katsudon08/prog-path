/**
 * 迷路グリッドの型定義とタイル文字マッピング
 */

/** マス目の種類（7種） */
export type TileType =
    | 'floor'
    | 'wall'
    | 'start'
    | 'goal'
    | 'teleport-up'
    | 'teleport-down'
    | 'key';

/** 1行（7マス） */
export type MazeRow = TileType[];

/** 1階層（7×7） */
export type MazeFloor = MazeRow[];

/** 迷路全体（最大3階層の3次元配列） */
export type MazeGrid = MazeFloor[];

// ── 定数 ──

/** 迷路データの識別プレフィックス */
export const MAZE_PREFIX = 'M:';

/** 1階層あたりの列数 */
export const MAX_COLS = 7;

/** 1階層あたりの行数 */
export const MAX_ROWS = 7;

/** 最大階層数 */
export const MAX_FLOORS = 3;

/** タイル種別 → RLE文字 */
export const TILE_CHAR_MAP: ReadonlyMap<TileType, string> = new Map([
    ['floor', 'F'],
    ['wall', 'W'],
    ['start', 'S'],
    ['goal', 'G'],
    ['teleport-up', 'U'],
    ['teleport-down', 'D'],
    ['key', 'K'],
]);

/** RLE文字 → タイル種別 */
export const CHAR_TILE_MAP: ReadonlyMap<string, TileType> = new Map(
    [...TILE_CHAR_MAP.entries()].map(([tile, char]) => [char, tile]),
);

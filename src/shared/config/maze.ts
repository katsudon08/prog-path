/**
 * 迷路の寸法制約（唯一の正）。
 * サイズ = 一辺のマス数（全階共通の正方グリッド）／階層数 = 階の数。
 * → docs/db-design.md 3.2, docs/glossary.md
 */
export const MAZE_SIZE_MIN = 5;
export const MAZE_SIZE_MAX = 7;
export const MAZE_FLOOR_COUNT_MIN = 1;
export const MAZE_FLOOR_COUNT_MAX = 3;

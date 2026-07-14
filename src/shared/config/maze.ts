/**
 * 迷路の寸法制約（唯一の正）。
 * サイズ = 一辺のマス数（全階共通の正方グリッド）／階層数 = 階の数。
 * → docs/db-design.md 3.2, docs/glossary.md
 */
export const MAZE_SIZE_MIN = 5;
export const MAZE_SIZE_MAX = 7;
export const MAZE_FLOOR_COUNT_MIN = 1;
export const MAZE_FLOOR_COUNT_MAX = 3;

/**
 * 作成時の初期迷路の既定サイズ（一辺のマス数）。
 * 2〜3 人で 1 台を囲む導入として最小サイズから始める（→ docs/features.md 4.2）。
 * エディタ（#195）は範囲内で変更可能で、`createInitialMaze` の既定値でもある。
 */
export const MAZE_DEFAULT_SIZE = MAZE_SIZE_MIN;

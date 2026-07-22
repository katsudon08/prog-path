/**
 * 描画用グリッド座標（FSD: shared/grid/model）
 *
 * 3D 表示のワールド変換に渡すためのセル座標。`tiles[floor][row][col]` に対応し、
 * `floor` は 0 始まり。entities の `MazeCoord` / `RobotCoord` と構造同形のため、
 * consumer はそれらの値をそのまま {@link Coord} として渡せる（shared は最下層で
 * 他スライスに依存しないため、型は本スライスで独立に定義する）。
 */

/**
 * 描画用グリッド座標。
 *
 * @property floor 階（0 始まり。表示階 = floor + 1）。ワールド y へ写す。
 * @property row 行。ワールド z へ写す。
 * @property col 列。ワールド x へ写す。
 */
export interface Coord {
  floor: number;
  row: number;
  col: number;
}

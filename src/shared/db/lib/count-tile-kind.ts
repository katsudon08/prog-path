import type { TileKind } from "../model/schema";

/**
 * 3 次元タイル配列（`tiles[floor][row][col]`）から特定種別の総数を数える。
 * MazeSchema の構造検証（スタート/ゴールは各 1 つ）で用いる。
 *
 * @param tiles - `[floor][row][col]` のタイル配置
 * @param kind - 数えるタイル種別
 * @returns 全階を通じた出現数
 */
export const countTileKind = (
  tiles: readonly (readonly (readonly TileKind[])[])[],
  kind: TileKind,
): number => {
  let count = 0;
  for (const floor of tiles) {
    for (const row of floor) {
      for (const tile of row) {
        if (tile === kind) {
          count += 1;
        }
      }
    }
  }
  return count;
};

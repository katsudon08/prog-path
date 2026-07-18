import { TILE_KIND } from "../model/tile-kind";
import type { TileKind } from "../model/tile-kind";

/** 迷路内のセル座標（floor は 0 始まり）。 */
export interface MazeTileCoord {
  floor: number;
  row: number;
  col: number;
}

/** テレポート整合性エラーの種類。 */
export const TELEPORT_VALIDATION_ERROR_CODE = {
  DESTINATION_OUT_OF_BOUNDS: "destination-out-of-bounds",
  DESTINATION_BLOCKED: "destination-blocked",
} as const;

/** {@link TELEPORT_VALIDATION_ERROR_CODE} の値。 */
export type TeleportValidationErrorCode =
  (typeof TELEPORT_VALIDATION_ERROR_CODE)[keyof typeof TELEPORT_VALIDATION_ERROR_CODE];

/** 1つのテレポートについて検出された整合性エラー。 */
export interface TeleportValidationIssue {
  code: TeleportValidationErrorCode;
  source: MazeTileCoord;
  destination: MazeTileCoord;
  destinationKind?: TileKind;
}

/** MazeSchema の形状検証前にも安全に走査できる、迷路タイル配列の最小形状。 */
export interface MazeTileGrid {
  floors: number;
  size: number;
  tiles: readonly (readonly (readonly TileKind[])[])[];
}

const BLOCKED_DESTINATION_KINDS: readonly TileKind[] = [
  TILE_KIND.WALL,
  TILE_KIND.HOLE,
  TILE_KIND.TELEPORT_UP,
  TILE_KIND.TELEPORT_DOWN,
];

/** テレポート移動先として着地できないタイル種別か（壁・穴・テレポート）。実行前検証と実行時解決で共有する。 */
export const isBlockedDestination = (kind: TileKind): boolean =>
  BLOCKED_DESTINATION_KINDS.includes(kind);

/**
 * 迷路内の全テレポートについて、同位置の移動先を検証する。
 *
 * `teleportUp` は `floor + 1`、`teleportDown` は `floor - 1` を移動先とする。
 * 移動先は通行可能な通常タイルである必要があり、反対向きのテレポートは要求しない。
 *
 * @param maze 検証対象の迷路タイル配列
 * @returns 検出された問題の一覧。問題がなければ空配列
 */
export const validateTeleportLinks = (maze: MazeTileGrid): TeleportValidationIssue[] => {
  const issues: TeleportValidationIssue[] = [];

  for (let floor = 0; floor < maze.tiles.length; floor += 1) {
    const floorTiles = maze.tiles[floor];
    if (floorTiles === undefined) continue;

    for (let row = 0; row < floorTiles.length; row += 1) {
      const rowTiles = floorTiles[row];
      if (rowTiles === undefined) continue;

      for (let col = 0; col < rowTiles.length; col += 1) {
        const tile = rowTiles[col];
        if (tile !== TILE_KIND.TELEPORT_UP && tile !== TILE_KIND.TELEPORT_DOWN) continue;

        const destinationFloor = tile === TILE_KIND.TELEPORT_UP ? floor + 1 : floor - 1;
        const source = { floor, row, col };
        const destination = { floor: destinationFloor, row, col };

        if (
          destinationFloor < 0 ||
          destinationFloor >= maze.floors ||
          destinationFloor >= maze.tiles.length ||
          maze.tiles[destinationFloor]?.[row]?.[col] === undefined
        ) {
          issues.push({
            code: TELEPORT_VALIDATION_ERROR_CODE.DESTINATION_OUT_OF_BOUNDS,
            source,
            destination,
          });
          continue;
        }

        const destinationKind = maze.tiles[destinationFloor][row][col];
        if (isBlockedDestination(destinationKind)) {
          issues.push({
            code: TELEPORT_VALIDATION_ERROR_CODE.DESTINATION_BLOCKED,
            source,
            destination,
            destinationKind,
          });
        }
      }
    }
  }

  return issues;
};

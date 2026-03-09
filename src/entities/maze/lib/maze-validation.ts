/**
 * 迷路グリッドのバリデーション
 */
import { MAX_COLS, MAX_ROWS, MAX_FLOORS, TILE_CHAR_MAP } from '../model/maze-grid-types';
import type { TileType, MazeGrid } from '../model/maze-grid-types';

const VALID_TILES = new Set<TileType>(TILE_CHAR_MAP.keys());

/**
 * 迷路グリッドをバリデーションする
 * @throws バリデーション違反時
 */
export const validateMazeGrid = (grid: MazeGrid): void => {
    // 階層数チェック
    if (grid.length === 0 || grid.length > MAX_FLOORS) {
        throw new Error(
            `階層数は 1〜${MAX_FLOORS} である必要があります（現在: ${grid.length}）`,
        );
    }

    let startCount = 0;
    let goalCount = 0;

    for (let f = 0; f < grid.length; f++) {
        const floor = grid[f];

        // 行数チェック
        if (floor.length !== MAX_ROWS) {
            throw new Error(
                `階層 ${f + 1} の行数が ${MAX_ROWS} ではありません（現在: ${floor.length}）`,
            );
        }

        for (let r = 0; r < floor.length; r++) {
            const row = floor[r];

            // 列数チェック
            if (row.length !== MAX_COLS) {
                throw new Error(
                    `階層 ${f + 1} 行 ${r + 1} の列数が ${MAX_COLS} ではありません（現在: ${row.length}）`,
                );
            }

            for (let c = 0; c < row.length; c++) {
                const tile = row[c];

                // タイル種別チェック
                if (!VALID_TILES.has(tile)) {
                    throw new Error(
                        `不正なタイル種別です: "${tile}"（階層 ${f + 1}, 行 ${r + 1}, 列 ${c + 1}）`,
                    );
                }

                if (tile === 'start') startCount++;
                if (tile === 'goal') goalCount++;
            }
        }
    }

    // スタート数チェック
    if (startCount !== 1) {
        throw new Error(
            `スタートは全体で1つ必要です（現在: ${startCount}）`,
        );
    }

    // ゴール数チェック
    if (goalCount !== 1) {
        throw new Error(
            `ゴールは全体で1つ必要です（現在: ${goalCount}）`,
        );
    }
};

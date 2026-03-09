/**
 * 迷路データのRLEエンコード・デコード処理
 */
import {
    MAZE_PREFIX,
    MAX_COLS,
    MAX_ROWS,
    MAX_FLOORS,
    TILE_CHAR_MAP,
    CHAR_TILE_MAP,
} from '../model/maze-grid-types';
import type { TileType, MazeGrid, MazeFloor, MazeRow } from '../model/maze-grid-types';

/**
 * 3次元配列の迷路データを RLE 圧縮文字列にエンコードする
 * @returns `M:` プレフィックス付きRLE文字列
 */
export const encodeMazeToRle = (grid: MazeGrid): string => {
    // 3次元 → 1次元に展開
    const chars: string[] = [];
    for (const floor of grid) {
        for (const row of floor) {
            for (const tile of row) {
                const char = TILE_CHAR_MAP.get(tile);
                if (char === undefined) {
                    throw new Error(`不正なタイル種別です: ${tile}`);
                }
                chars.push(char);
            }
        }
    }

    // RLE 圧縮
    let rle = '';
    let i = 0;
    while (i < chars.length) {
        const current = chars[i];
        let count = 1;
        while (i + count < chars.length && chars[i + count] === current) {
            count++;
        }
        rle += `${count}${current}`;
        i += count;
    }

    return MAZE_PREFIX + rle;
};

/**
 * RLE 圧縮文字列を 3次元迷路配列にデコードする
 * @param encoded `M:` プレフィックス付きRLE文字列
 * @throws プレフィックス不正、不正文字、サイズ不正の場合
 */
export const decodeMazeFromRle = (encoded: string): MazeGrid => {
    if (!encoded.startsWith(MAZE_PREFIX)) {
        throw new Error(`迷路データには "${MAZE_PREFIX}" プレフィックスが必要です`);
    }

    const rleBody = encoded.slice(MAZE_PREFIX.length);
    if (rleBody.length === 0) {
        throw new Error('RLEデータが空です');
    }

    // RLE 展開: "数字+文字" のパターンを反復パース
    const tiles: TileType[] = [];
    const rlePattern = /(\d+)([A-Z])/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = rlePattern.exec(rleBody)) !== null) {
        if (match.index !== lastIndex) {
            throw new Error(
                `不正なRLEフォーマットです（位置 ${lastIndex}）: "${rleBody.slice(lastIndex, match.index)}"`,
            );
        }
        lastIndex = rlePattern.lastIndex;

        const count = parseInt(match[1], 10);
        const char = match[2];
        const tile = CHAR_TILE_MAP.get(char);

        if (tile === undefined) {
            throw new Error(`不正なタイル文字です: "${char}"`);
        }

        for (let j = 0; j < count; j++) {
            tiles.push(tile);
        }
    }

    // 末尾に未パース部分が残っていないかチェック
    if (lastIndex !== rleBody.length) {
        throw new Error(
            `不正なRLEフォーマットです（位置 ${lastIndex}）: "${rleBody.slice(lastIndex)}"`,
        );
    }

    // タイル総数からフロア数を算出
    const tilesPerFloor = MAX_ROWS * MAX_COLS;
    if (tiles.length === 0 || tiles.length % tilesPerFloor !== 0) {
        throw new Error(
            `タイル総数 (${tiles.length}) が ${MAX_ROWS}×${MAX_COLS} の倍数ではありません`,
        );
    }

    const floorCount = tiles.length / tilesPerFloor;
    if (floorCount > MAX_FLOORS) {
        throw new Error(
            `階層数 (${floorCount}) が最大値 ${MAX_FLOORS} を超えています`,
        );
    }

    // 1次元 → 3次元に再構築
    const grid: MazeGrid = [];
    let idx = 0;
    for (let f = 0; f < floorCount; f++) {
        const floor: MazeFloor = [];
        for (let r = 0; r < MAX_ROWS; r++) {
            const row: MazeRow = [];
            for (let c = 0; c < MAX_COLS; c++) {
                row.push(tiles[idx++]);
            }
            floor.push(row);
        }
        grid.push(floor);
    }

    return grid;
};

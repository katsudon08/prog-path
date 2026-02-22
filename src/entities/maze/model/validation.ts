import type { MazeLayer, Maze } from './types';
import { TILE_TYPE, type TileType } from './types';
import { TILE_LABELS } from './constants';

/**
 * 即時バリデーション: スタートとゴールが各1つ以下かチェック
 * @returns エラーメッセージの配列（エラーなしの場合は空配列）
 */
export const validateUniqueStartGoal = (layers: MazeLayer[]): string[] => {
    const errors: string[] = [];
    const allTiles: TileType[] = layers.flat(2);
    let startCount = 0;
    let goalCount = 0;

    for (const tile of allTiles) {
        if (tile === TILE_TYPE.START) startCount++;
        if (tile === TILE_TYPE.GOAL) goalCount++;
    }

    if (startCount > 1) {
        errors.push(
            `${TILE_LABELS[TILE_TYPE.START]}は迷路全体で1つしかおけないよ！`
        );
    }
    if (goalCount > 1) {
        errors.push(
            `${TILE_LABELS[TILE_TYPE.GOAL]}は迷路全体で1つしかおけないよ！`
        );
    }

    return errors;
};

/**
 * 即時バリデーション: 階層外テレポートがないかチェック
 * - 最上階に「上へのテレポート」がないか
 * - 最下階に「下へのテレポート」がないか
 * @returns エラーメッセージの配列
 */
export const validateTeleportFloor = (layers: MazeLayer[]): string[] => {
    const errors: string[] = [];
    const lastFloor = layers.length - 1;

    const isTeleportDown = (tile: TileType) => tile === TILE_TYPE.TELEPORT_DOWN;
    const isTeleportUp = (tile: TileType) => tile === TILE_TYPE.TELEPORT_UP;

    if (layers[0].flat().some(isTeleportDown)) {
        errors.push(
            `1Fに${TILE_LABELS[TILE_TYPE.TELEPORT_DOWN]}はおけないよ！`
        );
    }

    if (layers[lastFloor].flat().some(isTeleportUp)) {
        errors.push(
            `${layers.length}Fに${TILE_LABELS[TILE_TYPE.TELEPORT_UP]}はおけないよ！`
        );
    }

    return errors;
};

/** テレポート先として無効なタイル種別 */
const INVALID_TELEPORT_DESTINATIONS: Set<TileType> = new Set([
    TILE_TYPE.WALL,
    TILE_TYPE.HOLE,
    TILE_TYPE.TELEPORT_UP,
    TILE_TYPE.TELEPORT_DOWN,
]);

/**
 * 即時バリデーション: テレポート先座標に障害物がないかチェック
 * @returns エラーメッセージの配列
 */
export const validateTeleportTarget = (layers: MazeLayer[]): string[] => {
    const errors: string[] = [];

    const checkDestination = (
        floor: number,
        row: number,
        col: number,
        destFloor: number,
        teleportLabel: string
    ) => {
        if (destFloor < 0 || destFloor >= layers.length) return;

        const destTile = layers[destFloor][row][col];
        if (INVALID_TELEPORT_DESTINATIONS.has(destTile)) {
            errors.push(
                `${teleportLabel}（${floor + 1}F ${row},${col}）の先（${destFloor + 1}F ${row},${col}）に「${destTile}」がおかれてるよ！`
            );
        }
    };

    for (let floor = 0; floor < layers.length; floor++) {
        for (let row = 0; row < layers[floor].length; row++) {
            for (let col = 0; col < layers[floor][row].length; col++) {
                const tile = layers[floor][row][col];

                if (tile === TILE_TYPE.TELEPORT_UP) {
                    checkDestination(
                        floor,
                        row,
                        col,
                        floor + 1,
                        TILE_LABELS[TILE_TYPE.TELEPORT_UP]
                    );
                }
                if (tile === TILE_TYPE.TELEPORT_DOWN) {
                    checkDestination(
                        floor,
                        row,
                        col,
                        floor - 1,
                        TILE_LABELS[TILE_TYPE.TELEPORT_DOWN]
                    );
                }
            }
        }
    }

    return errors;
};

/**
 * 保存時バリデーション: テレポート整合性チェック
 * 各隣接階層間に双方向のテレポートが最低1組ずつ存在するか
 */
const validateTeleportIntegrity = (layers: MazeLayer[]): string[] => {
    const errors: string[] = [];

    if (layers.length <= 1) return errors;

    // 各階に指定タイルが存在するかの一覧を返す
    const hasTilePerFloor = (type: TileType) =>
        layers.map((layer) => layer.flat().some((tile) => tile === type));

    const hasUp = hasTilePerFloor(TILE_TYPE.TELEPORT_UP);
    const hasDown = hasTilePerFloor(TILE_TYPE.TELEPORT_DOWN);

    for (let floor = 0; floor < layers.length - 1; floor++) {
        if (!hasUp[floor]) {
            errors.push(
                `${floor + 1}Fから${floor + 2}Fへの${TILE_LABELS[TILE_TYPE.TELEPORT_UP]}がおかれてないよ！`
            );
        }
        if (!hasDown[floor + 1]) {
            errors.push(
                `${floor + 2}Fから${floor + 1}Fへの${TILE_LABELS[TILE_TYPE.TELEPORT_DOWN]}がおかれてないよ！`
            );
        }
    }

    return errors;
};

/** BFS用の座標 */
type Position = {
    floor: number;
    row: number;
    col: number;
};

/**
 * 保存時バリデーション: スタートからゴールへの到達可能性チェック（BFS）
 * テレポートを考慮した4方向+テレポート探索
 */
const validateReachability = (maze: Maze): string[] => {
    const { layers, size } = maze;

    // スタート位置を探す
    let startPos: Position | null = null;

    for (let floor = 0; floor < layers.length; floor++) {
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                if (layers[floor][row][col] === TILE_TYPE.START) {
                    startPos = { floor, row, col };
                }
            }
        }
    }

    if (!startPos) return [];

    // BFS
    const visited = new Set<string>();
    const queue: Position[] = [startPos];
    const toKey = (p: Position) => `${p.floor},${p.row},${p.col}`;
    visited.add(toKey(startPos));

    const directions = [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
    ];

    // 未訪問ならキューに追加
    const tryEnqueue = (dest: Position) => {
        const key = toKey(dest);
        if (visited.has(key)) return;
        visited.add(key);
        queue.push(dest);
    };

    while (queue.length > 0) {
        const current = queue.shift()!;
        const currentTile = layers[current.floor][current.row][current.col];

        if (currentTile === TILE_TYPE.GOAL) return [];

        // テレポート処理
        const TELEPORT_OFFSETS: Partial<Record<TileType, number>> = {
            [TILE_TYPE.TELEPORT_UP]: 1,
            [TILE_TYPE.TELEPORT_DOWN]: -1,
        };

        const teleportOffset = TELEPORT_OFFSETS[currentTile];
        if (teleportOffset !== undefined) {
            const destFloor = current.floor + teleportOffset;
            if (destFloor >= 0 && destFloor < layers.length) {
                tryEnqueue({
                    floor: destFloor,
                    row: current.row,
                    col: current.col,
                });
            }
        }

        // 4方向移動
        for (const [dRow, dCol] of directions) {
            const newRow = current.row + dRow;
            const newCol = current.col + dCol;

            if (newRow < 0 || newRow >= size || newCol < 0 || newCol >= size)
                continue;

            const destTile = layers[current.floor][newRow][newCol];
            if (destTile === TILE_TYPE.WALL || destTile === TILE_TYPE.HOLE)
                continue;

            tryEnqueue({ floor: current.floor, row: newRow, col: newCol });
        }
    }

    return [
        `${TILE_LABELS[TILE_TYPE.START]}から${TILE_LABELS[TILE_TYPE.GOAL]}までたどり着けないよ！`,
    ];
};

/**
 * 保存時バリデーション: 迷路全体の整合性チェック
 * - スタート/ゴール各1つ存在
 * - テレポート整合性（隣接階層間に双方向テレポート）
 * - 到達可能性（BFS）
 * @returns エラーメッセージの配列
 */
export const validateMazeForSave = (maze: Maze): string[] => {
    const errors: string[] = [];
    const { layers } = maze;
    const allTiles: TileType[] = layers.flat(2);
    let startCount = 0;
    let goalCount = 0;

    for (const tile of allTiles) {
        if (tile === TILE_TYPE.START) startCount++;
        if (tile === TILE_TYPE.GOAL) goalCount++;
    }

    if (startCount !== 1) {
        errors.push(`${TILE_LABELS[TILE_TYPE.START]}は必ず1つおいてね！`);
    }
    if (goalCount !== 1) {
        errors.push(`${TILE_LABELS[TILE_TYPE.GOAL]}は必ず1つおいてね！`);
    }

    // スタート/ゴールが不足していれば後続チェック不要
    if (startCount !== 1 || goalCount !== 1) {
        return errors;
    }

    // テレポート整合性チェック
    errors.push(...validateTeleportIntegrity(layers));

    // 到達可能性チェック
    errors.push(...validateReachability(maze));

    return errors;
};

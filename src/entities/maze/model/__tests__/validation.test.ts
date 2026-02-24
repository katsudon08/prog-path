import { describe, it, expect } from 'vitest';

import type { MazeLayer, Maze } from '../types';
import { TILE_TYPE } from '../types';
import {
    validateUniqueStartGoal,
    validateTeleportFloor,
    validateTeleportTarget,
    validateMazeForSave,
} from '../validation';

/** ヘルパー: 指定サイズの床のみの階層を生成 */
const createFloorLayer = (size: number): MazeLayer => {
    return Array.from({ length: size }, () =>
        Array.from({ length: size }, () => TILE_TYPE.FLOOR)
    );
};

/** ヘルパー: テスト用の最小限のMazeオブジェクトを生成 */
const createTestMaze = (overrides: Partial<Maze> = {}): Maze => {
    const size = overrides.size ?? 5;
    const floors = overrides.floors ?? 1;
    const layers =
        overrides.layers ??
        Array.from({ length: floors }, () => createFloorLayer(size));

    // デフォルトでスタートとゴールを設置
    if (!overrides.layers) {
        layers[0][0][0] = TILE_TYPE.START;
        layers[floors - 1][size - 1][size - 1] = TILE_TYPE.GOAL;
    }

    return {
        id: 'test-id',
        name: 'テスト迷路',
        size,
        floors,
        layers,
        folderId: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...overrides,
    };
};

// ============================================================
// validateUniqueStartGoal
// ============================================================
describe('validateUniqueStartGoal', () => {
    it('スタートとゴールが各1つの場合、エラーを返さない', () => {
        const layer = createFloorLayer(5);
        layer[0][0] = TILE_TYPE.START;
        layer[4][4] = TILE_TYPE.GOAL;

        const result = validateUniqueStartGoal([layer]);
        expect(result).toEqual([]);
    });

    it('スタートが2つある場合、エラーを返す', () => {
        const layer = createFloorLayer(5);
        layer[0][0] = TILE_TYPE.START;
        layer[1][1] = TILE_TYPE.START;
        layer[4][4] = TILE_TYPE.GOAL;

        const result = validateUniqueStartGoal([layer]);
        expect(result.length).toBeGreaterThan(0);
        expect(result.some((e) => e.includes('スタート'))).toBe(true);
    });

    it('ゴールが2つある場合、エラーを返す', () => {
        const layer = createFloorLayer(5);
        layer[0][0] = TILE_TYPE.START;
        layer[3][3] = TILE_TYPE.GOAL;
        layer[4][4] = TILE_TYPE.GOAL;

        const result = validateUniqueStartGoal([layer]);
        expect(result.length).toBeGreaterThan(0);
        expect(result.some((e) => e.includes('ゴール'))).toBe(true);
    });

    it('複数階層にまたがってスタートが2つある場合、エラーを返す', () => {
        const layer1 = createFloorLayer(5);
        const layer2 = createFloorLayer(5);
        layer1[0][0] = TILE_TYPE.START;
        layer2[0][0] = TILE_TYPE.START;

        const result = validateUniqueStartGoal([layer1, layer2]);
        expect(result.length).toBeGreaterThan(0);
        expect(result.some((e) => e.includes('スタート'))).toBe(true);
    });

    it('スタートもゴールもない場合、エラーを返さない（配置時チェックでは0個も許容）', () => {
        const layer = createFloorLayer(5);

        const result = validateUniqueStartGoal([layer]);
        expect(result).toEqual([]);
    });
});

// ============================================================
// validateTeleportFloor
// ============================================================
describe('validateTeleportFloor', () => {
    it('階層内に適切なテレポートがある場合、エラーを返さない', () => {
        const layer1 = createFloorLayer(5);
        const layer2 = createFloorLayer(5);
        layer1[2][2] = TILE_TYPE.TELEPORT_UP;
        layer2[2][2] = TILE_TYPE.TELEPORT_DOWN;

        const result = validateTeleportFloor([layer1, layer2]);
        expect(result).toEqual([]);
    });

    it('最上階に上テレポートがある場合、エラーを返す', () => {
        const layer1 = createFloorLayer(5);
        const layer2 = createFloorLayer(5);
        layer2[2][2] = TILE_TYPE.TELEPORT_UP;

        const result = validateTeleportFloor([layer1, layer2]);
        expect(result.length).toBeGreaterThan(0);
    });

    it('最下階に下テレポートがある場合、エラーを返す', () => {
        const layer1 = createFloorLayer(5);
        const layer2 = createFloorLayer(5);
        layer1[2][2] = TILE_TYPE.TELEPORT_DOWN;

        const result = validateTeleportFloor([layer1, layer2]);
        expect(result.length).toBeGreaterThan(0);
    });

    it('1階のみの迷路に上テレポートがある場合、エラーを返す', () => {
        const layer = createFloorLayer(5);
        layer[2][2] = TILE_TYPE.TELEPORT_UP;

        const result = validateTeleportFloor([layer]);
        expect(result.length).toBeGreaterThan(0);
    });

    it('1階のみの迷路に下テレポートがある場合、エラーを返す', () => {
        const layer = createFloorLayer(5);
        layer[2][2] = TILE_TYPE.TELEPORT_DOWN;

        const result = validateTeleportFloor([layer]);
        expect(result.length).toBeGreaterThan(0);
    });

    it('テレポートなしの場合、エラーを返さない', () => {
        const layer = createFloorLayer(5);
        const result = validateTeleportFloor([layer]);
        expect(result).toEqual([]);
    });
});

// ============================================================
// validateTeleportTarget
// ============================================================
describe('validateTeleportTarget', () => {
    it('テレポート先が床の場合、エラーを返さない', () => {
        const layer1 = createFloorLayer(5);
        const layer2 = createFloorLayer(5);
        layer1[2][2] = TILE_TYPE.TELEPORT_UP;
        // layer2[2][2] はデフォルトで FLOOR

        const result = validateTeleportTarget([layer1, layer2]);
        expect(result).toEqual([]);
    });

    it('テレポート先が壁の場合、エラーを返す', () => {
        const layer1 = createFloorLayer(5);
        const layer2 = createFloorLayer(5);
        layer1[2][2] = TILE_TYPE.TELEPORT_UP;
        layer2[2][2] = TILE_TYPE.WALL;

        const result = validateTeleportTarget([layer1, layer2]);
        expect(result.length).toBeGreaterThan(0);
    });

    it('テレポート先が穴の場合、エラーを返す', () => {
        const layer1 = createFloorLayer(5);
        const layer2 = createFloorLayer(5);
        layer1[2][2] = TILE_TYPE.TELEPORT_UP;
        layer2[2][2] = TILE_TYPE.HOLE;

        const result = validateTeleportTarget([layer1, layer2]);
        expect(result.length).toBeGreaterThan(0);
    });

    it('テレポート先がテレポートの場合、エラーを返す', () => {
        const layer1 = createFloorLayer(5);
        const layer2 = createFloorLayer(5);
        layer1[2][2] = TILE_TYPE.TELEPORT_UP;
        layer2[2][2] = TILE_TYPE.TELEPORT_UP;

        const result = validateTeleportTarget([layer1, layer2]);
        expect(result.length).toBeGreaterThan(0);
    });

    it('下テレポートの場合も、テレポート先が壁ならエラーを返す', () => {
        const layer1 = createFloorLayer(5);
        const layer2 = createFloorLayer(5);
        layer2[3][3] = TILE_TYPE.TELEPORT_DOWN;
        layer1[3][3] = TILE_TYPE.WALL;

        const result = validateTeleportTarget([layer1, layer2]);
        expect(result.length).toBeGreaterThan(0);
    });

    it('テレポート先がスタートの場合、エラーを返さない', () => {
        const layer1 = createFloorLayer(5);
        const layer2 = createFloorLayer(5);
        layer1[2][2] = TILE_TYPE.TELEPORT_UP;
        layer2[2][2] = TILE_TYPE.START;

        const result = validateTeleportTarget([layer1, layer2]);
        expect(result).toEqual([]);
    });

    it('テレポートがない場合、エラーを返さない', () => {
        const layer = createFloorLayer(5);
        const result = validateTeleportTarget([layer]);
        expect(result).toEqual([]);
    });
});

// ============================================================
// validateMazeForSave
// ============================================================
describe('validateMazeForSave', () => {
    it('正常な1階建て迷路の場合、エラーを返さない', () => {
        const maze = createTestMaze();
        const result = validateMazeForSave(maze);
        expect(result).toEqual([]);
    });

    it('スタートがない場合、エラーを返す', () => {
        const layer = createFloorLayer(5);
        layer[4][4] = TILE_TYPE.GOAL;
        const maze = createTestMaze({ layers: [layer] });

        const result = validateMazeForSave(maze);
        expect(result.length).toBeGreaterThan(0);
        expect(result.some((e) => e.includes('スタート'))).toBe(true);
    });

    it('ゴールがない場合、エラーを返す', () => {
        const layer = createFloorLayer(5);
        layer[0][0] = TILE_TYPE.START;
        const maze = createTestMaze({ layers: [layer] });

        const result = validateMazeForSave(maze);
        expect(result.length).toBeGreaterThan(0);
        expect(result.some((e) => e.includes('ゴール'))).toBe(true);
    });

    it('2階建てで階層間テレポートがない場合、エラーを返す', () => {
        const layer1 = createFloorLayer(5);
        const layer2 = createFloorLayer(5);
        layer1[0][0] = TILE_TYPE.START;
        layer2[4][4] = TILE_TYPE.GOAL;
        const maze = createTestMaze({
            floors: 2,
            layers: [layer1, layer2],
        });

        const result = validateMazeForSave(maze);
        expect(result.length).toBeGreaterThan(0);
    });

    it('2階建てで片方向のテレポートしかない場合、エラーを返す', () => {
        const layer1 = createFloorLayer(5);
        const layer2 = createFloorLayer(5);
        layer1[0][0] = TILE_TYPE.START;
        layer1[2][2] = TILE_TYPE.TELEPORT_UP;
        layer2[4][4] = TILE_TYPE.GOAL;
        // 2階→1階のテレポートがない
        const maze = createTestMaze({
            floors: 2,
            layers: [layer1, layer2],
        });

        const result = validateMazeForSave(maze);
        expect(result.length).toBeGreaterThan(0);
    });

    it('2階建てで双方向テレポートがある場合、テレポートエラーを返さない', () => {
        const layer1 = createFloorLayer(5);
        const layer2 = createFloorLayer(5);
        layer1[0][0] = TILE_TYPE.START;
        layer1[2][2] = TILE_TYPE.TELEPORT_UP;
        layer2[2][2] = TILE_TYPE.FLOOR;
        layer2[3][3] = TILE_TYPE.TELEPORT_DOWN;
        layer1[3][3] = TILE_TYPE.FLOOR;
        layer2[4][4] = TILE_TYPE.GOAL;
        const maze = createTestMaze({
            floors: 2,
            layers: [layer1, layer2],
        });

        const result = validateMazeForSave(maze);
        // テレポート整合性エラーは出ないが、到達可能性は別途チェック
        const teleportErrors = result.filter((e) => e.includes('テレポート'));
        expect(teleportErrors).toEqual([]);
    });

    it('3階建てで1-2階間のテレポートしかない場合、エラーを返す', () => {
        const layer1 = createFloorLayer(5);
        const layer2 = createFloorLayer(5);
        const layer3 = createFloorLayer(5);
        layer1[0][0] = TILE_TYPE.START;
        layer1[2][2] = TILE_TYPE.TELEPORT_UP;
        layer2[3][3] = TILE_TYPE.TELEPORT_DOWN;
        // 2-3階間のテレポートなし
        layer3[4][4] = TILE_TYPE.GOAL;
        const maze = createTestMaze({
            floors: 3,
            layers: [layer1, layer2, layer3],
        });

        const result = validateMazeForSave(maze);
        expect(result.length).toBeGreaterThan(0);
    });

    it('スタートからゴールまで到達可能な場合、到達可能性エラーを返さない', () => {
        const layer = createFloorLayer(5);
        layer[0][0] = TILE_TYPE.START;
        layer[0][4] = TILE_TYPE.GOAL;
        const maze = createTestMaze({ layers: [layer] });

        const result = validateMazeForSave(maze);
        expect(result).toEqual([]);
    });

    it('スタートからゴールまで到達不可能な場合、エラーを返す', () => {
        const layer = createFloorLayer(5);
        layer[0][0] = TILE_TYPE.START;
        layer[4][4] = TILE_TYPE.GOAL;
        // 1行目を壁で完全に塞ぐ
        for (let col = 0; col < 5; col++) {
            layer[1][col] = TILE_TYPE.WALL;
        }
        // スタートがある0行目から先に進めない
        const maze = createTestMaze({ layers: [layer] });

        const result = validateMazeForSave(maze);
        expect(result.some((e) => e.includes('たどり着けない'))).toBe(true);
    });

    it('テレポートを使えばゴールに到達可能な場合、エラーを返さない', () => {
        const layer1 = createFloorLayer(5);
        const layer2 = createFloorLayer(5);
        layer1[0][0] = TILE_TYPE.START;
        layer1[0][1] = TILE_TYPE.TELEPORT_UP;
        layer2[0][1] = TILE_TYPE.FLOOR;
        layer2[1][1] = TILE_TYPE.TELEPORT_DOWN;
        layer1[1][1] = TILE_TYPE.FLOOR;
        layer2[4][4] = TILE_TYPE.GOAL;
        const maze = createTestMaze({
            floors: 2,
            layers: [layer1, layer2],
        });

        const result = validateMazeForSave(maze);
        expect(result).toEqual([]);
    });
});

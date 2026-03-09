import { describe, it, expect, beforeEach } from 'vitest';
import { encodeMazeToRle, decodeMazeFromRle } from '../lib/maze-rle';
import { validateMazeGrid } from '../lib/maze-validation';
import { useMazeGridStore } from '../model/maze-grid-store';
import type { MazeGrid, MazeFloor, TileType } from '../model/maze-grid-types';

// ── ヘルパー ──

/** 指定タイルで埋めた 7×7 の1階層を生成 */
const createFloor = (tile: TileType): MazeFloor =>
    Array.from({ length: 7 }, () => Array.from({ length: 7 }, () => tile));

/** スタートとゴールを1つずつ含む有効な1階層迷路を生成 */
const createValidSingleFloorGrid = (): MazeGrid => {
    const floor = createFloor('floor');
    floor[0][0] = 'start';
    floor[6][6] = 'goal';
    return [floor];
};

// ── encodeMazeToRle ──

describe('encodeMazeToRle', () => {
    it('全床の1階層迷路を正しくRLE圧縮する', () => {
        const grid: MazeGrid = [createFloor('floor')];
        const encoded = encodeMazeToRle(grid);

        expect(encoded).toBe('M:49F');
    });

    it('出力に M: プレフィックスが付く', () => {
        const grid = createValidSingleFloorGrid();
        const encoded = encodeMazeToRle(grid);

        expect(encoded.startsWith('M:')).toBe(true);
    });

    it('複数タイル種別を含む迷路を正しくエンコードする', () => {
        const grid = createValidSingleFloorGrid();
        // [0][0]=start, [0][1..6]=floor, [1..5]=all floor, [6][0..5]=floor, [6][6]=goal
        const encoded = encodeMazeToRle(grid);
        // start(1) + floor(47) + goal(1) = 49 tiles
        // 1S + 47F + 1G
        expect(encoded).toBe('M:1S47F1G');
    });
});

// ── decodeMazeFromRle ──

describe('decodeMazeFromRle', () => {
    it('有効なRLE文字列が正確な3次元配列に復元される', () => {
        const encoded = 'M:49F';
        const grid = decodeMazeFromRle(encoded);

        expect(grid).toHaveLength(1);
        expect(grid[0]).toHaveLength(7);
        for (const row of grid[0]) {
            expect(row).toHaveLength(7);
            for (const tile of row) {
                expect(tile).toBe('floor');
            }
        }
    });

    it('M: プレフィックスがない場合にエラーをスローする', () => {
        expect(() => decodeMazeFromRle('49F')).toThrow('プレフィックス');
    });

    it('不正なタイル文字を含む場合にエラーをスローする', () => {
        expect(() => decodeMazeFromRle('M:49X')).toThrow('不正なタイル文字');
    });

    it('サイズが7×7の倍数でない場合にエラーをスローする', () => {
        expect(() => decodeMazeFromRle('M:10F')).toThrow('倍数');
    });

    it('3階層を超える場合にエラーをスローする', () => {
        // 4階層 = 7*7*4 = 196
        expect(() => decodeMazeFromRle('M:196F')).toThrow('最大値');
    });

    it('空文字列でエラーをスローする', () => {
        expect(() => decodeMazeFromRle('')).toThrow('プレフィックス');
    });

    it('プレフィックスのみでRLEデータが空の場合にエラーをスローする', () => {
        expect(() => decodeMazeFromRle('M:')).toThrow('空です');
    });

    it('2階層の迷路を正しくデコードする', () => {
        // 2階層 = 7*7*2 = 98
        const encoded = 'M:98F';
        const grid = decodeMazeFromRle(encoded);

        expect(grid).toHaveLength(2);
        expect(grid[0]).toHaveLength(7);
        expect(grid[1]).toHaveLength(7);
    });

    it('テレポート上下を正しくデコードする', () => {
        // 1U + 47F + 1D = 49
        const encoded = 'M:1U47F1D';
        const grid = decodeMazeFromRle(encoded);

        expect(grid[0][0][0]).toBe('teleport-up');
        expect(grid[0][6][6]).toBe('teleport-down');
    });
});

// ── ラウンドトリップ ──

describe('RLE ラウンドトリップ', () => {
    it('エンコード→デコードで元データと一致する', () => {
        const original = createValidSingleFloorGrid();
        const encoded = encodeMazeToRle(original);
        const decoded = decodeMazeFromRle(encoded);

        expect(decoded).toEqual(original);
    });

    it('全7種タイルを含むグリッドでラウンドトリップが成功する', () => {
        const floor = createFloor('floor');
        floor[0][0] = 'start';
        floor[0][1] = 'goal';
        floor[0][2] = 'wall';
        floor[0][3] = 'key';
        floor[0][4] = 'teleport-up';
        floor[0][5] = 'teleport-down';
        // floor[0][6] は floor のまま
        const grid: MazeGrid = [floor];

        const encoded = encodeMazeToRle(grid);
        const decoded = decodeMazeFromRle(encoded);

        expect(decoded).toEqual(grid);
    });
});

// ── validateMazeGrid ──

describe('validateMazeGrid', () => {
    it('有効な迷路でエラーをスローしない', () => {
        const grid = createValidSingleFloorGrid();

        expect(() => validateMazeGrid(grid)).not.toThrow();
    });

    it('スタートが0個のときエラーをスローする', () => {
        const floor = createFloor('floor');
        floor[6][6] = 'goal';

        expect(() => validateMazeGrid([floor])).toThrow('スタート');
    });

    it('スタートが2個以上のときエラーをスローする', () => {
        const floor = createFloor('floor');
        floor[0][0] = 'start';
        floor[0][1] = 'start';
        floor[6][6] = 'goal';

        expect(() => validateMazeGrid([floor])).toThrow('スタート');
    });

    it('ゴールが0個のときエラーをスローする', () => {
        const floor = createFloor('floor');
        floor[0][0] = 'start';

        expect(() => validateMazeGrid([floor])).toThrow('ゴール');
    });

    it('ゴールが2個以上のときエラーをスローする', () => {
        const floor = createFloor('floor');
        floor[0][0] = 'start';
        floor[6][5] = 'goal';
        floor[6][6] = 'goal';

        expect(() => validateMazeGrid([floor])).toThrow('ゴール');
    });

    it('階層数が0のときエラーをスローする', () => {
        expect(() => validateMazeGrid([])).toThrow('階層数');
    });

    it('階層数が4以上のときエラーをスローする', () => {
        const grid: MazeGrid = Array.from({ length: 4 }, () => createFloor('floor'));

        expect(() => validateMazeGrid(grid)).toThrow('階層数');
    });

    it('行数が7でないときエラーをスローする', () => {
        const floor = createFloor('floor').slice(0, 5); // 5行
        expect(() => validateMazeGrid([floor])).toThrow('行数');
    });

    it('列数が7でないときエラーをスローする', () => {
        const floor = createFloor('floor');
        floor[3] = floor[3].slice(0, 4); // 行3を4列に
        expect(() => validateMazeGrid([floor])).toThrow('列数');
    });
});

// ── useMazeGridStore ──

describe('useMazeGridStore', () => {
    beforeEach(() => {
        useMazeGridStore.getState().clear();
    });

    it('loadFromRle で有効な文字列を渡すと grid が設定される', () => {
        const grid = createValidSingleFloorGrid();
        const encoded = encodeMazeToRle(grid);

        useMazeGridStore.getState().loadFromRle(encoded);
        const state = useMazeGridStore.getState();

        expect(state.grid).toEqual(grid);
        expect(state.error).toBeNull();
    });

    it('loadFromRle で不正な文字列を渡すと error が設定される', () => {
        useMazeGridStore.getState().loadFromRle('invalid');
        const state = useMazeGridStore.getState();

        expect(state.grid).toBeNull();
        expect(state.error).toBeTruthy();
    });

    it('loadFromRle でバリデーション違反（スタートなし）の場合 error が設定される', () => {
        // 49F = 全床なのでスタートもゴールもない
        useMazeGridStore.getState().loadFromRle('M:49F');
        const state = useMazeGridStore.getState();

        expect(state.grid).toBeNull();
        expect(state.error).toContain('スタート');
    });

    it('clear で状態がリセットされる', () => {
        const grid = createValidSingleFloorGrid();
        const encoded = encodeMazeToRle(grid);

        useMazeGridStore.getState().loadFromRle(encoded);
        useMazeGridStore.getState().clear();
        const state = useMazeGridStore.getState();

        expect(state.grid).toBeNull();
        expect(state.error).toBeNull();
    });
});

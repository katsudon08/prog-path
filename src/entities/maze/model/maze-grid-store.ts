/**
 * デコード済み迷路グリッドの状態管理Store
 */
import { create } from 'zustand';
import { decodeMazeFromRle } from '../lib/maze-rle';
import { validateMazeGrid } from '../lib/maze-validation';
import type { MazeGrid } from './maze-grid-types';

type MazeGridStore = {
    grid: MazeGrid | null;
    error: string | null;
    loadFromRle: (encoded: string) => void;
    clear: () => void;
};

export const useMazeGridStore = create<MazeGridStore>((set) => ({
    grid: null,
    error: null,

    loadFromRle: (encoded: string) => {
        try {
            const grid = decodeMazeFromRle(encoded);
            validateMazeGrid(grid);
            set({ grid, error: null });
        } catch (e) {
            const message = e instanceof Error ? e.message : '不明なエラーが発生しました';
            set({ grid: null, error: message });
        }
    },

    clear: () => set({ grid: null, error: null }),
}));

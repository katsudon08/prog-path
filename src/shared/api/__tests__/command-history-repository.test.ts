import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import { addMaze } from '../maze-repository';
import {
    addCommandHistory,
    getHistoriesByMazeId,
    deleteHistory,
} from '../command-history-repository';

beforeEach(async () => {
    await db.commandHistories.clear();
    await db.mazes.clear();
});

describe('command-history-repository', () => {
    const createTestHistory = (mazeId: number) => ({
        mazeId,
        commands: JSON.stringify([{ type: 'forward' }, { type: 'right' }]),
        result: 'success' as const,
        createdAt: new Date(),
    });

    it('addCommandHistory で追加した履歴を getHistoriesByMazeId で取得できる', async () => {
        const mazeId = await addMaze({
            name: 'テスト迷路',
            data: 'M:1A',
            createdAt: new Date(),
        });

        await addCommandHistory(createTestHistory(mazeId));
        const histories = await getHistoriesByMazeId(mazeId);

        expect(histories).toHaveLength(1);
        expect(histories[0].mazeId).toBe(mazeId);
        expect(histories[0].result).toBe('success');
    });

    it('異なる mazeId の履歴は取得されない', async () => {
        const mazeId1 = await addMaze({
            name: '迷路1',
            data: 'M:1A',
            createdAt: new Date(),
        });
        const mazeId2 = await addMaze({
            name: '迷路2',
            data: 'M:2B',
            createdAt: new Date(),
        });

        await addCommandHistory(createTestHistory(mazeId1));
        await addCommandHistory(createTestHistory(mazeId2));

        const histories = await getHistoriesByMazeId(mazeId1);
        expect(histories).toHaveLength(1);
        expect(histories[0].mazeId).toBe(mazeId1);
    });

    it('deleteHistory で削除後に取得できない', async () => {
        const mazeId = await addMaze({
            name: 'テスト迷路',
            data: 'M:1A',
            createdAt: new Date(),
        });

        const historyId = await addCommandHistory(createTestHistory(mazeId));
        await deleteHistory(historyId);

        const histories = await getHistoriesByMazeId(mazeId);
        expect(histories).toHaveLength(0);
    });
});

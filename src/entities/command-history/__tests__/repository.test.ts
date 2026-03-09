import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { CommandHistory } from '../model/types';
import { createCommandHistoryRepository } from '../model/repository';

class TestDB extends Dexie {
    commandHistories!: Table<CommandHistory, number>;

    constructor() {
        super('TestDB_CommandHistory');
        this.version(1).stores({
            commandHistories: '++id, mazeId, createdAt',
        });
    }
}

const testDb = new TestDB();
const repo = createCommandHistoryRepository(testDb.commandHistories);

// 各テストの前に実行
beforeEach(async () => {
    await testDb.commandHistories.clear();
});

// 各テストの後に実行
afterEach(async () => {
    await testDb.commandHistories.clear();
});

describe('command-history repository', () => {
    const createTestHistory = (mazeId: number): Omit<CommandHistory, 'id'> => ({
        mazeId,
        commands: JSON.stringify([{ type: 'forward' }, { type: 'right' }]),
        result: true,
        createdAt: Date.now(),
    });

    it('add で追加した履歴を getByMazeId で取得できる', async () => {
        await repo.add(createTestHistory(1));
        const histories = await repo.getByMazeId(1);

        expect(histories).toHaveLength(1);
        expect(histories[0].mazeId).toBe(1);
        expect(histories[0].result).toBe(true);
    });

    it('異なる mazeId の履歴は取得されない', async () => {
        await repo.add(createTestHistory(1));
        await repo.add(createTestHistory(2));

        const histories = await repo.getByMazeId(1);
        expect(histories).toHaveLength(1);
        expect(histories[0].mazeId).toBe(1);
    });

    it('delete で削除後に取得できない', async () => {
        const historyId = await repo.add(createTestHistory(1));
        await repo.delete(historyId);

        const histories = await repo.getByMazeId(1);
        expect(histories).toHaveLength(0);
    });
});

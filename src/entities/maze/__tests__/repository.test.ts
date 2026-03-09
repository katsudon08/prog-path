import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Maze } from '../model/types';
import { createMazeRepository } from '../model/repository';

class TestDB extends Dexie {
    mazes!: Table<Maze, number>;

    constructor() {
        super('TestDB_Maze');
        this.version(1).stores({
            mazes: '++id, name, createdAt',
        });
    }
}

const testDb = new TestDB();
const repo = createMazeRepository(testDb.mazes);

// 各テストの前に実行
beforeEach(async () => {
    await testDb.mazes.clear();
});

// 各テストの後に実行
afterEach(async () => {
    await testDb.mazes.clear();
});

describe('maze repository', () => {
    const createTestMaze = (name: string): Omit<Maze, 'id'> => ({
        name,
        data: 'M:5A2B1A',
        createdAt: Date.now(),
    });

    it('add で追加した迷路を getByName で取得できる', async () => {
        await repo.add(createTestMaze('テスト迷路'));
        const maze = await repo.getByName('テスト迷路');

        expect(maze).toBeDefined();
        expect(maze!.name).toBe('テスト迷路');
        expect(maze!.data).toBe('M:5A2B1A');
    });

    it('getAll が作成日降順で返す', async () => {
        await repo.add({
            name: '古い迷路',
            data: 'M:1A',
            createdAt: new Date('2026-01-01').getTime(),
        });
        await repo.add({
            name: '新しい迷路',
            data: 'M:2B',
            createdAt: new Date('2026-03-01').getTime(),
        });

        const mazes = await repo.getAll();

        expect(mazes).toHaveLength(2);
        expect(mazes[0].name).toBe('新しい迷路');
        expect(mazes[1].name).toBe('古い迷路');
    });

    it('delete で削除後に取得できない', async () => {
        const id = await repo.add(createTestMaze('削除対象'));
        await repo.delete(id);
        const maze = await repo.getByName('削除対象');

        expect(maze).toBeUndefined();
    });

    it('存在しない name で getByName すると undefined を返す', async () => {
        const maze = await repo.getByName('存在しない迷路');
        expect(maze).toBeUndefined();
    });
});

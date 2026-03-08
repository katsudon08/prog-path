import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import { addMaze, getAllMazes, getMazeById, deleteMaze } from '../maze-repository';

beforeEach(async () => {
    await db.mazes.clear();
});

describe('maze-repository', () => {
    const createTestMaze = (name: string) => ({
        name,
        data: 'M:5A2B1A',
        createdAt: new Date(),
    });

    it('addMaze で追加した迷路を getMazeById で取得できる', async () => {
        const id = await addMaze(createTestMaze('テスト迷路'));
        const maze = await getMazeById(id);

        expect(maze).toBeDefined();
        expect(maze!.name).toBe('テスト迷路');
        expect(maze!.data).toBe('M:5A2B1A');
    });

    it('getAllMazes が作成日降順で返す', async () => {
        await addMaze({ name: '古い迷路', data: 'M:1A', createdAt: new Date('2026-01-01') });
        await addMaze({ name: '新しい迷路', data: 'M:2B', createdAt: new Date('2026-03-01') });

        const mazes = await getAllMazes();

        expect(mazes).toHaveLength(2);
        expect(mazes[0].name).toBe('新しい迷路');
        expect(mazes[1].name).toBe('古い迷路');
    });

    it('deleteMaze で削除後に取得できない', async () => {
        const id = await addMaze(createTestMaze('削除対象'));
        await deleteMaze(id);
        const maze = await getMazeById(id);

        expect(maze).toBeUndefined();
    });

    it('存在しない ID で getMazeById すると undefined を返す', async () => {
        const maze = await getMazeById(99999);
        expect(maze).toBeUndefined();
    });
});

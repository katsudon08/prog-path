import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';

import type { Maze } from '@/entities/maze';
import { TILE_TYPE } from '@/entities/maze';
import { db } from '@/shared/api/db';
import {
    getAllMazes,
    getMazeById,
    createMaze,
    updateMaze,
    deleteMaze,
    getMazesByFolderId,
} from '../maze-repository';

const createTestMazeData = (overrides: Partial<Maze> = {}): Maze => {
    const size = overrides.size ?? 5;
    const floors = overrides.floors ?? 1;
    const layers =
        overrides.layers ??
        Array.from({ length: floors }, () =>
            Array.from({ length: size }, () =>
                Array.from({ length: size }, () => TILE_TYPE.FLOOR)
            )
        );

    return {
        id: overrides.id ?? crypto.randomUUID(),
        name: overrides.name ?? 'テスト迷路',
        size,
        floors,
        layers,
        folderId: overrides.folderId ?? null,
        createdAt: overrides.createdAt ?? Date.now(),
        updatedAt: overrides.updatedAt ?? Date.now(),
    };
};

beforeEach(async () => {
    // テストごとにテーブルをクリア
    await db.mazes.clear();
});

describe('maze-repository', () => {
    describe('createMaze', () => {
        it('迷路を作成し、IDを返す', async () => {
            const maze = createTestMazeData();
            const id = await createMaze(maze);
            expect(id).toBe(maze.id);
        });
    });

    describe('getAllMazes', () => {
        it('全迷路を取得する', async () => {
            const maze1 = createTestMazeData({ name: '迷路1' });
            const maze2 = createTestMazeData({ name: '迷路2' });
            await createMaze(maze1);
            await createMaze(maze2);

            const result = await getAllMazes();
            expect(result).toHaveLength(2);
        });

        it('迷路がない場合は空配列を返す', async () => {
            const result = await getAllMazes();
            expect(result).toEqual([]);
        });
    });

    describe('getMazeById', () => {
        it('IDで迷路を取得する', async () => {
            const maze = createTestMazeData();
            await createMaze(maze);

            const result = await getMazeById(maze.id);
            expect(result).toBeDefined();
            expect(result!.name).toBe(maze.name);
        });

        it('存在しないIDの場合はundefinedを返す', async () => {
            const result = await getMazeById('non-existent-id');
            expect(result).toBeUndefined();
        });
    });

    describe('updateMaze', () => {
        it('迷路を更新する', async () => {
            const maze = createTestMazeData();
            await createMaze(maze);

            const updated = { ...maze, name: '更新された迷路' };
            await updateMaze(updated);

            const result = await getMazeById(maze.id);
            expect(result!.name).toBe('更新された迷路');
        });
    });

    describe('deleteMaze', () => {
        it('迷路を削除する', async () => {
            const maze = createTestMazeData();
            await createMaze(maze);
            await deleteMaze(maze.id);

            const result = await getMazeById(maze.id);
            expect(result).toBeUndefined();
        });
    });

    describe('getMazesByFolderId', () => {
        it('フォルダIDで迷路をフィルタする', async () => {
            const folderId = 'folder-1';
            const maze1 = createTestMazeData({
                name: '迷路A',
                folderId,
            });
            const maze2 = createTestMazeData({
                name: '迷路B',
                folderId,
            });
            const maze3 = createTestMazeData({
                name: '迷路C',
                folderId: 'folder-2',
            });
            await createMaze(maze1);
            await createMaze(maze2);
            await createMaze(maze3);

            const result = await getMazesByFolderId(folderId);
            expect(result).toHaveLength(2);
            expect(result.every((m) => m.folderId === folderId)).toBe(true);
        });

        it('該当フォルダに迷路がない場合は空配列を返す', async () => {
            const result = await getMazesByFolderId('empty-folder');
            expect(result).toEqual([]);
        });
    });
});

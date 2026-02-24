import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';

import type { Folder } from '@/entities/folder';
import { db } from '@/shared/api/db';
import {
    getAllFolders,
    createFolder,
    updateFolder,
    deleteFolder,
} from '../folder-repository';

const createTestFolderData = (overrides: Partial<Folder> = {}): Folder => {
    return {
        id: overrides.id ?? crypto.randomUUID(),
        name: overrides.name ?? 'テストフォルダ',
        createdAt: overrides.createdAt ?? Date.now(),
        updatedAt: overrides.updatedAt ?? Date.now(),
    };
};

beforeEach(async () => {
    // テストごとにテーブルをクリア
    await db.folders.clear();
});

describe('folder-repository', () => {
    describe('createFolder', () => {
        it('フォルダを作成し、IDを返す', async () => {
            const folder = createTestFolderData();
            const id = await createFolder(folder);
            expect(id).toBe(folder.id);
        });
    });

    describe('getAllFolders', () => {
        it('全フォルダを取得する', async () => {
            const folder1 = createTestFolderData({ name: 'フォルダ1' });
            const folder2 = createTestFolderData({ name: 'フォルダ2' });
            await createFolder(folder1);
            await createFolder(folder2);

            const result = await getAllFolders();
            expect(result).toHaveLength(2);
        });

        it('フォルダがない場合は空配列を返す', async () => {
            const result = await getAllFolders();
            expect(result).toEqual([]);
        });
    });

    describe('updateFolder', () => {
        it('フォルダを更新する', async () => {
            const folder = createTestFolderData();
            await createFolder(folder);

            const updated = { ...folder, name: '更新フォルダ' };
            await updateFolder(updated);

            const all = await getAllFolders();
            expect(all[0].name).toBe('更新フォルダ');
        });
    });

    describe('deleteFolder', () => {
        it('フォルダを削除する', async () => {
            const folder = createTestFolderData();
            await createFolder(folder);
            await deleteFolder(folder.id);

            const result = await getAllFolders();
            expect(result).toEqual([]);
        });
    });
});

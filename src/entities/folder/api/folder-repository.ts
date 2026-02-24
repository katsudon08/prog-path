import type { Folder } from '../model/types';
import { db } from '@/shared/api/db';

export const getAllFolders = async (): Promise<Folder[]> => {
    return db.folders.toArray();
};

export const createFolder = async (folder: Folder): Promise<string> => {
    await db.folders.add(folder);
    return folder.id;
};

export const updateFolder = async (folder: Folder): Promise<void> => {
    await db.folders.put(folder);
};

export const deleteFolder = async (id: string): Promise<void> => {
    await db.folders.delete(id);
};

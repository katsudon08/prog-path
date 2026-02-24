import type { Maze } from '../model/types';
import { db } from '@/shared/api/db';

export const getAllMazes = async (): Promise<Maze[]> => {
    return db.mazes.toArray();
};

export const getMazeById = async (id: string): Promise<Maze | undefined> => {
    return db.mazes.get(id);
};

export const createMaze = async (maze: Maze): Promise<string> => {
    await db.mazes.add(maze);
    return maze.id;
};

export const updateMaze = async (maze: Maze): Promise<void> => {
    await db.mazes.put(maze);
};

export const deleteMaze = async (id: string): Promise<void> => {
    await db.mazes.delete(id);
};

export const getMazesByFolderId = async (folderId: string): Promise<Maze[]> => {
    return db.mazes.where('folderId').equals(folderId).toArray();
};

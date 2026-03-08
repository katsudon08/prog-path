import { db } from './db';
import type { Maze } from './types';

export const addMaze = async (maze: Omit<Maze, 'id'>): Promise<number> => {
    return await db.mazes.add(maze);
};

export const getAllMazes = async (): Promise<Maze[]> => {
    return await db.mazes.orderBy('createdAt').reverse().toArray();
};

export const getMazeById = async (id: number): Promise<Maze | undefined> => {
    return await db.mazes.get(id);
};

export const deleteMaze = async (id: number): Promise<void> => {
    await db.mazes.delete(id);
};

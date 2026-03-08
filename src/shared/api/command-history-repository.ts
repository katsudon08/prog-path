import { db } from './db';
import type { CommandHistory } from './types';

export const addCommandHistory = async (
    history: Omit<CommandHistory, 'id'>,
): Promise<number> => {
    return await db.commandHistories.add(history);
};

export const getHistoriesByMazeId = async (
    mazeId: number,
): Promise<CommandHistory[]> => {
    return await db.commandHistories
        .where('mazeId')
        .equals(mazeId)
        .reverse()
        .sortBy('createdAt');
};

export const deleteHistory = async (id: number): Promise<void> => {
    await db.commandHistories.delete(id);
};

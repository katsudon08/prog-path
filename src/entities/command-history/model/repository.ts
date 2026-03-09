import type { Table } from 'dexie';
import type { CommandHistory } from './types';

export const createCommandHistoryRepository = (
    table: Table<CommandHistory, number>,
) => ({
    add: async (input: Omit<CommandHistory, 'id'>) => {
        return await table.add(input);
    },

    getByMazeId: async (mazeId: number) => {
        return await table
            .where('mazeId')
            .equals(mazeId)
            .reverse()
            .sortBy('createdAt');
    },

    delete: async (id: number) => {
        await table.delete(id);
    },
});

export type CommandHistoryRepository = ReturnType<
    typeof createCommandHistoryRepository
>;

import type { Table } from 'dexie';
import type { Maze } from './types';

export const createMazeRepository = (table: Table<Maze, number>) => ({
    add: async (input: Omit<Maze, 'id'>) => {
        return await table.add(input);
    },

    getAll: async () => {
        return await table.orderBy('createdAt').reverse().toArray();
    },

    getByName: async (name: string) => {
        return await table.where('name').equals(name).first();
    },

    update: async (id: number, patch: Partial<Omit<Maze, 'id' | 'createdAt'>>) => {
        return await table.update(id, patch);
    },

    delete: async (id: number) => {
        await table.delete(id);
    },
});

export type MazeRepository = ReturnType<typeof createMazeRepository>;

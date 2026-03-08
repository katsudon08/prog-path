import Dexie, { type Table } from 'dexie';
import type { Maze, CommandHistory } from './types';

class ProgPathDB extends Dexie {
    mazes!: Table<Maze, number>;
    commandHistories!: Table<CommandHistory, number>;

    constructor() {
        super('ProgPathDB');
        this.version(1).stores({
            mazes: '++id, name, createdAt',
            commandHistories: '++id, mazeId, createdAt',
        });
    }
}

export const db = new ProgPathDB();

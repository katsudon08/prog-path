import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Maze } from '@/entities/maze';
import type { CommandHistory } from '@/entities/command-history';
import {
    createMazeRepository,
    useMazeRepositoryStore,
} from '@/entities/maze';
import {
    createCommandHistoryRepository,
    useCommandHistoryRepositoryStore,
} from '@/entities/command-history';

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

const db = new ProgPathDB();

// リポジトリを生成し、Zustand store に注入（Provider不要）
export const mazeRepository = createMazeRepository(db.mazes);
export const commandHistoryRepository = createCommandHistoryRepository(
    db.commandHistories,
);

useMazeRepositoryStore.setState({ repository: mazeRepository });
useCommandHistoryRepositoryStore.setState({
    repository: commandHistoryRepository,
});

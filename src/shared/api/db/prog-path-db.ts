import Dexie, { type EntityTable } from 'dexie';

import type { Maze } from '@/entities/maze';
import type { Folder } from '@/entities/folder';

export default class ProgPathDB extends Dexie {
    mazes!: EntityTable<Maze, 'id'>;
    folders!: EntityTable<Folder, 'id'>;

    constructor() {
        super('progpath_db');

        this.version(1).stores({
            // ここで指定するのはインデックス
            mazes: 'id, folderId',
            folders: 'id',
        });
    }
}

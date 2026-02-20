export const TILE_TYPE = {
    FLOOR: 'floor',
    WALL: 'wall',
    HOLE: 'hole',
    KEY: 'key',
    TELEPORT_UP: 'teleportUp',
    TELEPORT_DOWN: 'teleportDown',
    START: 'start',
    GOAL: 'goal',
} as const;

export type TileType = (typeof TILE_TYPE)[keyof typeof TILE_TYPE];

export type MazeLayer = TileType[][];

export type Maze = {
    id: string;
    name: string;
    size: number;
    floors: number;
    layers: MazeLayer[];
    folderId: string | null;
    createdAt: number;
    updatedAt: number;
};

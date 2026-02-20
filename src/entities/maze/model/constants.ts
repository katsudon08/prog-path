import { TILE_TYPE, type TileType } from './types';

// 迷路構造
export const MAZE_NAME_MAX_LENGTH = 10;
export const MAZE_SIZE_MIN = 5;
export const MAZE_SIZE_MAX = 7;
export const MAZE_FLOORS_MIN = 1;
export const MAZE_FLOORS_MAX = 3;

export const DEFAULT_MAZE_NAME = '新しい迷路';
export const DEFAULT_MAZE_SIZE = 5;
export const DEFAULT_MAZE_FLOORS = 1;

export const TILE_LABELS: Record<TileType, string> = {
    [TILE_TYPE.FLOOR]: '床',
    [TILE_TYPE.WALL]: '壁',
    [TILE_TYPE.HOLE]: '穴',
    [TILE_TYPE.KEY]: 'カギ',
    [TILE_TYPE.TELEPORT_UP]: '上へのテレポート',
    [TILE_TYPE.TELEPORT_DOWN]: '下へのテレポート',
    [TILE_TYPE.START]: 'スタート',
    [TILE_TYPE.GOAL]: 'ゴール',
};

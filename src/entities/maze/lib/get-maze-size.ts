import type { Maze } from "../model/types";

// 一辺のマス数を返す。階が1つも無いときは undefined
export const getMazeGridSize = (maze: Maze): number | undefined => maze.layers[0]?.length;

export const getMazeLayerCount = (maze: Maze): number => maze.layers.length;

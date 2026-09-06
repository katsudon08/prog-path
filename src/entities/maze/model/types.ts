export type TileType =
  "wall" | "floor" | "hole" | "start" | "goal" | "teleportUp" | "teleportDown" | "key";

// 1階ぶんのタイル。[行][列] で並ぶ
export type MazeLayer = TileType[][];

export type Folder = {
  id: string;
  name: string;
};

export type Maze = {
  id: string;
  name: string;
  layers: MazeLayer[];
  folderId: string;
};

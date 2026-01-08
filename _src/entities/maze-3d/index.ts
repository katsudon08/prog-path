// entities/maze-3d public API (boundary)
// 内部構造（model, ui）は隠蔽し、必要な公開APIのみをエクスポート

// Types
export type { TileType } from './model/types'

// UI Components
export { MazeMap } from './ui/MazeMap'
export { StartTile } from './ui/StartTile'
export { GoalTile } from './ui/GoalTile'
export { HoleTile } from './ui/HoleTile'
export { TeleportTile } from './ui/TeleportTile'
export { KeyTile } from './ui/KeyTile'

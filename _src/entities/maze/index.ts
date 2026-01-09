// entities/maze public API (boundary)
// 内部構造（model, lib, ui）は隠蔽し、必要な公開APIのみをエクスポート
// カテゴリ（フォルダ）管理は entities/folder に委譲
// ロボット関連の型は entities/robot に委譲

// Types
export type { TileType, MazeData } from './model/types'

// Store
export { useMazeStore } from './model/store'

// Validators
export { validateMaze, validateTeleportPlacement } from './lib/validator'

// Utilities
export { findStartPosition, type StartPosition } from './lib/find-start'
export { loadMazesFromStorage, saveMazesToStorage, clearMazesFromStorage } from './lib/storage'
export { getTileColor } from './lib/tile-colors'
export { getTileIcon, StartIcon, GoalIcon, KeyIcon, TeleportUpIcon, TeleportDownIcon, HoleIcon } from './lib/tile-icons'

// 2D UI Components
export { MazePreview2D } from './ui/2d/MazePreview2D'
export { MazeTile2D } from './ui/2d/MazeTile2D'
export { MazeCard } from './ui/2d/MazeCard'

// 3D UI Components
export { MazeMap3D } from './ui/3d/MazeMap3D'
export { MazeStartTile3D } from './ui/3d/MazeStartTile3D'
export { MazeGoalTile3D } from './ui/3d/MazeGoalTile3D'
export { MazeHoleTile3D } from './ui/3d/MazeHoleTile3D'
export { MazeTeleportTile3D } from './ui/3d/MazeTeleportTile3D'
export { MazeKeyTile3D } from './ui/3d/MazeKeyTile3D'
export { MazeFloorTile3D } from './ui/3d/MazeFloorTile3D'
export { MazeWallTile3D } from './ui/3d/MazeWallTile3D'

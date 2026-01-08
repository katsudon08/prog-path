// entities/maze-2d public API (boundary)
// 内部構造（model, lib, ui）は隠蔽し、必要な公開APIのみをエクスポート

// Types
export type { TileType, MazeData } from './model/types'

// Store
export { useMazeStore } from './model/store'

// Validators
export { validateMaze, validateTeleportPlacement, type ValidationResult } from './lib/validator'

// Utilities
export { findStartPosition, type StartPosition, type DirectionVector } from './lib/find-start'
export { loadMazesFromStorage, saveMazesToStorage, clearMazesFromStorage } from './lib/storage'
export { getTileColor } from './lib/tile-colors'
export { getTileIcon, StartIcon, GoalIcon, KeyIcon, TeleportUpIcon, TeleportDownIcon, HoleIcon } from './lib/tile-icons'

// UI Components
export { MazePreview } from './ui/MazePreview'
export { Tile } from './ui/Tile'
export { MazeCard } from './ui/MazeCard'

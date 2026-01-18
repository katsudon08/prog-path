// entities/robot public API (boundary)
// 内部構造（model, lib, ui）は隠蔽し、必要な公開APIのみをエクスポート

// Types
export type { DirectionVector, RobotState, RobotAnimationState } from './model/types'

// Constants（ロボットの向きに関する知識はこのスライスに閉じる）
export { DEFAULT_DIRECTION, DIRECTION } from './model/types'

// Position utilities
export {
    directionToRotation,
    rotationToDirection,
    turnRight,
    turnLeft,
    moveForward,
    gridToWorldPosition,
    worldToGridPosition
} from './lib/position'

// Stores
export { useRobotStore } from './model/useRobotStore'

// UI Components
export { RobotModel } from './ui/RobotModel'

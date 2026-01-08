// entities/robot public API (boundary)
// 内部構造（model, lib, ui）は隠蔽し、必要な公開APIのみをエクスポート

// Types
export type { DirectionVector, RobotState, RobotAnimationState } from './model/types'

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

// UI Components
export { RobotModel } from './ui/RobotModel'

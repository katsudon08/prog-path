/**
 * 方向ベクトル (北: [0, -1], 東: [1, 0], 南: [0, 1], 西: [-1, 0])
 */
export type DirectionVector = [number, number]

/**
 * 方向定数
 */
export const DIRECTION = {
    NORTH: [0, -1] as DirectionVector,
    EAST: [1, 0] as DirectionVector,
    SOUTH: [0, 1] as DirectionVector,
    WEST: [-1, 0] as DirectionVector,
} as const

/**
 * デフォルトの向き定数
 * ロボットの初期向きは南（画面下方向）
 */
export const DEFAULT_DIRECTION: DirectionVector = DIRECTION.SOUTH

/**
 * ロボット状態
 */
export interface RobotState {
    x: number
    y: number
    layer: number // 階層情報（0-indexed）
    direction: DirectionVector
    hasKey?: boolean // 鍵を持っているかどうか
}

/**
 * ロボットアニメーション状態
 */
export type RobotAnimationState = 
    | "idle"
    | "moving"
    | "turning"
    | "falling"
    | "teleporting"
    | "scanning"
    | "collecting"

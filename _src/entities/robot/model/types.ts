/**
 * 方向ベクトル (北: [0, -1], 東: [1, 0], 南: [0, 1], 西: [-1, 0])
 */
export type DirectionVector = [number, number]

/**
 * ロボット状態
 */
export interface RobotState {
    x: number
    y: number
    z: number // 階層情報（0-indexed）
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

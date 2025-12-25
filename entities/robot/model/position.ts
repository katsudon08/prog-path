import type { DirectionVector, RobotState } from './types'

/**
 * 方向定数
 */
export const DIRECTIONS = {
    NORTH: [0, -1] as DirectionVector,
    EAST: [1, 0] as DirectionVector,
    SOUTH: [0, 1] as DirectionVector,
    WEST: [-1, 0] as DirectionVector,
}

/**
 * 右に90度回転
 */
export function turnRight(direction: DirectionVector): DirectionVector {
    // [dx, dy] -> [dy, -dx] で90度時計回り
    // 北[0,-1] -> 東[1,0], 東[1,0] -> 南[0,1], 南[0,1] -> 西[-1,0], 西[-1,0] -> 北[0,-1]
    const [dx, dy] = direction
    return [-dy, dx] as DirectionVector
}

/**
 * 左に90度回転
 */
export function turnLeft(direction: DirectionVector): DirectionVector {
    // [dx, dy] -> [-dy, dx] で90度反時計回り
    const [dx, dy] = direction
    return [dy, -dx] as DirectionVector
}

/**
 * 前進した位置を計算
 */
export function moveForward(state: RobotState): RobotState {
    const [dx, dy] = state.direction
    return {
        ...state,
        x: state.x + dx,
        y: state.y + dy,
    }
}

/**
 * 方向ベクトルから角度（度数法）を計算
 */
export function directionToAngle(direction: DirectionVector): number {
    const [dx, dy] = direction
    if (dx === 0 && dy === -1) return 0    // 北
    if (dx === 1 && dy === 0) return 90   // 東
    if (dx === 0 && dy === 1) return 180  // 南
    if (dx === -1 && dy === 0) return 270 // 西
    return 0
}

/**
 * 角度から方向ベクトルを計算
 */
export function angleToDirection(angle: number): DirectionVector {
    const normalizedAngle = ((angle % 360) + 360) % 360
    if (normalizedAngle === 0) return DIRECTIONS.NORTH
    if (normalizedAngle === 90) return DIRECTIONS.EAST
    if (normalizedAngle === 180) return DIRECTIONS.SOUTH
    if (normalizedAngle === 270) return DIRECTIONS.WEST
    return DIRECTIONS.NORTH
}

/**
 * 初期ロボット状態を作成
 */
export function createInitialRobotState(x: number, y: number, z: number = 0): RobotState {
    return {
        x,
        y,
        z,
        direction: DIRECTIONS.NORTH,
        hasKey: false,
    }
}

/**
 * 位置が有効かどうかをチェック
 */
export function isValidPosition(x: number, y: number, gridSize: number): boolean {
    return x >= 0 && x < gridSize && y >= 0 && y < gridSize
}

import type { DirectionVector, RobotState } from '../model/types'

/**
 * 方向ベクトルから角度（ラジアン）を計算
 * @param direction 方向ベクトル
 * @returns Y軸周りの回転角度（ラジアン）
 */
export function directionToRotation(direction: DirectionVector): number {
    const [dx, dy] = direction
    return Math.atan2(dx, dy)
}

/**
 * 角度（ラジアン）から方向ベクトルを計算
 * @param rotation Y軸周りの回転角度（ラジアン）
 * @returns 正規化された方向ベクトル
 */
export function rotationToDirection(rotation: number): DirectionVector {
    const dx = Math.round(Math.sin(rotation))
    const dy = Math.round(Math.cos(rotation))
    return [dx, dy]
}

/**
 * 右回転後の方向ベクトルを取得
 * @param direction 現在の方向
 * @returns 右に90度回転後の方向
 */
export function turnRight(direction: DirectionVector): DirectionVector {
    const [dx, dy] = direction
    return [dy, -dx]
}

/**
 * 左回転後の方向ベクトルを取得
 * @param direction 現在の方向
 * @returns 左に90度回転後の方向
 */
export function turnLeft(direction: DirectionVector): DirectionVector {
    const [dx, dy] = direction
    return [-dy, dx]
}

/**
 * 一歩前進した後の位置を取得
 * @param state 現在のロボット状態
 * @returns 前進後の位置 { x, y }
 */
export function moveForward(state: RobotState): { x: number; y: number } {
    const [dx, dy] = state.direction
    return {
        x: state.x + dx,
        y: state.y + dy
    }
}

/**
 * グリッド座標を3D空間座標に変換
 * @param x グリッドX座標
 * @param y グリッドY座標
 * @param mazeSize 迷路のサイズ
 * @param tileSize タイルサイズ（デフォルト: 0.5）
 * @returns [worldX, worldZ] 3D空間座標
 */
export function gridToWorldPosition(
    x: number,
    y: number,
    mazeSize: number,
    tileSize: number = 0.5
): [number, number] {
    const gridOffset = -(mazeSize * tileSize) / 2 + tileSize / 2
    return [
        x * tileSize + gridOffset,
        y * tileSize + gridOffset
    ]
}

/**
 * 3D空間座標をグリッド座標に変換
 * @param worldX 3D空間X座標
 * @param worldZ 3D空間Z座標
 * @param mazeSize 迷路のサイズ
 * @param tileSize タイルサイズ（デフォルト: 0.5）
 * @returns { x, y } グリッド座標
 */
export function worldToGridPosition(
    worldX: number,
    worldZ: number,
    mazeSize: number,
    tileSize: number = 0.5
): { x: number; y: number } {
    const gridOffset = -(mazeSize * tileSize) / 2 + tileSize / 2
    return {
        x: Math.round((worldX - gridOffset) / tileSize),
        y: Math.round((worldZ - gridOffset) / tileSize)
    }
}

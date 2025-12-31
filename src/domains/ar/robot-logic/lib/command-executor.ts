/**
 * コマンド実行ロジック
 * 純粋関数としてコマンドの実行結果を計算
 */

import type { Command, RobotState, DirectionVector } from './types'
import type { MazeData, TileType } from "@/src/domains/maze/maze-data/lib/types"

/**
 * コマンド実行結果
 */
export interface ExecutionResult {
    /** 新しいロボット状態 */
    newState: RobotState
    /** 新しい迷路状態（鍵取得などで変化した場合） */
    newMaze: MazeData | null
    /** エラーメッセージ（エラー発生時） */
    error: string | null
    /** ゴール到達フラグ */
    isGoalReached: boolean
    /** テレポート発生フラグ */
    isTeleporting: boolean
    /** 移動カウント増加フラグ */
    shouldIncrementMoveCount: boolean
}

/**
 * ネストされたループコマンドを平坦化する
 * @param commands コマンドリスト
 * @returns 平坦化されたコマンドリスト
 */
export function flattenCommands(commands: Command[]): Command[] {
    const flattened: Command[] = []

    for (const command of commands) {
        if (command.type === "loop" && command.children && command.loopCount) {
            for (let i = 0; i < command.loopCount; i++) {
                flattened.push(...flattenCommands(command.children))
            }
        } else {
            // ifHole もそのまま含める
            flattened.push(command)
        }
    }
    return flattened
}

/**
 * 指定された座標にあるタイルを取得
 */
function getTileAt(maze: MazeData, x: number, y: number, z: number): TileType | null {
    if (
        z < 0 || z >= maze.layers.length ||
        y < 0 || y >= maze.layers[z].length ||
        x < 0 || x >= maze.layers[z][y].length
    ) {
        return null
    }
    return maze.layers[z][y][x]
}

/**
 * 迷路内に鍵が残っているかチェック
 */
function hasKeyRemaining(maze: MazeData): boolean {
    for (const layer of maze.layers) {
        for (const row of layer) {
            if (row.includes("key")) {
                return true
            }
        }
    }
    return false
}

/**
 * タイルを床に変更した新しいMazeDataを生成
 */
function replaceTileWithFloor(maze: MazeData, x: number, y: number, z: number): MazeData {
    const newLayers = maze.layers.map((layer, idx) =>
        idx === z
            ? layer.map((row, rIdx) =>
                rIdx === y
                    ? row.map((tile, cIdx) => cIdx === x ? "floor" as TileType : tile)
                    : row
            )
            : layer
    )
    return { ...maze, layers: newLayers }
}

/**
 * ifHoleコマンドを実行
 */
export function executeIfHole(
    state: RobotState,
    maze: MazeData
): { newMaze: MazeData | null } {
    const checkX = state.x + state.direction[0]
    const checkY = state.y + state.direction[1]
    const checkZ = state.z

    const tile = getTileAt(maze, checkX, checkY, checkZ)
    if (tile === "hole") {
        return { newMaze: replaceTileWithFloor(maze, checkX, checkY, checkZ) }
    }
    return { newMaze: null }
}

/**
 * 前進コマンドを実行
 */
export function executeForward(
    state: RobotState,
    maze: MazeData
): ExecutionResult {
    const newX = state.x + state.direction[0]
    const newY = state.y + state.direction[1]
    const currentZ = state.z

    // 範囲外チェック
    if (newX < 0 || newX >= maze.size || newY < 0 || newY >= maze.size) {
        return {
            newState: state,
            newMaze: null,
            error: "迷路の外に出てしまいました！",
            isGoalReached: false,
            isTeleporting: false,
            shouldIncrementMoveCount: false,
        }
    }

    // 階層チェック
    if (currentZ < 0 || currentZ >= maze.layers.length) {
        return {
            newState: state,
            newMaze: null,
            error: "階層エラーが発生しました！",
            isGoalReached: false,
            isTeleporting: false,
            shouldIncrementMoveCount: false,
        }
    }

    const targetTile = maze.layers[currentZ][newY][newX]
    let newState = { ...state, x: newX, y: newY }
    let newMaze: MazeData | null = null
    let error: string | null = null
    let isGoalReached = false
    let isTeleporting = false

    switch (targetTile) {
        case "wall":
            return {
                newState: state,
                newMaze: null,
                error: "壁にぶつかりました！",
                isGoalReached: false,
                isTeleporting: false,
                shouldIncrementMoveCount: false,
            }

        case "hole":
            newState = { ...state, x: newX, y: newY }
            error = "穴に落ちてしまいました！"
            break

        case "teleportUp":
            if (currentZ < maze.layers.length - 1) {
                const nextZ = currentZ + 1
                newState = { ...state, x: newX, y: newY, z: nextZ }
                isTeleporting = true

                const destTile = maze.layers[nextZ][newY][newX]
                if (destTile === "goal" && !hasKeyRemaining(maze)) {
                    isGoalReached = true
                } else if (destTile === "key") {
                    newMaze = replaceTileWithFloor(maze, newX, newY, nextZ)
                }
            } else {
                error = "これより上の階層はありません！"
                newState = state
            }
            break

        case "teleportDown":
            if (currentZ > 0) {
                const nextZ = currentZ - 1
                newState = { ...state, x: newX, y: newY, z: nextZ }
                isTeleporting = true

                const destTile = maze.layers[nextZ][newY][newX]
                if (destTile === "goal" && !hasKeyRemaining(maze)) {
                    isGoalReached = true
                } else if (destTile === "key") {
                    newMaze = replaceTileWithFloor(maze, newX, newY, nextZ)
                }
            } else {
                error = "これより下の階層はありません！"
                newState = state
            }
            break

        case "goal":
            if (hasKeyRemaining(maze)) {
                error = "鍵をすべて集めてください！"
            } else {
                isGoalReached = true
            }
            break

        case "key":
            newMaze = replaceTileWithFloor(maze, newX, newY, currentZ)
            break
    }

    return {
        newState,
        newMaze,
        error,
        isGoalReached,
        isTeleporting,
        shouldIncrementMoveCount: !error || error === "穴に落ちてしまいました！" || error === "鍵をすべて集めてください！",
    }
}

/**
 * 右回転コマンドを実行
 */
export function executeTurnRight(state: RobotState): RobotState {
    const newDirection: DirectionVector = [
        -state.direction[1],
        state.direction[0],
    ]
    return { ...state, direction: newDirection }
}

/**
 * 左回転コマンドを実行
 */
export function executeTurnLeft(state: RobotState): RobotState {
    const newDirection: DirectionVector = [
        state.direction[1],
        -state.direction[0],
    ]
    return { ...state, direction: newDirection }
}

/**
 * コマンドを実行
 * @param state 現在のロボット状態
 * @param maze 現在の迷路データ
 * @param command 実行するコマンド
 * @returns 実行結果
 */
export function executeCommand(
    state: RobotState,
    maze: MazeData,
    command: Command
): ExecutionResult {
    switch (command.type) {
        case "forward":
            return executeForward(state, maze)

        case "turnRight":
            return {
                newState: executeTurnRight(state),
                newMaze: null,
                error: null,
                isGoalReached: false,
                isTeleporting: false,
                shouldIncrementMoveCount: false,
            }

        case "turnLeft":
            return {
                newState: executeTurnLeft(state),
                newMaze: null,
                error: null,
                isGoalReached: false,
                isTeleporting: false,
                shouldIncrementMoveCount: false,
            }

        case "ifHole": {
            const result = executeIfHole(state, maze)
            return {
                newState: state,
                newMaze: result.newMaze,
                error: null,
                isGoalReached: false,
                isTeleporting: false,
                shouldIncrementMoveCount: false,
            }
        }

        default:
            // loop などは flattenCommands で展開済みのため、ここには来ない
            return {
                newState: state,
                newMaze: null,
                error: null,
                isGoalReached: false,
                isTeleporting: false,
                shouldIncrementMoveCount: false,
            }
    }
}

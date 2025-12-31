/**
 * 迷路内のスタートタイルを検索する
 */

import type { MazeData } from './types'
import type { DirectionVector } from "@/src/domains/ar/robot-logic/lib/types"

/**
 * スタート位置情報
 */
export interface StartPosition {
    x: number
    y: number
    z: number
    direction: DirectionVector
}

/**
 * 迷路内のスタートタイルを検索
 * @param maze 迷路データ
 * @returns スタート位置（見つからない場合はnull）
 */
export function findStartPosition(maze: MazeData): StartPosition | null {
    for (let z = 0; z < maze.layers.length; z++) {
        for (let y = 0; y < maze.layers[z].length; y++) {
            for (let x = 0; x < maze.layers[z][y].length; x++) {
                if (maze.layers[z][y][x] === 'start') {
                    return {
                        x,
                        y,
                        z,
                        direction: [0, 1] as DirectionVector, // 初期向きは南
                    }
                }
            }
        }
    }
    return null
}

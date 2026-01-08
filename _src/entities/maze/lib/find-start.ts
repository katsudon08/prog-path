import type { MazeData } from '../model/types'

/**
 * スタート位置情報（座標のみ）
 * ロボットの向きは entities/robot の責務
 */
export interface StartPosition {
    x: number
    y: number
    layer: number
}

/**
 * 迷路内のスタートタイルを検索
 * @param maze 迷路データ
 * @returns スタート位置（見つからない場合はnull）
 */
export function findStartPosition(maze: MazeData): StartPosition | null {
    for (let layer = 0; layer < maze.layers.length; layer++) {
        for (let y = 0; y < maze.layers[layer].length; y++) {
            for (let x = 0; x < maze.layers[layer][y].length; x++) {
                if (maze.layers[layer][y][x] === 'start') {
                    return { x, y, layer }
                }
            }
        }
    }
    return null
}

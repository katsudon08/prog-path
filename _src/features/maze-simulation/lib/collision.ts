import type { MazeData } from '@/_src/entities/maze'

/**
 * 指定位置が歩行可能（移動可能）かどうかを判定
 * 
 * @param maze 迷路データ
 * @param x グリッドX座標
 * @param y グリッドY座標
 * @param layer レイヤー（階層） 0-indexed
 * @returns trueの場合、移動可能
 */
export function isWalkable(maze: MazeData, x: number, y: number, layer: number): boolean {
    const layers = maze.layers
    
    // レイヤー範囲チェック
    if (layer < 0 || layer >= layers.length) {
        return false
    }

    const currentLayer = layers[layer]

    // 座標範囲チェック
    if (y < 0 || y >= currentLayer.length) {
        return false
    }
    if (x < 0 || x >= currentLayer[y].length) {
        return false
    }

    // タイルチェック
    const tile = currentLayer[y][x]
    
    // 壁でなければ移動可能
    // 穴(hole)は歩行可能だが落下する（この関数では移動アクションとしての可否を返す）
    // 壁(wall)以外は基本通れる
    return tile !== 'wall'
}

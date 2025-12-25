import type { TileType } from '../model/types'

/**
 * タイルタイプに対応する色クラスを返す
 */
export function getTileColor(tile: TileType): string {
    switch (tile) {
        case "wall":
            return "bg-neon-blue/50"
        case "floor":
            return "bg-space-blue/30"
        case "hole":
            return "bg-neon-purple border border-purple-900"
        case "start":
            return "bg-neon-green"
        case "goal":
            return "bg-neon-red"
        case "teleportUp":
            return "bg-blue-500 border border-blue-300"
        case "teleportDown":
            return "bg-pink-500 border border-pink-300"
        case "key":
            return "bg-yellow-400 border border-yellow-600"
        default:
            return "bg-space-blue/30"
    }
}

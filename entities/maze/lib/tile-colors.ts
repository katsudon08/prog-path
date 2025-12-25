import type { TileType } from '../model/types'

/**
 * タイルタイプに対応する色クラスを返す
 * アイコン付きタイル（スタート、ゴール、鍵、テレポート）は床と同じ背景色
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
            return "bg-space-blue/30"
        case "goal":
            return "bg-space-blue/30"
        case "teleportUp":
            return "bg-space-blue/30"
        case "teleportDown":
            return "bg-space-blue/30"
        case "key":
            return "bg-space-blue/30"
        default:
            return "bg-space-blue/30"
    }
}

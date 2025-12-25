import type { TileType } from "@entities/maze"

export interface TileTypeDefinition {
    type: TileType
    label: string
    color: string
}

/**
 * 迷路エディタで使用可能なタイルタイプ一覧
 */
export const TILE_TYPES: TileTypeDefinition[] = [
    { type: "floor", label: "床", color: "bg-space-blue/30" },
    { type: "wall", label: "壁", color: "bg-neon-blue/50" },
    { type: "hole", label: "穴", color: "bg-neon-purple border border-purple-900" },
    { type: "start", label: "スタート", color: "bg-neon-green" },
    { type: "goal", label: "ゴール", color: "bg-neon-red" },
    { type: "teleportUp", label: "上へ", color: "bg-blue-500 border border-blue-300" },
    { type: "teleportDown", label: "下へ", color: "bg-pink-500 border border-pink-300" },
    { type: "key", label: "鍵", color: "bg-yellow-400 border border-yellow-600" },
]

/**
 * タイルタイプからカラークラスを取得
 */
export function getTileEditorColor(tile: TileType): string {
    const tileType = TILE_TYPES.find((t) => t.type === tile)
    return tileType?.color || "bg-space-blue/30"
}

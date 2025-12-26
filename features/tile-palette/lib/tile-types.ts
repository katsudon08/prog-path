import type { TileType } from "@entities/maze"

export interface TileTypeDefinition {
    type: TileType
    label: string
    color: string
}

/**
 * 迷路エディタで使用可能なタイルタイプ一覧
 * アイコン付きタイル（スタート、ゴール、鍵、テレポート）は床と同じ背景色
 */
export const TILE_TYPES: TileTypeDefinition[] = [
    { type: "floor", label: "床", color: "bg-space-blue/30" },
    { type: "wall", label: "壁", color: "bg-neon-blue/50" },
    { type: "hole", label: "穴", color: "bg-space-blue/30" },
    { type: "start", label: "スタート", color: "bg-space-blue/30" },
    { type: "goal", label: "ゴール", color: "bg-space-blue/30" },
    { type: "teleportUp", label: "上へ", color: "bg-space-blue/30" },
    { type: "teleportDown", label: "下へ", color: "bg-space-blue/30" },
    { type: "key", label: "鍵", color: "bg-space-blue/30" },
]

/**
 * タイルタイプからカラークラスを取得
 */
export function getTileEditorColor(tile: TileType): string {
    const tileType = TILE_TYPES.find((t) => t.type === tile)
    return tileType?.color || "bg-space-blue/30"
}

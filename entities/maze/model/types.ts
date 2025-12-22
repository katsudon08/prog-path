/**
 * 迷路のタイルタイプ
 */
export type TileType = "wall" | "floor" | "hole" | "start" | "goal" | "teleportUp" | "teleportDown" | "key"

/**
 * 迷路データ構造
 */
export interface MazeData {
    id: string
    name: string
    layers: TileType[][][] // 複数階層対応（grid → layers）
    size: number
    currentLayer?: number // エディター用の現在表示階層
    category?: string // 迷路のカテゴリ
}

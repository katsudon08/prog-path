export type TileType = "wall" | "floor" | "hole" | "start" | "goal" | "teleportUp" | "teleportDown" | "key"

export interface MazeData {
    id: string
    name: string
    layers: TileType[][][] // 複数階層対応（grid → layers）
    size: number
    currentLayer?: number // エディター用の現在表示階層
    category?: string // 迷路のカテゴリ
}

export type CommandType = "forward" | "turnRight" | "turnLeft" | "ifHole" | "loop"

export interface Command {
    type: CommandType
    loopCount?: number
    children?: Command[]
}

// 新しい向きの型 (北: [0, -1], 東: [1, 0], 南: [0, 1], 西: [-1, 0])
export type DirectionVector = [number, number];

export interface RobotState {
    x: number;
    y: number;
    z: number; // 階層情報を追加（0-indexed）
    direction: DirectionVector; // 文字列からベクトルに変更
    hasKey?: boolean; // 鍵を持っているかどうか
}
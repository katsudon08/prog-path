export type TileType = "wall" | "floor" | "hole" | "start" | "goal"

export interface MazeData {
    id: string
    name: string
    grid: TileType[][]
    size: number
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
    direction: DirectionVector; // 文字列からベクトルに変更
}
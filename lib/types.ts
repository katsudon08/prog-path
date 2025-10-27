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

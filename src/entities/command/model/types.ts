/**
 * コマンドタイプ
 */
export type CommandType = "forward" | "turnRight" | "turnLeft" | "ifHole" | "loop"

/**
 * コマンド
 */
export interface Command {
    type: CommandType
    loopCount?: number
    children?: Command[]
}

// 互換性維持のため、新しい場所から再エクスポート
// 新しいコードでは @entities/maze や @entities/robot から直接インポートすることを推奨

// 迷路関連の型
export type { TileType, MazeData } from '@entities/maze'

// ロボット・コマンド関連の型
export type { CommandType, Command, DirectionVector, RobotState } from '@entities/robot'
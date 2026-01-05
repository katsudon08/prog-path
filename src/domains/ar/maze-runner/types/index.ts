// domains/ar/maze-runner/types public API
import type { Command, RobotState } from "@/src/domains/ar/robot-3d/types"
import type { MazeData } from "@/src/domains/maze/maze-data/lib/types"

/**
 * ゲーム状態
 */
export type GameStatus = 'idle' | 'running' | 'success' | 'failed'

/**
 * 迷路実行フックの戻り値
 */
export interface UseMazeRunnerReturn {
    /** 迷路データ */
    maze: MazeData | null
    /** ロボット状態 */
    robotState: RobotState
    /** 初期ロボット状態（リセット用） */
    initialRobotState: RobotState
    /** 実行中フラグ */
    isExecuting: boolean
    /** 現在のコマンドインデックス */
    currentCommandIndex: number
    /** 展開されたコマンド */
    flattenedCommands: Command[]
    /** ゲーム状態 */
    gameStatus: GameStatus
    /** エラーメッセージ */
    errorMessage: string
    /** 移動回数 */
    moveCount: number
    /** 迷路をセット */
    setMaze: (maze: MazeData | null) => void
    /** 実行開始/一時停止 */
    toggleExecution: (commands: Command[]) => void
    /** リセット */
    reset: () => void
    /** 成功ダイアログを閉じる */
    closeSuccessDialog: () => void
    /** 失敗ダイアログを閉じる */
    closeFailedDialog: () => void
}

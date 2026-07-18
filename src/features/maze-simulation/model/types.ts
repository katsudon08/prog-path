import type { Command, LeafCommand } from "@/entities/command";
import type { Direction, Robot, RobotCoord } from "@/entities/robot";
import type { Maze, TileKind } from "@/shared/db";

/** コマンド木の中の位置を表す、実行側の immutable path。 */
export type ExecutionPath = readonly number[];

/** 実行中に保持するタイル配列。永続化対象の Maze とは別のコピー。 */
export interface RuntimeMaze {
  readonly size: number;
  readonly floors: number;
  readonly tiles: readonly (readonly (readonly TileKind[])[])[];
}

/** ネストしたコマンド木を平坦化せずに進めるための実行フレーム。 */
export interface ExecutionFrame {
  readonly commands: readonly Command[];
  readonly index: number;
  readonly remainingIterations: number;
  /** このフレームが指す children 配列の、コマンド木上の位置。root は空配列。 */
  readonly containerPath: ExecutionPath;
}

/** テレポート元へ入った後、次の内部 step で解決する移動情報。 */
export interface PendingTeleport {
  readonly from: RobotCoord;
  readonly destination: RobotCoord;
  readonly commandPath: ExecutionPath;
}

/** 実行エンジンが保持する揮発状態。 */
export interface ExecutionState {
  readonly runtimeMaze: RuntimeMaze;
  readonly commands: readonly Command[];
  readonly robot: Robot;
  readonly frames: readonly ExecutionFrame[];
  readonly pendingTeleport: PendingTeleport | null;
  readonly moveCount: number;
  readonly status: "running" | "success" | "failure";
}

/** 入力データの境界で検出するエラーコード。 */
export const EXECUTION_INPUT_ERROR_CODE = {
  INVALID_MAZE: "invalid-maze",
  INVALID_COMMAND: "invalid-command",
} as const;

/** {@link EXECUTION_INPUT_ERROR_CODE} の値。 */
export type ExecutionInputErrorCode =
  (typeof EXECUTION_INPUT_ERROR_CODE)[keyof typeof EXECUTION_INPUT_ERROR_CODE];

/** 入力検証エラーの、UIに依存しない概要。 */
export interface ExecutionInputError {
  readonly code: ExecutionInputErrorCode;
  readonly path?: ExecutionPath;
  readonly issuePaths?: readonly (readonly (string | number)[])[];
}

/** 実行開始処理の結果。例外ではなく判別可能な結果で返す。 */
export type ExecutionSessionResult =
  | { readonly ok: true; readonly state: ExecutionState }
  | { readonly ok: false; readonly error: ExecutionInputError };

/** ゲーム中の失敗理由。画面文言ではなく安定したドメインコード。 */
export const FAILURE_REASON = {
  WALL_COLLISION: "wall-collision",
  OUT_OF_BOUNDS: "out-of-bounds",
  HOLE_FALL: "hole-fall",
  GOAL_BEFORE_KEYS: "goal-before-keys",
  COMMAND_EXHAUSTED: "command-exhausted",
  INVALID_MAZE: "invalid-maze",
  INVALID_COMMAND: "invalid-command",
} as const;

/** {@link FAILURE_REASON} の値。 */
export type FailureReason = (typeof FAILURE_REASON)[keyof typeof FAILURE_REASON];

/** 実行中に発生するイベントの識別子。 */
export const EXECUTION_EVENT_TYPE = {
  COMMAND_EXECUTED: "command-executed",
  MOVED: "moved",
  TURNED: "turned",
  HOLE_FILLED: "hole-filled",
  TELEPORT_ENTERED: "teleport-entered",
  TELEPORTED: "teleported",
  KEY_COLLECTED: "key-collected",
  SUCCESS: "success",
  FAILURE: "failure",
} as const;

/** {@link EXECUTION_EVENT_TYPE} の値。 */
export type ExecutionEventType = (typeof EXECUTION_EVENT_TYPE)[keyof typeof EXECUTION_EVENT_TYPE];

/** leaf commandの種類。loopの構造ノードは実行イベントにならない。 */
export type ExecutableCommandKind = LeafCommand["kind"];

/** 1回の step で起きたドメインイベント。 */
export type ExecutionEvent =
  | {
      readonly type: typeof EXECUTION_EVENT_TYPE.COMMAND_EXECUTED;
      readonly commandPath: ExecutionPath;
      readonly kind: ExecutableCommandKind;
    }
  | {
      readonly type: typeof EXECUTION_EVENT_TYPE.MOVED;
      readonly commandPath: ExecutionPath;
      readonly from: RobotCoord;
      readonly to: RobotCoord;
      readonly moveCount: number;
    }
  | {
      readonly type: typeof EXECUTION_EVENT_TYPE.TURNED;
      readonly commandPath: ExecutionPath;
      readonly from: Direction;
      readonly to: Direction;
    }
  | {
      readonly type: typeof EXECUTION_EVENT_TYPE.HOLE_FILLED;
      readonly commandPath: ExecutionPath;
      readonly at: RobotCoord;
    }
  | {
      readonly type: typeof EXECUTION_EVENT_TYPE.TELEPORT_ENTERED;
      readonly commandPath: ExecutionPath;
      readonly from: RobotCoord;
      readonly destination: RobotCoord;
    }
  | {
      readonly type: typeof EXECUTION_EVENT_TYPE.TELEPORTED;
      readonly commandPath: ExecutionPath;
      readonly from: RobotCoord;
      readonly to: RobotCoord;
    }
  | {
      readonly type: typeof EXECUTION_EVENT_TYPE.KEY_COLLECTED;
      readonly commandPath: ExecutionPath;
      readonly at: RobotCoord;
    }
  | {
      readonly type: typeof EXECUTION_EVENT_TYPE.SUCCESS;
      readonly reason: "goal-reached";
      readonly at: RobotCoord;
    }
  | {
      readonly type: typeof EXECUTION_EVENT_TYPE.FAILURE;
      readonly reason: FailureReason;
      readonly at?: RobotCoord;
      readonly commandPath?: ExecutionPath;
    };

/** 純粋 step 関数の返り値。state が現在値の唯一の正で、events は今回の出来事を示す。 */
export interface ExecutionStepResult {
  readonly state: ExecutionState;
  readonly events: readonly ExecutionEvent[];
}

/** 実行マシンが外部から受け取るイベント。 */
export type MazeSimulationEvent =
  | { readonly type: "COMMANDS_CHANGED"; readonly commands: readonly Command[] }
  | { readonly type: "START_RUN"; readonly commands: readonly Command[] }
  | { readonly type: "STEP" }
  | { readonly type: "RESET_RUN" }
  | { readonly type: "RETRY" }
  | { readonly type: "CLOSE_RESULT" };

/** XState contextへ保持する値。 */
export interface MazeSimulationContext {
  readonly maze: Maze;
  readonly program: readonly Command[];
  readonly execution: ExecutionState | null;
  readonly lastEvents: readonly ExecutionEvent[];
  readonly inputError: ExecutionInputError | null;
}

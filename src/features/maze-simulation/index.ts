/**
 * Public API — `features/maze-simulation` スライス
 *
 * 迷路実行エンジン・成功/失敗判定・AR 実行フロー。maze / robot / command を
 * またぐ実行ロジックの置き場所で、`model` に XState マシンと純粋な実行ロジック
 * （移動・衝突/落下/カギ/ゴール判定）を集約し、ui は持たない（描画は widgets/entities 側）。
 *
 * 他スライスからの import はこの index.ts 経由のみ。`export * from` は使わず
 * 公開対象を個別に明示し、公開シンボルは実装着手時に追加する
 * （→ docs/directory-structure.md 2.2）。
 *
 * 迷路と構築済みコマンド木を組み合わせた純粋な実行エンジン、および実行ライフサイクルを
 * 管理する XState マシンを公開する。カメラ・3D/AR 表示・QR 読み取りは本スライスの責務外。
 */

export { createExecutionSession, stepExecution } from "./model/execution-engine";
export { createMazeSimulationMachine } from "./model/maze-simulation-machine";
export { EXECUTION_EVENT_TYPE, EXECUTION_INPUT_ERROR_CODE, FAILURE_REASON } from "./model/types";
export type {
  ExecutionEvent,
  ExecutionEventType,
  ExecutionFrame,
  ExecutionInputError,
  ExecutionInputErrorCode,
  ExecutionPath,
  ExecutionSessionResult,
  ExecutionState,
  ExecutionStepResult,
  FailureReason,
  MazeSimulationContext,
  MazeSimulationEvent,
  PendingTeleport,
  RuntimeMaze,
} from "./model/types";

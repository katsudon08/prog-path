/**
 * Public API — `features/command-management` スライス
 *
 * QR からの命令作成・コマンドスタック構築・ループのネスト管理。
 *
 * 他スライスからの import はこの index.ts 経由のみ。`export * from` は使わず
 * 公開対象を個別に明示し、公開シンボルは実装着手時に追加する
 * （→ docs/directory-structure.md 2.2）。
 */
export {
  cancelLoopStart,
  confirmLoopCount,
  createInitialCommandBuilderState,
  deleteCommandAt,
  handleQrPayload,
} from "./model/command-builder";
export {
  COMMAND_BUILDER_ERROR_CODE,
  COMMAND_BUILDER_IGNORED_REASON,
  COMMAND_BUILDER_OUTCOME_TYPE,
} from "./model/types";
export type {
  CommandBuilderError,
  CommandBuilderErrorCode,
  CommandBuilderIgnoredReason,
  CommandBuilderOutcome,
  CommandBuilderOutcomeType,
  CommandBuilderResult,
  CommandBuilderState,
  CommandPath,
  InsertionPoint,
  LoopCount,
  PendingLoopStart,
} from "./model/types";
export {
  CommandBuilderErrorCodeSchema,
  CommandBuilderIgnoredReasonSchema,
  CommandBuilderOutcomeTypeSchema,
  CommandPathSchema,
  InsertionPointSchema,
  LoopCountSchema,
} from "./model/types";

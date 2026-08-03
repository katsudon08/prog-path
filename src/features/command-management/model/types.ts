/**
 * 命令構築モデルの型（FSD: features/command-management/model）
 *
 * QRカードから読み取ったトークンを、entities/command が定義するコマンド木へ
 * 構築するための状態・位置・Resultを定義する。UIの選択状態やカメラは持たない。
 */
import { LOOP_COUNT_MAX, LOOP_COUNT_MIN } from "@/shared/config";
import { z } from "zod";

import type { Command, CommandKind } from "@/entities/command";

/** rootから命令木の中の命令へ辿る、子配列のindex列。 */
export const CommandPathSchema = z.array(z.number().int().nonnegative()).readonly();
export type CommandPath = z.infer<typeof CommandPathSchema>;

/** ある命令配列の、指定indexの直前を表す挿入位置。 */
export const InsertionPointSchema = z.object({
  /** rootは空配列。loopのchildrenへ入る場合は、そのloop自身へのパス。 */
  containerPath: CommandPathSchema,
  /** 0以上、対象配列のlength以下。lengthは末尾追加を表す。 */
  index: z.number().int().nonnegative(),
});
export type InsertionPoint = z.infer<typeof InsertionPointSchema>;

/** loop回数の値制約。最小値・最大値はshared/configを正とする。 */
export const LoopCountSchema = z.number().int().min(LOOP_COUNT_MIN).max(LOOP_COUNT_MAX);
export type LoopCount = z.infer<typeof LoopCountSchema>;

/** loopStartを読み取った後、回数確定まで保持する情報。 */
export interface PendingLoopStart {
  insertionPoint: InsertionPoint;
}

/** QR命令構築の純粋な状態。 */
export interface CommandBuilderState {
  /** 構築済みのコマンド木。更新時は配列と変更経路を複製する。 */
  readonly commands: readonly Command[];
  /** 外側から内側の順に並ぶ、構築中loopのパス。 */
  readonly openLoopPaths: readonly CommandPath[];
  /** 回数入力中のloopStart。入力中はQR追加を受け付けない。 */
  readonly pendingLoopStart: PendingLoopStart | null;
  /** 次にQRを受け付けられる時刻（ミリ秒）。 */
  readonly nextQrAcceptedAt: number;
  /**
   * 直近に cooldown を張ったQRの生ペイロード。未読み取りならnull。
   *
   * cooldown中の読み取りが「同じカードをかざし続けているだけ」なのか
   * 「別のカードを早すぎるタイミングでかざした」のかを区別するために保持する。
   * 前者はUIへ通知する価値が無く、通知すると直前の結果表示を潰してしまう。
   */
  readonly lastScanPayload: string | null;
}

/** 命令構築で通知するエラーコード。 */
export const COMMAND_BUILDER_ERROR_CODE = {
  INVALID_QR_PAYLOAD: "invalid-qr-payload",
  INVALID_INSERTION_POINT: "invalid-insertion-point",
  INVALID_COMMAND_PATH: "invalid-command-path",
  LOOP_COUNT_OUT_OF_RANGE: "loop-count-out-of-range",
  LOOP_END_WITHOUT_LOOP: "loop-end-without-loop",
  LOOP_COUNT_NOT_PENDING: "loop-count-not-pending",
  LOOP_COUNT_PENDING: "loop-count-pending",
  INVALID_TIMESTAMP: "invalid-timestamp",
} as const;

/** {@link COMMAND_BUILDER_ERROR_CODE} のランタイム検証スキーマ。 */
export const CommandBuilderErrorCodeSchema = z.enum([
  COMMAND_BUILDER_ERROR_CODE.INVALID_QR_PAYLOAD,
  COMMAND_BUILDER_ERROR_CODE.INVALID_INSERTION_POINT,
  COMMAND_BUILDER_ERROR_CODE.INVALID_COMMAND_PATH,
  COMMAND_BUILDER_ERROR_CODE.LOOP_COUNT_OUT_OF_RANGE,
  COMMAND_BUILDER_ERROR_CODE.LOOP_END_WITHOUT_LOOP,
  COMMAND_BUILDER_ERROR_CODE.LOOP_COUNT_NOT_PENDING,
  COMMAND_BUILDER_ERROR_CODE.LOOP_COUNT_PENDING,
  COMMAND_BUILDER_ERROR_CODE.INVALID_TIMESTAMP,
]);

/** {@link COMMAND_BUILDER_ERROR_CODE} の値。 */
export type CommandBuilderErrorCode =
  (typeof COMMAND_BUILDER_ERROR_CODE)[keyof typeof COMMAND_BUILDER_ERROR_CODE];

/** 命令構築Resultの種別。値は定数を正とし、Zodは外部境界での検証に使う。 */
export const COMMAND_BUILDER_OUTCOME_TYPE = {
  COMMAND_ADDED: "command-added",
  LOOP_COUNT_PENDING: "loop-count-pending",
  LOOP_ADDED: "loop-added",
  LOOP_CLOSED: "loop-closed",
  CANCELLED: "cancelled",
  COMMAND_DELETED: "command-deleted",
  IGNORED: "ignored",
  ERROR: "error",
} as const;

/** {@link COMMAND_BUILDER_OUTCOME_TYPE} のランタイム検証スキーマ。 */
export const CommandBuilderOutcomeTypeSchema = z.enum([
  COMMAND_BUILDER_OUTCOME_TYPE.COMMAND_ADDED,
  COMMAND_BUILDER_OUTCOME_TYPE.LOOP_COUNT_PENDING,
  COMMAND_BUILDER_OUTCOME_TYPE.LOOP_ADDED,
  COMMAND_BUILDER_OUTCOME_TYPE.LOOP_CLOSED,
  COMMAND_BUILDER_OUTCOME_TYPE.CANCELLED,
  COMMAND_BUILDER_OUTCOME_TYPE.COMMAND_DELETED,
  COMMAND_BUILDER_OUTCOME_TYPE.IGNORED,
  COMMAND_BUILDER_OUTCOME_TYPE.ERROR,
]);
export type CommandBuilderOutcomeType = z.infer<typeof CommandBuilderOutcomeTypeSchema>;

/** ignored Resultの理由。 */
export const COMMAND_BUILDER_IGNORED_REASON = {
  /** cooldown中に**別の**カードをかざした。取りこぼしなのでUIは警告する。 */
  COOLDOWN: "cooldown",
  /** cooldown中に**同じ**カードをかざし続けている。単なる連写なのでUIは通知しない。 */
  HOLDING_SAME_CARD: "holding-same-card",
  LOOP_COUNT_PENDING: "loop-count-pending",
} as const;

/** {@link COMMAND_BUILDER_IGNORED_REASON} のランタイム検証スキーマ。 */
export const CommandBuilderIgnoredReasonSchema = z.enum([
  COMMAND_BUILDER_IGNORED_REASON.COOLDOWN,
  COMMAND_BUILDER_IGNORED_REASON.HOLDING_SAME_CARD,
  COMMAND_BUILDER_IGNORED_REASON.LOOP_COUNT_PENDING,
]);
export type CommandBuilderIgnoredReason = z.infer<typeof CommandBuilderIgnoredReasonSchema>;

/** UIが表示内容を選べる、ドメインエラーの正規化形。 */
export interface CommandBuilderError {
  code: CommandBuilderErrorCode;
  message: string;
  payload?: string;
  path?: CommandPath;
  min?: number;
  max?: number;
}

/** 命令構築の遷移結果。ignoredは状態を変えず、errorは構造を変えない。 */
export type CommandBuilderOutcome =
  | {
      type: typeof COMMAND_BUILDER_OUTCOME_TYPE.COMMAND_ADDED;
      commandKind: Exclude<CommandKind, "loopStart" | "loopEnd">;
      nextInsertionPoint: InsertionPoint;
    }
  | {
      type: typeof COMMAND_BUILDER_OUTCOME_TYPE.LOOP_COUNT_PENDING;
      insertionPoint: InsertionPoint;
    }
  | {
      type: typeof COMMAND_BUILDER_OUTCOME_TYPE.LOOP_ADDED;
      loopPath: CommandPath;
      nextInsertionPoint: InsertionPoint;
    }
  | {
      type: typeof COMMAND_BUILDER_OUTCOME_TYPE.LOOP_CLOSED;
      closedLoopPath: CommandPath;
      nextInsertionPoint: InsertionPoint;
    }
  | {
      type: typeof COMMAND_BUILDER_OUTCOME_TYPE.CANCELLED;
      nextInsertionPoint: InsertionPoint;
    }
  | {
      type: typeof COMMAND_BUILDER_OUTCOME_TYPE.COMMAND_DELETED;
      deletedPath: CommandPath;
      nextInsertionPoint: InsertionPoint;
    }
  | {
      type: typeof COMMAND_BUILDER_OUTCOME_TYPE.IGNORED;
      reason: CommandBuilderIgnoredReason;
    }
  | {
      type: typeof COMMAND_BUILDER_OUTCOME_TYPE.ERROR;
      error: CommandBuilderError;
    };

/** 命令構築操作のResult。常に次の状態を返す。 */
export interface CommandBuilderResult {
  state: CommandBuilderState;
  outcome: CommandBuilderOutcome;
}

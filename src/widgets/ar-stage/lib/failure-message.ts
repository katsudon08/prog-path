/**
 * 失敗理由 → 児童向け文言（FSD: widgets/ar-stage/lib）
 *
 * features/maze-simulation の {@link FailureReason}（安定したドメインコード）を、
 * 小学校高学年向けのやさしい日本語文言へ変換する。網羅性は
 * `satisfies Record<FailureReason, string>` で型担保し、reason が増えたらここが型エラーになる。
 *
 * 文言は 〔要確認〕 暫定。授業での読みやすさ（分かち書き・励まし表現）を優先しており、
 * 実際の児童の反応や先生のフィードバックを受けて後で調整してよい。
 */
import { FAILURE_REASON } from "@/features/maze-simulation";
import type { FailureReason } from "@/features/maze-simulation";

/** 失敗理由ごとの児童向け文言。キーは {@link FAILURE_REASON} の全値を網羅する。 */
export const FAILURE_MESSAGES = {
  [FAILURE_REASON.WALL_COLLISION]: "かべに ぶつかっちゃった！",
  [FAILURE_REASON.OUT_OF_BOUNDS]: "めいろの そとに でちゃった！",
  [FAILURE_REASON.HOLE_FALL]: "あなに おちちゃった！",
  [FAILURE_REASON.GOAL_BEFORE_KEYS]: "カギを ぜんぶ あつめてから ゴールしよう！",
  [FAILURE_REASON.COMMAND_EXHAUSTED]: "めいれいが たりなかったみたい。つづきを つくってみよう！",
  [FAILURE_REASON.INVALID_MAZE]:
    "このめいろは うまく うごかせなかったよ。めいろを たしかめてみよう！",
  [FAILURE_REASON.INVALID_COMMAND]:
    "めいれいが うまく よみとれなかったよ。もういちど つくってみよう！",
} as const satisfies Record<FailureReason, string>;

/**
 * 失敗理由を児童向け文言へ変換する。
 *
 * @param reason 実行エンジンが返す失敗理由コード
 * @returns 失敗ダイアログ等に表示する日本語文言
 */
export const getFailureMessage = (reason: FailureReason): string => FAILURE_MESSAGES[reason];

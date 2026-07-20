/**
 * コマンド構築 outcome → 児童向けトースト文言（FSD: widgets/ar-stage/lib）
 *
 * features/command-management の {@link CommandBuilderOutcome} を、QR 読み取りフィードバックの
 * トースト文言へ変換する純粋関数。`null` は「トーストを出さない」を意味する
 * （loop-count-pending は回数ダイアログが開くため二重に通知しない）。
 *
 * 網羅性の担保:
 *  - outcome の型判別は switch + `never` チェック（種別が増えるとコンパイルエラー）。
 *  - ignored 理由・エラーコードの対応表は `satisfies Record<…, string>`（値が増えると型エラー）。
 *
 * 文言は 〔要確認〕 暫定。分かち書き・励まし表現を優先し、児童の反応を見て調整してよい。
 */
import { COMMAND_VISUALS } from "@/entities/command";
import { COMMAND_BUILDER_OUTCOME_TYPE } from "@/features/command-management";
import type {
  CommandBuilderErrorCode,
  CommandBuilderIgnoredReason,
  CommandBuilderOutcome,
} from "@/features/command-management";
import { LOOP_COUNT_MAX, LOOP_COUNT_MIN } from "@/shared/config";

/** ignored 理由ごとの文言。キーは {@link CommandBuilderIgnoredReason} の全値を網羅する。 */
export const IGNORED_MESSAGES = {
  cooldown: "よみとりが はやすぎるよ。すこし まってから かざしてね",
  "loop-count-pending": "さきに くりかえす かいすうを えらんでね",
} as const satisfies Record<CommandBuilderIgnoredReason, string>;

/** エラーコードごとの文言。キーは {@link CommandBuilderErrorCode} の全値を網羅する。 */
export const ERROR_MESSAGES = {
  "invalid-qr-payload": "この カードは よみとれなかったよ。めいれいの カードを かざしてね",
  "invalid-insertion-point": "その ばしょには ついかできなかったよ。もういちど えらんでね",
  "invalid-command-path": "その めいれいは みつからなかったよ",
  "loop-count-out-of-range": `かいすうは ${LOOP_COUNT_MIN}〜${LOOP_COUNT_MAX} の あいだで えらんでね`,
  "loop-end-without-loop": "とじる ループが ないよ。さきに ループはじめの カードを かざしてね",
  "loop-count-not-pending": "いまは かいすうを えらぶ ばめんじゃないよ",
  "loop-count-pending": "さきに くりかえす かいすうを えらんでね",
  "invalid-timestamp": "よみとりの じかんが おかしかったよ。もういちど ためしてね",
} as const satisfies Record<CommandBuilderErrorCode, string>;

/**
 * コマンド構築 outcome をトースト文言へ変換する。
 *
 * @param outcome features/command-management が返した遷移結果
 * @returns 表示する文言。トーストを出さない outcome（loop-count-pending）は `null`
 */
export const getOutcomeMessage = (outcome: CommandBuilderOutcome): string | null => {
  switch (outcome.type) {
    case COMMAND_BUILDER_OUTCOME_TYPE.COMMAND_ADDED:
      return `「${COMMAND_VISUALS[outcome.commandKind].labelJa}」を ついかしたよ！`;
    case COMMAND_BUILDER_OUTCOME_TYPE.LOOP_COUNT_PENDING:
      // 回数入力ダイアログが開くため、トーストでは通知しない。
      return null;
    case COMMAND_BUILDER_OUTCOME_TYPE.LOOP_ADDED:
      return "「くりかえし」を はじめたよ！なかに めいれいを ついかしてね";
    case COMMAND_BUILDER_OUTCOME_TYPE.LOOP_CLOSED:
      return "「くりかえし」を とじたよ！";
    case COMMAND_BUILDER_OUTCOME_TYPE.CANCELLED:
      return "「くりかえし」を やめたよ";
    case COMMAND_BUILDER_OUTCOME_TYPE.COMMAND_DELETED:
      return "めいれいを けしたよ";
    case COMMAND_BUILDER_OUTCOME_TYPE.IGNORED:
      return IGNORED_MESSAGES[outcome.reason];
    case COMMAND_BUILDER_OUTCOME_TYPE.ERROR:
      return ERROR_MESSAGES[outcome.error.code];
    default: {
      // 種別が増えたらここが型エラーになる（網羅性の強制）。
      const exhaustive: never = outcome;
      return exhaustive;
    }
  }
};

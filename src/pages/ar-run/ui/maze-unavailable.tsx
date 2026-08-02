/**
 * MazeUnavailable（FSD: pages/ar-run/ui）
 *
 * URL の `mazeId` で指定された迷路が使えないときの表示。理由は 2 つ。
 *  - `not-found`: その id の迷路が無い（消された / 古いリンク / 行が壊れている）
 *  - `unplayable`: 構造は正しいがテレポートの行き先が不正で実行できない
 *    （判定は `PlayableMazeSchema`。→ `lib/resolve-ar-run-target.ts`）
 *
 * `unplayable` を画面レベルで先に伝えるのは、ar-stage 任せだと命令を組み終えて［じっこう］を
 * 押すまで気付けず、45 分の授業では行き止まりになるため。どちらの理由でも［めいろを えらぶ］で
 * ピッカーへ戻せる。表示は shared/ui の `ErrorView`（`role="alert"` ＋ アイコン ＋ 見出し ＋
 * 詳細 ＋ アクション 1 つ）をそのまま使い、文言だけ児童向けに差し替える。
 */
import { cn } from "@/shared/lib";
import { ErrorView } from "@/shared/ui";

/** 迷路が使えない理由。 */
export type MazeUnavailableReason = "not-found" | "unplayable";

/** {@link MazeUnavailable} の props。 */
export interface MazeUnavailableProps {
  /** 使えない理由（見出し・説明の出し分けに使う）。 */
  reason: MazeUnavailableReason;
  /** 迷路名（`unplayable` のときだけ判明する。説明に添える）。 */
  mazeName?: string;
  /** ［めいろを えらぶ］押下時に呼ぶ（呼び出し側でクエリを消してピッカーへ戻す）。 */
  onBackToPicker: () => void;
  /** 既定クラスへの上書き・拡張（cn 経由）。 */
  className?: string;
}

/** 理由 → 見出し（児童向けの言い切り）。 */
const TITLE_BY_REASON: Record<MazeUnavailableReason, string> = {
  "not-found": "その めいろは みつかりませんでした",
  unplayable: "この めいろは いま あそべません",
};

/** 理由（＋迷路名）→「なぜ・どうすれば」を伝える説明文。 */
const buildDescription = (reason: MazeUnavailableReason, mazeName?: string): string => {
  switch (reason) {
    case "not-found":
      return "けされたか、リンクが ふるいのかも しれません。もういちど めいろを えらんでね。";
    case "unplayable": {
      const subject = mazeName === undefined ? "この めいろ" : `「${mazeName}」`;
      return `${subject}は テレポートの いきさきが おかしいので うごかせません。「めいろをつくる」で なおしてから あそんでね。`;
    }
    default: {
      // 理由が増えたらここが型エラーになる（網羅性の強制）。
      const exhaustive: never = reason;
      return exhaustive;
    }
  }
};

/** 指定された迷路が使えないことを伝え、ピッカーへ戻す画面。 */
export const MazeUnavailable = ({
  reason,
  mazeName,
  onBackToPicker,
  className,
}: MazeUnavailableProps): React.JSX.Element => {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col items-center justify-center p-8", className)}>
      {/* どの分岐でも画面名を同じに保つ（ArRunWorkspace の sr-only 見出しと対）。 */}
      <h1 className="sr-only">AR でうごかす</h1>
      <ErrorView
        title={TITLE_BY_REASON[reason]}
        error={buildDescription(reason, mazeName)}
        onRetry={onBackToPicker}
        retryLabel="めいろを えらぶ"
      />
    </div>
  );
};

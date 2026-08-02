/**
 * QR フィードバックトーストの表示状態フック（FSD: widgets/ar-stage/model）
 *
 * controller の `lastOutcome`（連番付き outcome）を、トーストの「表示 → 数秒後に自動で
 * フェードアウト」状態へ変換する。文言化は lib/outcome-message が担い、`null` 文言の
 * outcome（loop-count-pending 等）はトーストを出さない。
 *
 * フェードアウト中も直前の文言を保持し続ける（`visible: false` + `message` 残置）ことで、
 * UI 側は opacity トランジションだけで消えるアニメーションを表現できる。
 *
 * **注意**: 文言 `null` の outcome は「表示中のトーストを畳む」扱い（ダイアログが前面に出る
 * ケースを想定）。したがって「直前の通知を残したい」outcome は本フックへ届く前に
 * `useCommandStack` 側で握りつぶすこと（`lastOutcome` を進めない）。
 */
import { useEffect, useState } from "react";

import { getOutcomeMessage } from "../lib/outcome-message";
import type { CommandStackOutcome } from "./types";

/** トーストの自動フェードアウトまでの表示時間（ミリ秒）。 */
export const TOAST_DURATION_MS = 2_500;

/** {@link useToast} が返すトースト表示状態。 */
export interface UseToastResult {
  /** 表示（またはフェードアウト）中の文言。一度も表示していなければ null。 */
  readonly message: string | null;
  /** 表示中か。false かつ message ありはフェードアウト中を表す。 */
  readonly visible: boolean;
}

/** 内部状態。message と visible をアトミックに更新する。 */
interface ToastState {
  readonly message: string | null;
  readonly visible: boolean;
}

/**
 * `lastOutcome` の連番（seq）変化を一度きりのトースト表示へ変換するフック。
 *
 * 同じ内容の outcome が連続しても seq が単調増加するため、再表示（タイマーの張り直し）が
 * 確実に発火する。unmount・次の outcome 到着で前のタイマーは破棄される。
 *
 * @param lastOutcome controller の直近 outcome（未操作時は null）
 * @returns 文言と表示フラグ（{@link UseToastResult}）
 */
export const useToast = (lastOutcome: CommandStackOutcome | null): UseToastResult => {
  const [state, setState] = useState<ToastState>({ message: null, visible: false });

  useEffect(() => {
    if (lastOutcome === null) {
      return undefined;
    }
    const message = getOutcomeMessage(lastOutcome.outcome);
    if (message === null) {
      // トースト対象外の outcome（ダイアログ側で通知される）。表示中のものは畳む。
      setState((prev) => ({ ...prev, visible: false }));
      return undefined;
    }
    setState({ message, visible: true });
    const timer = setTimeout(() => {
      setState((prev) => ({ ...prev, visible: false }));
    }, TOAST_DURATION_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [lastOutcome]);

  return state;
};

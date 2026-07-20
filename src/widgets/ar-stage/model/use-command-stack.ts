/**
 * コマンドスタック編集フック（FSD: widgets/ar-stage/model）
 *
 * features/command-management の純粋モデル（CommandBuilderState + 遷移関数）を `useState` で
 * 包み、AR ステージの編集操作（QR 追加・loop 回数確定・削除・追加位置選択）を提供する。
 * ドメインルール（cooldown・loop ネスト・挿入位置検証）はすべて features 側の純粋関数が担い、
 * 本フックは「状態の保持」と「outcome の `nextInsertionPoint` による選択位置の再同期」だけを行う。
 */
import { useCallback, useState } from "react";

import type { Command } from "@/entities/command";
import {
  cancelLoopStart,
  confirmLoopCount,
  createInitialCommandBuilderState,
  deleteCommandAt,
  handleQrPayload,
} from "@/features/command-management";
import type {
  CommandBuilderOutcome,
  CommandBuilderResult,
  CommandBuilderState,
  CommandPath,
  InsertionPoint,
  PendingLoopStart,
} from "@/features/command-management";

import type { CommandStackOutcome } from "./types";

/** {@link useCommandStack} が返す編集用インターフェース。 */
export interface UseCommandStackResult {
  /** 構築済みコマンド木。 */
  readonly commands: readonly Command[];
  /** ハイライト中の追加位置。操作の outcome が返す `nextInsertionPoint` で常に再同期される。 */
  readonly selected: InsertionPoint;
  /** 回数入力待ちの loopStart。入力待ちの間は QR 追加を受け付けない（features 側で ignored）。 */
  readonly pendingLoopStart: PendingLoopStart | null;
  /** 直近操作の outcome（トースト表示用・連番付き）。未操作時は null。 */
  readonly lastOutcome: CommandStackOutcome | null;
  /** QR ペイロードを適用する（cooldown 判定用の現在時刻は内部で `Date.now()` を使う）。 */
  handleQr: (payload: string) => void;
  /** 保留中 loopStart へ回数を確定する。 */
  confirmLoop: (count: number) => void;
  /** 保留中 loopStart を破棄する。 */
  cancelLoop: () => void;
  /**
   * 指定パスの命令を即時削除する。
   *
   * 誤操作対策の削除確認（#239）は useArStage 層の責務で、本フックは確定済みの削除だけを受け取る。
   */
  deleteCommand: (path: CommandPath) => void;
  /** 追加位置を選択する（CommandPanel のスロット押下に対応）。 */
  selectInsertionPoint: (point: InsertionPoint) => void;
  /** 空のコマンドスタックへ戻す。 */
  reset: () => void;
}

/** フック内部でまとめて更新する状態。builder と選択位置・通知をアトミックに同期する。 */
interface CommandStackState {
  readonly builder: CommandBuilderState;
  readonly selected: InsertionPoint;
  readonly lastOutcome: CommandStackOutcome | null;
}

const createInitialState = (): CommandStackState => ({
  builder: createInitialCommandBuilderState(),
  selected: { containerPath: [], index: 0 },
  lastOutcome: null,
});

/** outcome が持つ場合のみ `nextInsertionPoint` を取り出す（無い outcome は選択位置を動かさない）。 */
const getNextInsertionPoint = (outcome: CommandBuilderOutcome): InsertionPoint | null =>
  "nextInsertionPoint" in outcome ? outcome.nextInsertionPoint : null;

/**
 * features の遷移結果を内部状態へ反映する。
 *
 * `lastOutcome` は UI がトースト等の一度きり通知に使うため、同一内容でも `seq` を単調増加させ、
 * 再レンダによる再発火と区別できるようにする。
 */
const applyResult = (prev: CommandStackState, result: CommandBuilderResult): CommandStackState => ({
  builder: result.state,
  selected: getNextInsertionPoint(result.outcome) ?? prev.selected,
  lastOutcome: { seq: (prev.lastOutcome?.seq ?? 0) + 1, outcome: result.outcome },
});

/**
 * コマンドスタックの編集状態を保持するフック。
 *
 * 実行中の編集ロック（no-op 化）は行わない — それはフェーズを知る `useArStage` の責務。
 *
 * @returns コマンド木・選択位置・編集操作（{@link UseCommandStackResult}）
 */
export const useCommandStack = (): UseCommandStackResult => {
  const [state, setState] = useState<CommandStackState>(createInitialState);

  const handleQr = useCallback((payload: string): void => {
    // cooldown 判定の現在時刻は適用時点で取得する（stale クロージャを避けるため updater 内で評価）。
    setState((prev) =>
      applyResult(prev, handleQrPayload(prev.builder, payload, prev.selected, Date.now())),
    );
  }, []);

  const confirmLoop = useCallback((count: number): void => {
    setState((prev) => applyResult(prev, confirmLoopCount(prev.builder, count)));
  }, []);

  const cancelLoop = useCallback((): void => {
    setState((prev) => applyResult(prev, cancelLoopStart(prev.builder)));
  }, []);

  const deleteCommand = useCallback((path: CommandPath): void => {
    setState((prev) => applyResult(prev, deleteCommandAt(prev.builder, path)));
  }, []);

  const selectInsertionPoint = useCallback((point: InsertionPoint): void => {
    setState((prev) => ({
      ...prev,
      selected: { containerPath: [...point.containerPath], index: point.index },
    }));
  }, []);

  const reset = useCallback((): void => {
    setState(createInitialState());
  }, []);

  return {
    commands: state.builder.commands,
    selected: state.selected,
    pendingLoopStart: state.builder.pendingLoopStart,
    lastOutcome: state.lastOutcome,
    handleQr,
    confirmLoop,
    cancelLoop,
    deleteCommand,
    selectInsertionPoint,
    reset,
  };
};

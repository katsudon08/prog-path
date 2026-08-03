/**
 * AR ステージ controller（FSD: widgets/ar-stage/model）
 *
 * `useCommandStack`（コマンド構築）と `useMazeSimulation`（実行）を束ね、ページ（#190）と
 * ArStage UI の契約 {@link ArStageController} を返す。編集と実行の排他
 * （実行中は編集操作を no-op 化）と、削除の確認フロー（削除要求 → 中央オーバーレイで
 * 明示確定 → 実削除）はここで一元的に担う。
 *
 * カメラ（use-camera-stream）は含めない — カメラのライフサイクルは AR 背景を描く
 * ArStage UI が内部で `useCameraStream` を使って管理する分担のため。
 */
import { useCallback, useEffect, useState } from "react";

import type { Maze } from "@/entities/maze";
import type { CommandPath, InsertionPoint } from "@/features/command-management";

import { commandAtPath, getCommandLabel } from "../lib/command-at-path";
import { useCommandStack } from "./use-command-stack";
import { useMazeSimulation } from "./use-maze-simulation";
import type { ArStageController } from "./types";

/**
 * AR ステージの状態と操作を束ねる controller フック。
 *
 * `maze` はマウント時点の値で固定される（useMazeSimulation の制約に従う）。
 * 迷路を切り替えるときは呼び出し側が `key` 等で再マウントすること。
 *
 * `canRun` は「編集中（idle）・命令が空でない・loop 回数入力待ちが無い」の合成。
 * コマンド構築状態と実行状態の両方を知るのは本フックだけなので、ここで判定する。
 * 未完了ループは `canRun` に含めず `run` の中で弾き、警告ダイアログで理由を伝える。
 *
 * @param maze 実行対象の迷路
 * @returns ページ・ArStage UI が使う controller（{@link ArStageController}）
 */
export const useArStage = (maze: Maze): ArStageController => {
  const commandStack = useCommandStack();
  const simulation = useMazeSimulation(maze);

  // 削除確認（#239）: 確認待ちの削除対象パス。null は「確認中でない」。
  const [pendingDeletePath, setPendingDeletePath] = useState<CommandPath | null>(null);
  // 未完了ループがある状態で［じっこう］が押されたか（警告ダイアログの開閉）。
  const [unclosedLoopDialogOpen, setUnclosedLoopDialogOpen] = useState(false);

  const {
    handleQr: handleQrRaw,
    confirmLoop: confirmLoopRaw,
    cancelLoop: cancelLoopRaw,
    deleteCommand: deleteCommandRaw,
    selectInsertionPoint: selectInsertionPointRaw,
  } = commandStack;
  const { run: runSimulation, setVisibleFloor: setVisibleFloorRaw } = simulation;

  const isEditable = simulation.status === "idle";
  const readOnly = !isEditable;
  const canRun =
    isEditable && commandStack.commands.length > 0 && commandStack.pendingLoopStart === null;

  // --- 編集系ハンドラ（実行中は no-op。「実行中は編集不可」をロジック層で担保する） ---

  const handleQr = useCallback(
    (payload: string): void => {
      if (!isEditable) return;
      handleQrRaw(payload);
    },
    [isEditable, handleQrRaw],
  );

  const confirmLoop = useCallback(
    (count: number): void => {
      if (!isEditable) return;
      confirmLoopRaw(count);
    },
    [isEditable, confirmLoopRaw],
  );

  const cancelLoop = useCallback((): void => {
    if (!isEditable) return;
    cancelLoopRaw();
  }, [isEditable, cancelLoopRaw]);

  const deleteCommand = useCallback(
    (path: CommandPath): void => {
      if (!isEditable) return;
      // 即削除せず確認待ちに積む（画面中央のオーバーレイで明示確定させる）。
      // 解決できないパス（描画とモデルのずれ等）は要求ごと無視する。
      if (commandAtPath(commandStack.commands, path) === null) return;
      setPendingDeletePath(path);
    },
    [isEditable, commandStack.commands],
  );

  const selectInsertionPoint = useCallback(
    (point: InsertionPoint): void => {
      if (!isEditable) return;
      selectInsertionPointRaw(point);
    },
    [isEditable, selectInsertionPointRaw],
  );

  // --- 削除確認（#239: 即削除ではなく中央オーバーレイでの明示確定を挟む） ---

  const confirmDelete = useCallback((): void => {
    if (!isEditable || pendingDeletePath === null) return;
    // 実削除。outcome の nextInsertionPoint による selected の再同期は useCommandStack が担う。
    deleteCommandRaw(pendingDeletePath);
    setPendingDeletePath(null);
  }, [isEditable, pendingDeletePath, deleteCommandRaw]);

  const cancelDelete = useCallback((): void => {
    setPendingDeletePath(null);
  }, []);

  // readOnly 化（実行開始など）では保留中の削除確認を破棄する（実行中にダイアログを残さない）。
  useEffect(() => {
    if (!isEditable) {
      setPendingDeletePath(null);
    }
  }, [isEditable]);

  // --- 未完了ループの警告（features.md 5.3: 実行操作時に警告し、実行を抑止する） ---

  const openLoopCount = commandStack.openLoopPaths.length;

  // 警告表示中も QR 読み取りは動き続けるため、その場で loopEnd を読ませたら警告を畳む。
  // 「全部閉じた」状態でフラグを戻すことで、次に loopStart を読んでも勝手に再表示されない。
  useEffect(() => {
    if (openLoopCount === 0) {
      setUnclosedLoopDialogOpen(false);
    }
  }, [openLoopCount]);

  const dismissUnclosedLoop = useCallback((): void => {
    setUnclosedLoopDialogOpen(false);
  }, []);

  const pendingDeleteCommand =
    pendingDeletePath === null ? null : commandAtPath(commandStack.commands, pendingDeletePath);
  const deleteTargetLabel =
    pendingDeleteCommand === null ? null : getCommandLabel(pendingDeleteCommand);

  const setVisibleFloor = useCallback(
    (floor: number): void => {
      // 表示階の手動切替は編集時のみ（実行中はイベント追従、結果表示中は実行結果の階を保つ）。
      if (!isEditable) return;
      setVisibleFloorRaw(floor);
    },
    [isEditable, setVisibleFloorRaw],
  );

  // --- 実行 ---

  const run = useCallback((): void => {
    if (!canRun) return;
    // 未完了ループがあるうちは実行させない。ボタンは押せるままにして理由を警告で伝える
    // （disabled だけでは「くりかえし おわり」を読ませればよいと気付けない）。
    if (openLoopCount > 0) {
      setUnclosedLoopDialogOpen(true);
      return;
    }
    // 実行開始と同時に削除確認を破棄する（effect を待たず同一更新で閉じる）。
    setPendingDeletePath(null);
    runSimulation(commandStack.commands);
  }, [canRun, openLoopCount, runSimulation, commandStack.commands]);

  return {
    maze,

    // 実行状態
    status: simulation.status,
    isEditable,
    isRunning: simulation.isRunning,
    canRun,
    robot: simulation.robot,
    moveCount: simulation.moveCount,
    robotAction: simulation.robotAction,
    visibleFloor: simulation.visibleFloor,
    setVisibleFloor,

    // 実行操作
    run,
    pause: simulation.pause,
    resume: simulation.resume,
    reset: simulation.reset,
    closeResult: simulation.closeResult,

    // 結果ダイアログ
    successOpen: simulation.status === "succeeded",
    failureOpen: simulation.status === "failed",
    failureReason: simulation.failureReason,

    // CommandPanel 契約
    commands: commandStack.commands,
    selected: commandStack.selected,
    openLoopPaths: commandStack.openLoopPaths,
    activePath: simulation.activePath,
    readOnly,
    selectInsertionPoint,
    deleteCommand,

    // 削除確認ダイアログ
    deleteDialogOpen: pendingDeletePath !== null,
    deleteTargetLabel,
    confirmDelete,
    cancelDelete,

    // 未完了ループの警告
    unclosedLoopDialogOpen,
    dismissUnclosedLoop,

    // QR / ループ回数ダイアログ
    handleQr,
    lastOutcome: commandStack.lastOutcome,
    loopDialogOpen: commandStack.pendingLoopStart !== null,
    confirmLoop,
    cancelLoop,
  };
};

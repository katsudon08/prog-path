/**
 * AR ステージ controller（FSD: widgets/ar-stage/model）
 *
 * `useCommandStack`（コマンド構築）と `useMazeSimulation`（実行）を束ね、ページ（#190）と
 * ArStage UI の契約 {@link ArStageController} を返す。編集と実行の排他
 * （実行中は編集操作を no-op 化）はここで一元的に担う。
 *
 * カメラ（use-camera-stream）は含めない — カメラのライフサイクルは AR 背景を描く
 * ArStage UI が内部で `useCameraStream` を使って管理する分担のため。
 */
import { useCallback } from "react";

import type { Maze } from "@/entities/maze";
import type { CommandPath, InsertionPoint } from "@/features/command-management";

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
 *
 * @param maze 実行対象の迷路
 * @returns ページ・ArStage UI が使う controller（{@link ArStageController}）
 */
export const useArStage = (maze: Maze): ArStageController => {
  const commandStack = useCommandStack();
  const simulation = useMazeSimulation(maze);

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
      deleteCommandRaw(path);
    },
    [isEditable, deleteCommandRaw],
  );

  const selectInsertionPoint = useCallback(
    (point: InsertionPoint): void => {
      if (!isEditable) return;
      selectInsertionPointRaw(point);
    },
    [isEditable, selectInsertionPointRaw],
  );

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
    runSimulation(commandStack.commands);
  }, [canRun, runSimulation, commandStack.commands]);

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
    activePath: simulation.activePath,
    readOnly,
    selectInsertionPoint,
    deleteCommand,

    // QR / ループ回数ダイアログ
    handleQr,
    lastOutcome: commandStack.lastOutcome,
    loopDialogOpen: commandStack.pendingLoopStart !== null,
    confirmLoop,
    cancelLoop,
  };
};

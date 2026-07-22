/**
 * 迷路実行フック（FSD: widgets/ar-stage/model）
 *
 * features/maze-simulation の XState マシンを `@xstate/react` で駆動し、AR ステージが
 * 使う実行操作（run / pause / resume / reset / closeResult）と表示値（ロボット状態・
 * 実行中パス・表示階・実行状態）を提供する。マシンは STEP を外部から受け取る設計のため、
 * 本フックが `setInterval` で STEP を送信し、アニメーション時間と実行速度を握る。
 */
import { useCallback, useEffect, useMemo, useState } from "react";

import { useMachine } from "@xstate/react";

import type { Command } from "@/entities/command";
import { findStartFloor } from "@/entities/maze";
import type { Maze } from "@/entities/maze";
import type { Robot, RobotAction } from "@/entities/robot";
import type { CommandPath } from "@/features/command-management";
import { createMazeSimulationMachine } from "@/features/maze-simulation";
import type { FailureReason } from "@/features/maze-simulation";

import { deriveExecutionView } from "../lib/execution-view";
import { toRunStatus } from "../lib/run-status";
import type { RunStatus } from "./types";

/**
 * STEP 送信間隔（ミリ秒）。
 *
 * Robot3d のアニメーション時間（MOVE=450ms / TURN=350ms）より長くすることで、
 * 各 STEP の移動・回転アニメが完了してから次の STEP が届き、動きが飛ばずに見える。
 */
export const STEP_INTERVAL_MS = 500;

/** {@link useMazeSimulation} が返す実行用インターフェース。 */
export interface UseMazeSimulationResult {
  /** 実行中ロボットの状態。未実行・結果クローズ後は null。 */
  readonly robot: Robot | null;
  /** 実行中の移動回数。未実行時は 0。 */
  readonly moveCount: number;
  /** 直近に実行されたコマンドへのパス。実行フェーズ以外は null。 */
  readonly activePath: CommandPath | null;
  /** Robot3d へ渡す一発アニメ指示（穴埋め・落下）。無ければ null。 */
  readonly robotAction: RobotAction | null;
  /** 3D 表示する階（0 始まり）。実行イベントの到達階へ自動追従する。 */
  readonly visibleFloor: number;
  /** UI 向けの実行状態。 */
  readonly status: RunStatus;
  /** 失敗理由（失敗時のみ）。`lastEvents` 内の failure イベントから導出する。 */
  readonly failureReason: FailureReason | null;
  /** 実行中か（paused を含む）。 */
  readonly isRunning: boolean;
  /** 指定したコマンド木で実行を開始する（マシンが idle / building のときだけ効く）。 */
  run: (commands: readonly Command[]) => void;
  /** STEP 送信タイマーを止める（実行中のみ有効）。 */
  pause: () => void;
  /** pause 中の STEP 送信を再開する。 */
  resume: () => void;
  /** 実行をやりなおす（ロボットを開始位置へ戻し、同じ命令で再実行する）。 */
  reset: () => void;
  /** 結果を閉じて編集可能状態（building）へ戻る。 */
  closeResult: () => void;
  /** 表示階を手動で切り替える（実行中はイベント追従が正のため無視する）。 */
  setVisibleFloor: (floor: number) => void;
}

/**
 * 迷路実行マシンを React へ束ねるフック。
 *
 * `maze` はマウント時点の値で固定する（XState actor は生成後にマシンを差し替えられない）。
 * 迷路を切り替えるときは呼び出し側が `key` 等で再マウントすること。
 *
 * `canRun` 相当の判定（命令が空でない等）はコマンド木を知る `useArStage` 側で合成する
 * — 本フックはコマンド構築状態を持たないため。
 *
 * @param maze 実行対象の迷路
 * @returns 実行操作と表示値（{@link UseMazeSimulationResult}）
 */
export const useMazeSimulation = (maze: Maze): UseMazeSimulationResult => {
  const [machine] = useState(() => createMazeSimulationMachine({ maze }));
  const [snapshot, send] = useMachine(machine);
  const [isPaused, setIsPaused] = useState(false);
  const [visibleFloor, setVisibleFloorState] = useState<number>(() => findStartFloor(maze));

  // 本マシンはフラット（ネスト状態なし）のため value は常に文字列。
  const machineValue = String(snapshot.value);
  const status = toRunStatus(machineValue, isPaused);
  const isRunning = status === "running" || status === "paused";

  const view = useMemo(
    () => deriveExecutionView(snapshot.context.lastEvents),
    [snapshot.context.lastEvents],
  );

  // running かつ非 pause の間だけ STEP を刻む。成功/失敗到達・pause・unmount で
  // 依存が変わり cleanup が走るため、タイマーは漏れない。
  const isSteppingActive = machineValue === "running" && !isPaused;
  useEffect(() => {
    if (!isSteppingActive) {
      return undefined;
    }
    const intervalId = setInterval(() => {
      send({ type: "STEP" });
    }, STEP_INTERVAL_MS);
    return () => {
      clearInterval(intervalId);
    };
  }, [isSteppingActive, send]);

  // 実行イベント（移動・テレポート）の到達階へ表示階を追従させる。
  useEffect(() => {
    if (view.visibleFloorFromEvents !== null) {
      setVisibleFloorState(view.visibleFloorFromEvents);
    }
  }, [view.visibleFloorFromEvents]);

  const run = useCallback(
    (commands: readonly Command[]): void => {
      setIsPaused(false);
      // 実行はスタート地点から始まるため、表示階もスタートのある階へ戻す。
      setVisibleFloorState(findStartFloor(maze));
      send({ type: "START_RUN", commands });
    },
    [maze, send],
  );

  const pause = useCallback((): void => {
    if (machineValue !== "running") {
      return;
    }
    setIsPaused(true);
  }, [machineValue]);

  const resume = useCallback((): void => {
    setIsPaused(false);
  }, []);

  const reset = useCallback((): void => {
    setIsPaused(false);
    setVisibleFloorState(findStartFloor(maze));
    send({ type: "RESET_RUN" });
  }, [maze, send]);

  const closeResult = useCallback((): void => {
    setIsPaused(false);
    send({ type: "CLOSE_RESULT" });
  }, [send]);

  const setVisibleFloor = useCallback(
    (floor: number): void => {
      // 実行中はイベント追従が正。また範囲外の階は 3D 側で描けないため弾く。
      if (isRunning || !Number.isInteger(floor) || floor < 0 || floor >= maze.floors) {
        return;
      }
      setVisibleFloorState(floor);
    },
    [isRunning, maze.floors],
  );

  return {
    robot: snapshot.context.execution?.robot ?? null,
    moveCount: snapshot.context.execution?.moveCount ?? 0,
    activePath: view.activePath,
    robotAction: view.robotAction,
    visibleFloor,
    status,
    failureReason: view.failureReason,
    isRunning,
    run,
    pause,
    resume,
    reset,
    closeResult,
    setVisibleFloor,
  };
};

/**
 * マシン状態 → RunStatus 写像（FSD: widgets/ar-stage/lib）
 *
 * features/maze-simulation の XState マシンの state value を、UI が扱う
 * {@link RunStatus} へ写像する純粋関数。paused はマシンに無い概念（STEP 送信タイマーを
 * 止めているだけ）なので、フック層のフラグを引数で受け取って合成する。
 */
import type { RunStatus } from "../model/types";

/**
 * マシンの state value と pause フラグから UI 向けの実行状態を導出する。
 *
 * - `idle` / `building` / `resetting` → `"idle"`（UI にとってはどれも編集できる待機中。
 *   `resetting` は always 遷移の過渡状態で、観測されることは実質ない）
 * - `running` → pause フラグに応じて `"running"` / `"paused"`
 * - `success` → `"succeeded"`、`failure` → `"failed"`
 *
 * @param machineValue XState スナップショットの state value（本マシンはフラットなので文字列）
 * @param isPaused フック層が STEP 送信タイマーを止めているか
 * @returns UI 向けの実行状態
 */
export const toRunStatus = (machineValue: string, isPaused: boolean): RunStatus => {
  switch (machineValue) {
    case "running":
      return isPaused ? "paused" : "running";
    case "success":
      return "succeeded";
    case "failure":
      return "failed";
    default:
      return "idle";
  }
};

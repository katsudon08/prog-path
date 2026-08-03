// 同一スライス内なので、実装の検証は相対importで行う。
import { describe, expect, it } from "vitest";

import { COMMAND_KIND, LOOP_COMMAND_KIND } from "@/entities/command";
import { COMMAND_SCAN_COOLDOWN_MS } from "@/shared/config";

import {
  cancelLoopStart,
  confirmLoopCount,
  createInitialCommandBuilderState,
  deleteCommandAt,
  handleQrPayload,
} from "./command-builder";
import type {
  CommandBuilderOutcome,
  CommandBuilderResult,
  CommandBuilderState,
  InsertionPoint,
} from "./types";

const point = (containerPath: readonly number[], index: number): InsertionPoint => ({
  containerPath,
  index,
});

const getOutcome = <T extends CommandBuilderOutcome["type"]>(
  result: CommandBuilderResult,
  type: T,
): Extract<CommandBuilderOutcome, { type: T }> => {
  if (result.outcome.type !== type) {
    throw new Error(`expected ${type}, received ${result.outcome.type}`);
  }
  return result.outcome as Extract<CommandBuilderOutcome, { type: T }>;
};

const add = (
  state: CommandBuilderState,
  payload: string,
  insertionPoint: InsertionPoint,
  now: number,
): { state: CommandBuilderState; next: InsertionPoint } => {
  const result = handleQrPayload(state, payload, insertionPoint, now);
  const outcome = getOutcome(result, "command-added");
  return { state: result.state, next: outcome.nextInsertionPoint };
};

describe("command builder", () => {
  it("rootへ命令を追加し、次の挿入位置を1つ進める", () => {
    const initial = createInitialCommandBuilderState();
    const result = handleQrPayload(initial, COMMAND_KIND.FORWARD, point([], 0), 0);
    const outcome = getOutcome(result, "command-added");

    expect(result.state.commands).toEqual([{ kind: COMMAND_KIND.FORWARD }]);
    expect(outcome.nextInsertionPoint).toEqual(point([], 1));
    expect(initial.commands).toEqual([]);
  });

  it("選択した同一階層の位置へ命令を挿入する", () => {
    let state = createInitialCommandBuilderState();
    let next = point([], 0);

    ({ state, next } = add(state, COMMAND_KIND.FORWARD, next, 0));
    ({ state } = add(state, COMMAND_KIND.TURN_LEFT, next, COMMAND_SCAN_COOLDOWN_MS));

    const result = handleQrPayload(state, COMMAND_KIND.TURN_RIGHT, point([], 1), 4_000);
    getOutcome(result, "command-added");

    expect(result.state.commands).toEqual([
      { kind: COMMAND_KIND.FORWARD },
      { kind: COMMAND_KIND.TURN_RIGHT },
      { kind: COMMAND_KIND.TURN_LEFT },
    ]);
  });

  it("閉じたloopのchildrenへcontainerPathを指定して挿入する", () => {
    const pending = handleQrPayload(
      createInitialCommandBuilderState(),
      COMMAND_KIND.LOOP_START,
      point([], 0),
      0,
    );
    const added = confirmLoopCount(pending.state, 2);
    const child = handleQrPayload(
      added.state,
      COMMAND_KIND.FORWARD,
      point([0], 0),
      COMMAND_SCAN_COOLDOWN_MS,
    );
    const closed = handleQrPayload(
      child.state,
      COMMAND_KIND.LOOP_END,
      point([0], 1),
      COMMAND_SCAN_COOLDOWN_MS * 2,
    );

    const inserted = handleQrPayload(
      closed.state,
      COMMAND_KIND.TURN_RIGHT,
      point([0], 0),
      COMMAND_SCAN_COOLDOWN_MS * 3,
    );
    getOutcome(inserted, "command-added");

    expect(inserted.state.commands).toEqual([
      {
        kind: LOOP_COMMAND_KIND,
        count: 2,
        children: [{ kind: COMMAND_KIND.TURN_RIGHT }, { kind: COMMAND_KIND.FORWARD }],
      },
    ]);
  });

  it("containerPathとindexの範囲外を拒否する", () => {
    const initial = createInitialCommandBuilderState();
    const invalidIndex = handleQrPayload(initial, COMMAND_KIND.FORWARD, point([], 1), 0);
    const invalidIndexOutcome = getOutcome(invalidIndex, "error");
    expect(invalidIndexOutcome.error.code).toBe("invalid-insertion-point");

    const invalidPath = handleQrPayload(
      initial,
      COMMAND_KIND.FORWARD,
      point([0], 0),
      COMMAND_SCAN_COOLDOWN_MS,
    );
    const invalidPathOutcome = getOutcome(invalidPath, "error");
    expect(invalidPathOutcome.error.code).toBe("invalid-insertion-point");
  });

  it("loopを開始・確定し、childrenへ命令を追加して閉じる", () => {
    const initial = createInitialCommandBuilderState();
    const pending = handleQrPayload(initial, COMMAND_KIND.LOOP_START, point([], 0), 0);
    getOutcome(pending, "loop-count-pending");

    const added = confirmLoopCount(pending.state, 2);
    const loopAdded = getOutcome(added, "loop-added");
    expect(loopAdded.loopPath).toEqual([0]);
    expect(added.state.commands).toEqual([{ kind: LOOP_COMMAND_KIND, count: 2, children: [] }]);

    const child = handleQrPayload(
      added.state,
      COMMAND_KIND.FORWARD,
      loopAdded.nextInsertionPoint,
      COMMAND_SCAN_COOLDOWN_MS,
    );
    getOutcome(child, "command-added");
    expect(child.state.commands).toEqual([
      {
        kind: LOOP_COMMAND_KIND,
        count: 2,
        children: [{ kind: COMMAND_KIND.FORWARD }],
      },
    ]);

    const closed = handleQrPayload(
      child.state,
      COMMAND_KIND.LOOP_END,
      point([0], 1),
      COMMAND_SCAN_COOLDOWN_MS * 2,
    );
    const closeOutcome = getOutcome(closed, "loop-closed");
    expect(closeOutcome.closedLoopPath).toEqual([0]);
    expect(closed.state.openLoopPaths).toEqual([]);
    expect(closeOutcome.nextInsertionPoint).toEqual(point([], 1));
  });

  it("多重loopを内側から閉じる", () => {
    let state = createInitialCommandBuilderState();
    let next = point([], 0);

    const outerPending = handleQrPayload(state, COMMAND_KIND.LOOP_START, next, 0);
    state = confirmLoopCount(outerPending.state, 2).state;
    next = point([0], 0);

    const innerPending = handleQrPayload(
      state,
      COMMAND_KIND.LOOP_START,
      next,
      COMMAND_SCAN_COOLDOWN_MS,
    );
    const innerAdded = confirmLoopCount(innerPending.state, 3);
    state = innerAdded.state;

    expect(state.openLoopPaths).toEqual([[0], [0, 0]]);
    const innerClosed = handleQrPayload(
      state,
      COMMAND_KIND.LOOP_END,
      point([0, 0], 0),
      COMMAND_SCAN_COOLDOWN_MS * 2,
    );
    const innerCloseOutcome = getOutcome(innerClosed, "loop-closed");
    expect(innerClosed.state.openLoopPaths).toEqual([[0]]);
    expect(innerCloseOutcome.nextInsertionPoint).toEqual(point([0], 1));

    const outerClosed = handleQrPayload(
      innerClosed.state,
      COMMAND_KIND.LOOP_END,
      point([0], 1),
      COMMAND_SCAN_COOLDOWN_MS * 3,
    );
    getOutcome(outerClosed, "loop-closed");
    expect(outerClosed.state.openLoopPaths).toEqual([]);
  });

  it("無効な回数では入力待ちを維持し、キャンセルで解除する", () => {
    const pending = handleQrPayload(
      createInitialCommandBuilderState(),
      COMMAND_KIND.LOOP_START,
      point([], 0),
      0,
    );
    const invalid = confirmLoopCount(pending.state, 1);
    const invalidOutcome = getOutcome(invalid, "error");

    expect(invalidOutcome.error.code).toBe("loop-count-out-of-range");
    expect(invalid.state.pendingLoopStart).not.toBeNull();
    expect(invalid.state.commands).toEqual([]);

    const cancelled = cancelLoopStart(invalid.state);
    const cancelOutcome = getOutcome(cancelled, "cancelled");
    expect(cancelled.state.pendingLoopStart).toBeNull();
    expect(cancelOutcome.nextInsertionPoint).toEqual(point([], 0));
  });

  it("不正なQRは状態を変えず、認識可能なQRの重複は2秒抑止する", () => {
    const initial = createInitialCommandBuilderState();
    const invalid = handleQrPayload(initial, "unknown", point([], 0), 0);
    const invalidOutcome = getOutcome(invalid, "error");

    expect(invalidOutcome.error.code).toBe("invalid-qr-payload");
    expect(invalid.state).toEqual(initial);

    const added = handleQrPayload(initial, COMMAND_KIND.FORWARD, point([], 0), 0);
    const ignored = handleQrPayload(
      added.state,
      COMMAND_KIND.TURN_RIGHT,
      point([], 1),
      COMMAND_SCAN_COOLDOWN_MS - 1,
    );
    getOutcome(ignored, "ignored");
    expect(ignored.outcome).toEqual({ type: "ignored", reason: "cooldown" });
    expect(ignored.state.commands).toEqual([{ kind: COMMAND_KIND.FORWARD }]);

    const accepted = handleQrPayload(
      ignored.state,
      COMMAND_KIND.TURN_RIGHT,
      point([], 1),
      COMMAND_SCAN_COOLDOWN_MS,
    );
    getOutcome(accepted, "command-added");
    expect(accepted.state.commands).toEqual([
      { kind: COMMAND_KIND.FORWARD },
      { kind: COMMAND_KIND.TURN_RIGHT },
    ]);
  });

  it("対応しないloopEndをエラーにし、直後の再検出を抑止する", () => {
    const initial = createInitialCommandBuilderState();
    const result = handleQrPayload(initial, COMMAND_KIND.LOOP_END, point([], 0), 10);
    const outcome = getOutcome(result, "error");

    expect(outcome.error.code).toBe("loop-end-without-loop");
    expect(result.state.commands).toEqual([]);

    // 同じカードをかざし続けている間は「連写」であって取りこぼしではない。
    const ignored = handleQrPayload(result.state, COMMAND_KIND.LOOP_END, point([], 0), 10 + 1);
    expect(ignored.outcome).toEqual({ type: "ignored", reason: "holding-same-card" });
  });

  it("cooldown中でも、直前と別のカードなら取りこぼしとしてcooldownを通知する", () => {
    const added = handleQrPayload(
      createInitialCommandBuilderState(),
      COMMAND_KIND.FORWARD,
      point([], 0),
      0,
    );
    expect(added.state.lastScanPayload).toBe(COMMAND_KIND.FORWARD);

    const sameCard = handleQrPayload(added.state, COMMAND_KIND.FORWARD, point([], 1), 100);
    expect(sameCard.outcome).toEqual({ type: "ignored", reason: "holding-same-card" });

    const otherCard = handleQrPayload(added.state, COMMAND_KIND.TURN_RIGHT, point([], 1), 100);
    expect(otherCard.outcome).toEqual({ type: "ignored", reason: "cooldown" });
  });

  it("cooldownを張るエラーでもlastScanPayloadを更新し、同じ不正カードの連写を静かに無視する", () => {
    const initial = createInitialCommandBuilderState();
    // 挿入位置が不正（root の範囲外）→ cooldown を張るエラー。
    const failed = handleQrPayload(initial, COMMAND_KIND.FORWARD, point([], 5), 0);
    expect(getOutcome(failed, "error").error.code).toBe("invalid-insertion-point");
    expect(failed.state.lastScanPayload).toBe(COMMAND_KIND.FORWARD);

    const held = handleQrPayload(failed.state, COMMAND_KIND.FORWARD, point([], 5), 100);
    expect(held.outcome).toEqual({ type: "ignored", reason: "holding-same-card" });
  });

  it("構築中は一番内側loop以外の挿入位置を拒否する", () => {
    const pending = handleQrPayload(
      createInitialCommandBuilderState(),
      COMMAND_KIND.LOOP_START,
      point([], 0),
      0,
    );
    const added = confirmLoopCount(pending.state, 2);
    const invalid = handleQrPayload(
      added.state,
      COMMAND_KIND.FORWARD,
      point([], 1),
      COMMAND_SCAN_COOLDOWN_MS,
    );
    const outcome = getOutcome(invalid, "error");

    expect(outcome.error.code).toBe("invalid-insertion-point");
    expect(invalid.state.commands).toEqual(added.state.commands);
  });

  it("loop全体を削除し、構築中のloopスタックも調整する", () => {
    let state = createInitialCommandBuilderState();
    const outerPending = handleQrPayload(state, COMMAND_KIND.LOOP_START, point([], 0), 0);
    const outerAdded = confirmLoopCount(outerPending.state, 2);
    const innerPending = handleQrPayload(
      outerAdded.state,
      COMMAND_KIND.LOOP_START,
      point([0], 0),
      COMMAND_SCAN_COOLDOWN_MS,
    );
    state = confirmLoopCount(innerPending.state, 3).state;

    const deleted = deleteCommandAt(state, [0]);
    const outcome = getOutcome(deleted, "command-deleted");

    expect(outcome.deletedPath).toEqual([0]);
    expect(deleted.state.commands).toEqual([]);
    expect(deleted.state.openLoopPaths).toEqual([]);
    expect(outcome.nextInsertionPoint).toEqual(point([], 0));
  });

  it("active loopの前にあるroot命令を削除するとloopパスを詰める", () => {
    let state = createInitialCommandBuilderState();
    ({ state } = add(state, COMMAND_KIND.FORWARD, point([], 0), 0));
    const pending = handleQrPayload(
      state,
      COMMAND_KIND.LOOP_START,
      point([], 1),
      COMMAND_SCAN_COOLDOWN_MS,
    );
    state = confirmLoopCount(pending.state, 2).state;

    const deleted = deleteCommandAt(state, [0]);
    expect(deleted.state.commands).toEqual([{ kind: LOOP_COMMAND_KIND, count: 2, children: [] }]);
    expect(deleted.state.openLoopPaths).toEqual([[0]]);
    const outcome = getOutcome(deleted, "command-deleted");
    expect(outcome.nextInsertionPoint).toEqual(point([0], 0));
  });
});

import { describe, expect, it } from "vitest";

import { ROBOT_ACTION } from "@/entities/robot";
import { EXECUTION_EVENT_TYPE, FAILURE_REASON } from "@/features/maze-simulation";
import type { ExecutionEvent } from "@/features/maze-simulation";

import { deriveExecutionView } from "./execution-view";

describe("deriveExecutionView", () => {
  it("空のイベント列からはすべて null を返す", () => {
    expect(deriveExecutionView([])).toEqual({
      activePath: null,
      robotAction: null,
      visibleFloorFromEvents: null,
      failureReason: null,
    });
  });

  it("command-executed から activePath を導出する", () => {
    const events: ExecutionEvent[] = [
      {
        type: EXECUTION_EVENT_TYPE.COMMAND_EXECUTED,
        commandPath: [1, 0],
        kind: "forward",
      },
    ];
    expect(deriveExecutionView(events).activePath).toEqual([1, 0]);
  });

  it("moved の到達先から表示階の追従値を導出する", () => {
    const events: ExecutionEvent[] = [
      {
        type: EXECUTION_EVENT_TYPE.MOVED,
        commandPath: [0],
        from: { floor: 0, row: 0, col: 0 },
        to: { floor: 0, row: 1, col: 0 },
        moveCount: 1,
      },
    ];
    expect(deriveExecutionView(events).visibleFloorFromEvents).toBe(0);
  });

  it("teleported の到達先の階を後勝ちで反映する", () => {
    const events: ExecutionEvent[] = [
      {
        type: EXECUTION_EVENT_TYPE.MOVED,
        commandPath: [0],
        from: { floor: 0, row: 0, col: 0 },
        to: { floor: 0, row: 1, col: 0 },
        moveCount: 1,
      },
      {
        type: EXECUTION_EVENT_TYPE.TELEPORTED,
        commandPath: [0],
        from: { floor: 0, row: 1, col: 0 },
        to: { floor: 2, row: 3, col: 3 },
      },
    ];
    expect(deriveExecutionView(events).visibleFloorFromEvents).toBe(2);
  });

  it("hole-filled から穴埋めアニメ指示を導出する", () => {
    const events: ExecutionEvent[] = [
      {
        type: EXECUTION_EVENT_TYPE.HOLE_FILLED,
        commandPath: [0],
        at: { floor: 0, row: 1, col: 0 },
      },
    ];
    expect(deriveExecutionView(events).robotAction).toBe(ROBOT_ACTION.FILL_HOLE);
  });

  it("failure(hole-fall) から落下アニメ指示と失敗理由を導出する", () => {
    const events: ExecutionEvent[] = [
      {
        type: EXECUTION_EVENT_TYPE.FAILURE,
        reason: FAILURE_REASON.HOLE_FALL,
        at: { floor: 0, row: 1, col: 0 },
      },
    ];
    const view = deriveExecutionView(events);
    expect(view.robotAction).toBe(ROBOT_ACTION.FALL);
    expect(view.failureReason).toBe(FAILURE_REASON.HOLE_FALL);
  });

  it("hole-fall 以外の failure はアニメ指示を出さず理由だけ返す", () => {
    const events: ExecutionEvent[] = [
      {
        type: EXECUTION_EVENT_TYPE.FAILURE,
        reason: FAILURE_REASON.WALL_COLLISION,
        at: { floor: 0, row: 0, col: 0 },
      },
    ];
    const view = deriveExecutionView(events);
    expect(view.robotAction).toBeNull();
    expect(view.failureReason).toBe(FAILURE_REASON.WALL_COLLISION);
  });

  it("1 STEP に複数イベントがある場合もまとめて導出する", () => {
    const events: ExecutionEvent[] = [
      {
        type: EXECUTION_EVENT_TYPE.COMMAND_EXECUTED,
        commandPath: [2],
        kind: "forward",
      },
      {
        type: EXECUTION_EVENT_TYPE.MOVED,
        commandPath: [2],
        from: { floor: 1, row: 0, col: 0 },
        to: { floor: 1, row: 1, col: 0 },
        moveCount: 3,
      },
      {
        type: EXECUTION_EVENT_TYPE.KEY_COLLECTED,
        commandPath: [2],
        at: { floor: 1, row: 1, col: 0 },
      },
    ];
    expect(deriveExecutionView(events)).toEqual({
      activePath: [2],
      robotAction: null,
      visibleFloorFromEvents: 1,
      failureReason: null,
    });
  });
});

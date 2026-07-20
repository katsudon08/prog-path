// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";

import { COMMAND_KIND } from "@/entities/command";
import type { Command } from "@/entities/command";
import { createInitialMaze, TILE_KIND } from "@/entities/maze";
import type { Maze } from "@/entities/maze";
import { FAILURE_REASON } from "@/features/maze-simulation";
import { UNCATEGORIZED_FOLDER_ID } from "@/shared/config";

import { STEP_INTERVAL_MS, useMazeSimulation } from "./use-maze-simulation";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/**
 * スタート (0,0)・ゴール (1,0) の 5x5 迷路。初期向きは南（下方向）なので
 * forward 1 回でゴールに到達する（maze-simulation のマシンテストと同じ流儀）。
 */
const createMaze = (floors = 1): Maze => {
  const structure = createInitialMaze(5, floors);
  structure.tiles[0][4][4] = TILE_KIND.FLOOR;
  structure.tiles[0][1][0] = TILE_KIND.GOAL;
  return {
    id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
    name: "実行フックテスト迷路",
    folderId: UNCATEGORIZED_FOLDER_ID,
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
    ...structure,
  };
};

const forward: Command = { kind: COMMAND_KIND.FORWARD };
const turnRight: Command = { kind: COMMAND_KIND.TURN_RIGHT };

/** STEP を n 回分だけ時間を進める。 */
const advanceSteps = (n: number): void => {
  act(() => {
    vi.advanceTimersByTime(STEP_INTERVAL_MS * n);
  });
};

describe("useMazeSimulation", () => {
  it("初期状態は idle で、ロボット未生成・表示階はスタートの階", () => {
    const { result } = renderHook(() => useMazeSimulation(createMaze()));
    expect(result.current.status).toBe("idle");
    expect(result.current.isRunning).toBe(false);
    expect(result.current.robot).toBeNull();
    expect(result.current.moveCount).toBe(0);
    expect(result.current.visibleFloor).toBe(0);
  });

  it("run で実行を開始し、STEP 刻みで succeeded に到達する", () => {
    const { result } = renderHook(() => useMazeSimulation(createMaze()));

    act(() => {
      result.current.run([forward]);
    });
    expect(result.current.status).toBe("running");
    expect(result.current.isRunning).toBe(true);
    expect(result.current.robot?.position).toEqual({ floor: 0, row: 0, col: 0 });

    advanceSteps(1);
    expect(result.current.status).toBe("succeeded");
    expect(result.current.isRunning).toBe(false);
    expect(result.current.moveCount).toBe(1);
    expect(result.current.activePath).toEqual([0]);

    // 成功到達後はタイマーが止まり、時間を進めても状態は変わらない。
    advanceSteps(5);
    expect(result.current.status).toBe("succeeded");
  });

  it("命令が尽きると failed になり、失敗理由を導出する", () => {
    const { result } = renderHook(() => useMazeSimulation(createMaze()));

    act(() => {
      result.current.run([turnRight]);
    });
    advanceSteps(1);
    expect(result.current.status).toBe("running");

    advanceSteps(1);
    expect(result.current.status).toBe("failed");
    expect(result.current.failureReason).toBe(FAILURE_REASON.COMMAND_EXHAUSTED);
  });

  it("pause で STEP が止まり、resume で再開する", () => {
    const { result } = renderHook(() => useMazeSimulation(createMaze()));

    act(() => {
      result.current.run([turnRight, turnRight]);
    });
    advanceSteps(1);
    // 南 → 西（1 回目の turnRight 実行済み）。
    expect(result.current.robot?.direction).toBe("west");

    act(() => {
      result.current.pause();
    });
    expect(result.current.status).toBe("paused");
    expect(result.current.isRunning).toBe(true);

    // pause 中は時間を進めても STEP が送られない。
    advanceSteps(5);
    expect(result.current.robot?.direction).toBe("west");
    expect(result.current.status).toBe("paused");

    act(() => {
      result.current.resume();
    });
    expect(result.current.status).toBe("running");
    advanceSteps(1);
    // 西 → 北（2 回目の turnRight が実行された = 再開している）。
    expect(result.current.robot?.direction).toBe("north");
  });

  it("実行中でなければ pause は何もしない", () => {
    const { result } = renderHook(() => useMazeSimulation(createMaze()));
    act(() => {
      result.current.pause();
    });
    expect(result.current.status).toBe("idle");
  });

  it("reset でロボットが開始状態へ戻り、実行が最初からやり直される", () => {
    const { result } = renderHook(() => useMazeSimulation(createMaze()));

    act(() => {
      result.current.run([turnRight]);
    });
    advanceSteps(1);
    expect(result.current.robot?.direction).toBe("west");

    act(() => {
      result.current.reset();
    });
    expect(result.current.status).toBe("running");
    expect(result.current.robot?.direction).toBe("south");
    expect(result.current.robot?.position).toEqual({ floor: 0, row: 0, col: 0 });
    expect(result.current.moveCount).toBe(0);
  });

  it("closeResult で結果を閉じ、編集可能（idle）へ戻る", () => {
    const { result } = renderHook(() => useMazeSimulation(createMaze()));

    act(() => {
      result.current.run([forward]);
    });
    advanceSteps(1);
    expect(result.current.status).toBe("succeeded");

    act(() => {
      result.current.closeResult();
    });
    expect(result.current.status).toBe("idle");
    expect(result.current.robot).toBeNull();
    expect(result.current.activePath).toBeNull();
  });

  it("unmount でタイマーが残らない", () => {
    const { result, unmount } = renderHook(() => useMazeSimulation(createMaze()));

    act(() => {
      result.current.run([turnRight, turnRight]);
    });
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("表示階は編集時のみ手動で切り替えられ、run で開始階へ戻る", () => {
    const { result } = renderHook(() => useMazeSimulation(createMaze(2)));

    act(() => {
      result.current.setVisibleFloor(1);
    });
    expect(result.current.visibleFloor).toBe(1);

    // 範囲外は無視。
    act(() => {
      result.current.setVisibleFloor(2);
    });
    expect(result.current.visibleFloor).toBe(1);

    act(() => {
      result.current.run([forward]);
    });
    expect(result.current.visibleFloor).toBe(0);

    // 実行中の手動切替は無視（イベント追従が正）。
    act(() => {
      result.current.setVisibleFloor(1);
    });
    expect(result.current.visibleFloor).toBe(0);
  });
});

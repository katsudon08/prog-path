// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";

import { COMMAND_KIND, LOOP_COMMAND_KIND } from "@/entities/command";
import { createInitialMaze, TILE_KIND } from "@/entities/maze";
import type { Maze } from "@/entities/maze";
import { FAILURE_REASON } from "@/features/maze-simulation";
import { COMMAND_SCAN_COOLDOWN_MS, UNCATEGORIZED_FOLDER_ID } from "@/shared/config";

import { STEP_INTERVAL_MS } from "./use-maze-simulation";
import { useArStage } from "./use-ar-stage";

// QR cooldown（Date.now）と STEP interval の両方を制御するため fake timers を使う。
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(1_700_000_000_000);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/** スタート (0,0)・ゴール (1,0)。初期向きは南なので forward 1 回でゴール。 */
const createMaze = (): Maze => {
  const structure = createInitialMaze(5, 1);
  structure.tiles[0][4][4] = TILE_KIND.FLOOR;
  structure.tiles[0][1][0] = TILE_KIND.GOAL;
  return {
    id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
    name: "AR ステージテスト迷路",
    folderId: UNCATEGORIZED_FOLDER_ID,
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
    ...structure,
  };
};

/** QR cooldown を確実に越えるまで時間を進める（編集中は STEP interval が無いので安全）。 */
const passCooldown = (): void => {
  act(() => {
    vi.advanceTimersByTime(COMMAND_SCAN_COOLDOWN_MS + 1);
  });
};

/** STEP を n 回分だけ時間を進める。 */
const advanceSteps = (n: number): void => {
  act(() => {
    vi.advanceTimersByTime(STEP_INTERVAL_MS * n);
  });
};

describe("useArStage", () => {
  it("初期状態は編集可能で、命令が無いため実行できない", () => {
    const { result } = renderHook(() => useArStage(createMaze()));
    expect(result.current.status).toBe("idle");
    expect(result.current.isEditable).toBe(true);
    expect(result.current.readOnly).toBe(false);
    expect(result.current.canRun).toBe(false);
    expect(result.current.loopDialogOpen).toBe(false);
    expect(result.current.successOpen).toBe(false);
    expect(result.current.failureOpen).toBe(false);
  });

  it("QR で命令を追加すると実行可能になる", () => {
    const { result } = renderHook(() => useArStage(createMaze()));

    act(() => {
      result.current.handleQr(COMMAND_KIND.FORWARD);
    });

    expect(result.current.commands).toEqual([{ kind: COMMAND_KIND.FORWARD }]);
    expect(result.current.selected).toEqual({ containerPath: [], index: 1 });
    expect(result.current.canRun).toBe(true);
  });

  it("loopStart でループ回数ダイアログが開き、確定まで実行できない", () => {
    const { result } = renderHook(() => useArStage(createMaze()));

    act(() => {
      result.current.handleQr(COMMAND_KIND.LOOP_START);
    });
    expect(result.current.loopDialogOpen).toBe(true);
    expect(result.current.canRun).toBe(false);

    act(() => {
      result.current.confirmLoop(2);
    });
    expect(result.current.loopDialogOpen).toBe(false);
    expect(result.current.commands).toHaveLength(1);
    expect(result.current.canRun).toBe(true);
  });

  it("cancelLoop でダイアログを閉じ、木を変えない", () => {
    const { result } = renderHook(() => useArStage(createMaze()));

    act(() => {
      result.current.handleQr(COMMAND_KIND.LOOP_START);
    });
    act(() => {
      result.current.cancelLoop();
    });

    expect(result.current.loopDialogOpen).toBe(false);
    expect(result.current.commands).toEqual([]);
  });

  it("canRun でないとき run は何もしない", () => {
    const { result } = renderHook(() => useArStage(createMaze()));
    act(() => {
      result.current.run();
    });
    expect(result.current.status).toBe("idle");
  });

  it("run 中は編集操作（QR・削除・位置選択）が no-op になる", () => {
    const { result } = renderHook(() => useArStage(createMaze()));

    act(() => {
      result.current.handleQr(COMMAND_KIND.TURN_RIGHT);
    });
    passCooldown();
    act(() => {
      result.current.handleQr(COMMAND_KIND.TURN_RIGHT);
    });
    expect(result.current.commands).toHaveLength(2);
    const lastOutcomeBeforeRun = result.current.lastOutcome;

    act(() => {
      result.current.run();
    });
    expect(result.current.status).toBe("running");
    expect(result.current.isEditable).toBe(false);
    expect(result.current.readOnly).toBe(true);
    expect(result.current.canRun).toBe(false);

    // pause で STEP を止め、cooldown 起因ではなく「非編集状態」起因の no-op を検証する。
    act(() => {
      result.current.pause();
    });
    expect(result.current.status).toBe("paused");
    passCooldown();

    act(() => {
      result.current.handleQr(COMMAND_KIND.FORWARD);
      result.current.deleteCommand([0]);
      result.current.selectInsertionPoint({ containerPath: [], index: 0 });
    });
    expect(result.current.commands).toHaveLength(2);
    expect(result.current.lastOutcome).toBe(lastOutcomeBeforeRun);
    // 削除要求も no-op（確認ダイアログは開かない）。
    expect(result.current.deleteDialogOpen).toBe(false);
  });

  describe("削除確認フロー", () => {
    it("deleteCommand は即削除せず、確認ダイアログを開いて対象の表示名を出す", () => {
      const { result } = renderHook(() => useArStage(createMaze()));

      act(() => {
        result.current.handleQr(COMMAND_KIND.FORWARD);
      });
      act(() => {
        result.current.deleteCommand([0]);
      });

      expect(result.current.deleteDialogOpen).toBe(true);
      expect(result.current.deleteTargetLabel).toBe("前にすすむ");
      // まだ削除されていない。
      expect(result.current.commands).toEqual([{ kind: COMMAND_KIND.FORWARD }]);
    });

    it("confirmDelete で実削除され、selected が削除位置へ再同期される", () => {
      const { result } = renderHook(() => useArStage(createMaze()));

      act(() => {
        result.current.handleQr(COMMAND_KIND.FORWARD);
      });
      expect(result.current.selected).toEqual({ containerPath: [], index: 1 });

      act(() => {
        result.current.deleteCommand([0]);
      });
      act(() => {
        result.current.confirmDelete();
      });

      expect(result.current.commands).toEqual([]);
      expect(result.current.selected).toEqual({ containerPath: [], index: 0 });
      expect(result.current.deleteDialogOpen).toBe(false);
      expect(result.current.deleteTargetLabel).toBeNull();
    });

    it("cancelDelete はコマンド木を変えずダイアログを閉じる", () => {
      const { result } = renderHook(() => useArStage(createMaze()));

      act(() => {
        result.current.handleQr(COMMAND_KIND.FORWARD);
      });
      act(() => {
        result.current.deleteCommand([0]);
      });
      act(() => {
        result.current.cancelDelete();
      });

      expect(result.current.deleteDialogOpen).toBe(false);
      expect(result.current.deleteTargetLabel).toBeNull();
      expect(result.current.commands).toEqual([{ kind: COMMAND_KIND.FORWARD }]);
    });

    it("loop 自身は「くりかえし」、loop の子はネストパスで表示名を解決する", () => {
      const { result } = renderHook(() => useArStage(createMaze()));

      act(() => {
        result.current.handleQr(COMMAND_KIND.LOOP_START);
      });
      act(() => {
        result.current.confirmLoop(3);
      });
      passCooldown();
      act(() => {
        result.current.handleQr(COMMAND_KIND.TURN_RIGHT);
      });

      act(() => {
        result.current.deleteCommand([0]);
      });
      expect(result.current.deleteTargetLabel).toBe("くりかえし");

      act(() => {
        result.current.deleteCommand([0, 0]);
      });
      expect(result.current.deleteTargetLabel).toBe("右にまがる");

      act(() => {
        result.current.confirmDelete();
      });
      expect(result.current.commands).toEqual([
        { kind: LOOP_COMMAND_KIND, count: 3, children: [] },
      ]);
    });

    it("存在しないパスへの削除要求は無視される（ダイアログを開かない）", () => {
      const { result } = renderHook(() => useArStage(createMaze()));

      act(() => {
        result.current.handleQr(COMMAND_KIND.FORWARD);
      });
      act(() => {
        result.current.deleteCommand([5]);
      });

      expect(result.current.deleteDialogOpen).toBe(false);
      expect(result.current.deleteTargetLabel).toBeNull();
    });

    it("run 開始で保留中の削除確認を破棄する（実行中にダイアログが残らない）", () => {
      const { result } = renderHook(() => useArStage(createMaze()));

      act(() => {
        result.current.handleQr(COMMAND_KIND.FORWARD);
      });
      act(() => {
        result.current.deleteCommand([0]);
      });
      expect(result.current.deleteDialogOpen).toBe(true);

      act(() => {
        result.current.run();
      });

      expect(result.current.status).toBe("running");
      expect(result.current.deleteDialogOpen).toBe(false);
      expect(result.current.deleteTargetLabel).toBeNull();
      // 削除は確定していないため木は保持される。
      expect(result.current.commands).toEqual([{ kind: COMMAND_KIND.FORWARD }]);
    });
  });

  it("成功で successOpen が立ち、closeResult で編集可能へ戻る", () => {
    const { result } = renderHook(() => useArStage(createMaze()));

    act(() => {
      result.current.handleQr(COMMAND_KIND.FORWARD);
    });
    act(() => {
      result.current.run();
    });
    advanceSteps(1);

    expect(result.current.status).toBe("succeeded");
    expect(result.current.successOpen).toBe(true);
    expect(result.current.failureOpen).toBe(false);
    expect(result.current.isRunning).toBe(false);
    // 結果表示中も編集は不可。
    expect(result.current.isEditable).toBe(false);

    act(() => {
      result.current.closeResult();
    });
    expect(result.current.status).toBe("idle");
    expect(result.current.isEditable).toBe(true);
    expect(result.current.successOpen).toBe(false);
    // コマンド木は保持され、そのまま再実行できる。
    expect(result.current.commands).toEqual([{ kind: COMMAND_KIND.FORWARD }]);
    expect(result.current.canRun).toBe(true);
  });

  it("失敗で failureOpen と failureReason が立つ", () => {
    const { result } = renderHook(() => useArStage(createMaze()));

    act(() => {
      result.current.handleQr(COMMAND_KIND.TURN_RIGHT);
    });
    act(() => {
      result.current.run();
    });
    advanceSteps(2);

    expect(result.current.status).toBe("failed");
    expect(result.current.failureOpen).toBe(true);
    expect(result.current.successOpen).toBe(false);
    expect(result.current.failureReason).toBe(FAILURE_REASON.COMMAND_EXHAUSTED);

    act(() => {
      result.current.closeResult();
    });
    expect(result.current.isEditable).toBe(true);
    expect(result.current.failureOpen).toBe(false);
  });

  it("実行中に activePath が立ち、CommandPanel 契約の形で参照できる", () => {
    const { result } = renderHook(() => useArStage(createMaze()));

    act(() => {
      result.current.handleQr(COMMAND_KIND.TURN_RIGHT);
    });
    passCooldown();
    act(() => {
      result.current.handleQr(COMMAND_KIND.TURN_RIGHT);
    });
    act(() => {
      result.current.run();
    });

    advanceSteps(1);
    expect(result.current.activePath).toEqual([0]);
    advanceSteps(1);
    expect(result.current.activePath).toEqual([1]);
  });

  describe("未完了ループの実行抑止", () => {
    /** loopStart → 回数確定 → 子命令 1 個、で「閉じていないループ」を作る。 */
    const buildOpenLoop = (result: { current: ReturnType<typeof useArStage> }): void => {
      act(() => {
        result.current.handleQr(COMMAND_KIND.LOOP_START);
      });
      act(() => {
        result.current.confirmLoop(2);
      });
      passCooldown();
      act(() => {
        result.current.handleQr(COMMAND_KIND.FORWARD);
      });
    };

    it("未完了ループがあっても canRun は true のまま（ボタンは押せる）", () => {
      const { result } = renderHook(() => useArStage(createMaze()));
      buildOpenLoop(result);

      expect(result.current.openLoopPaths).toEqual([[0]]);
      expect(result.current.canRun).toBe(true);
      expect(result.current.unclosedLoopDialogOpen).toBe(false);
    });

    it("未完了ループがある状態で run すると実行せず警告を開く", () => {
      const { result } = renderHook(() => useArStage(createMaze()));
      buildOpenLoop(result);

      act(() => {
        result.current.run();
      });

      expect(result.current.unclosedLoopDialogOpen).toBe(true);
      expect(result.current.status).toBe("idle");
      expect(result.current.isEditable).toBe(true);
    });

    it("dismissUnclosedLoop で警告を閉じる（木は変えない）", () => {
      const { result } = renderHook(() => useArStage(createMaze()));
      buildOpenLoop(result);
      act(() => {
        result.current.run();
      });

      act(() => {
        result.current.dismissUnclosedLoop();
      });

      expect(result.current.unclosedLoopDialogOpen).toBe(false);
      expect(result.current.commands).toHaveLength(1);
    });

    it("警告表示中に loopEnd を読み取ると警告が自動で閉じ、実行できるようになる", () => {
      const { result } = renderHook(() => useArStage(createMaze()));
      buildOpenLoop(result);
      act(() => {
        result.current.run();
      });
      expect(result.current.unclosedLoopDialogOpen).toBe(true);

      passCooldown();
      act(() => {
        result.current.handleQr(COMMAND_KIND.LOOP_END);
      });
      expect(result.current.openLoopPaths).toEqual([]);
      expect(result.current.unclosedLoopDialogOpen).toBe(false);

      act(() => {
        result.current.run();
      });
      expect(result.current.status).toBe("running");
    });

    it("ループを閉じたあとは run が警告を出さずに実行を始める", () => {
      const { result } = renderHook(() => useArStage(createMaze()));
      buildOpenLoop(result);
      passCooldown();
      act(() => {
        result.current.handleQr(COMMAND_KIND.LOOP_END);
      });

      act(() => {
        result.current.run();
      });

      expect(result.current.unclosedLoopDialogOpen).toBe(false);
      expect(result.current.status).toBe("running");
    });
  });
});

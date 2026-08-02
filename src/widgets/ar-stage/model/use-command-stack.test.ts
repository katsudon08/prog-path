// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";

import { COMMAND_KIND, LOOP_COMMAND_KIND } from "@/entities/command";
import {
  COMMAND_BUILDER_IGNORED_REASON,
  COMMAND_BUILDER_OUTCOME_TYPE,
} from "@/features/command-management";
import { COMMAND_SCAN_COOLDOWN_MS } from "@/shared/config";

import { useCommandStack } from "./use-command-stack";

// handleQr が Date.now() で cooldown 判定するため、fake timers（Date も mock 対象）で時間を制御する。
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(1_700_000_000_000);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/** cooldown を確実に越えるまで時間を進める。 */
const passCooldown = (): void => {
  vi.advanceTimersByTime(COMMAND_SCAN_COOLDOWN_MS + 1);
};

describe("useCommandStack", () => {
  it("初期状態は空のコマンド木と root 先頭の選択位置を返す", () => {
    const { result } = renderHook(() => useCommandStack());
    expect(result.current.commands).toEqual([]);
    expect(result.current.selected).toEqual({ containerPath: [], index: 0 });
    expect(result.current.pendingLoopStart).toBeNull();
    expect(result.current.lastOutcome).toBeNull();
  });

  it("QR 追加でコマンドが増え、選択位置が次へ進む", () => {
    const { result } = renderHook(() => useCommandStack());

    act(() => {
      result.current.handleQr(COMMAND_KIND.FORWARD);
    });

    expect(result.current.commands).toEqual([{ kind: COMMAND_KIND.FORWARD }]);
    expect(result.current.selected).toEqual({ containerPath: [], index: 1 });
    expect(result.current.lastOutcome?.outcome.type).toBe(
      COMMAND_BUILDER_OUTCOME_TYPE.COMMAND_ADDED,
    );
    expect(result.current.lastOutcome?.seq).toBe(1);
  });

  it("cooldown 中に別のカードを読むと ignored になり、seq だけ進む", () => {
    const { result } = renderHook(() => useCommandStack());

    act(() => {
      result.current.handleQr(COMMAND_KIND.FORWARD);
    });
    act(() => {
      result.current.handleQr(COMMAND_KIND.TURN_RIGHT);
    });

    expect(result.current.commands).toHaveLength(1);
    expect(result.current.lastOutcome?.outcome).toEqual({
      type: COMMAND_BUILDER_OUTCOME_TYPE.IGNORED,
      reason: COMMAND_BUILDER_IGNORED_REASON.COOLDOWN,
    });
    expect(result.current.lastOutcome?.seq).toBe(2);
  });

  it("同じカードをかざし続けている間は lastOutcome を進めず、直前の通知を保つ", () => {
    const { result } = renderHook(() => useCommandStack());

    act(() => {
      result.current.handleQr(COMMAND_KIND.FORWARD);
    });
    const accepted = result.current.lastOutcome;

    // カメラは毎秒 10 回デコードする。cooldown 中の連写で seq が進むと、
    // 「ついかしたよ」トーストが 100ms で警告文言に塗り替えられてしまう。
    act(() => {
      result.current.handleQr(COMMAND_KIND.FORWARD);
      result.current.handleQr(COMMAND_KIND.FORWARD);
      result.current.handleQr(COMMAND_KIND.FORWARD);
    });

    expect(result.current.commands).toHaveLength(1);
    expect(result.current.lastOutcome).toBe(accepted);
    expect(result.current.lastOutcome?.seq).toBe(1);
  });

  it("loopEnd を読んだ直後に同じカードを読み続けても LOOP_CLOSED の通知が残る", () => {
    const { result } = renderHook(() => useCommandStack());

    act(() => {
      result.current.handleQr(COMMAND_KIND.LOOP_START);
    });
    act(() => {
      result.current.confirmLoop(3);
    });
    passCooldown();
    act(() => {
      result.current.handleQr(COMMAND_KIND.LOOP_END);
    });
    expect(result.current.lastOutcome?.outcome.type).toBe(COMMAND_BUILDER_OUTCOME_TYPE.LOOP_CLOSED);

    // loopEnd は成功してもコマンドスタックの見た目が変わらないため、
    // ここで通知が潰れると児童は「閉じたかどうか」を知る手段を失う。
    act(() => {
      result.current.handleQr(COMMAND_KIND.LOOP_END);
    });
    expect(result.current.lastOutcome?.outcome.type).toBe(COMMAND_BUILDER_OUTCOME_TYPE.LOOP_CLOSED);
  });

  it("openLoopPaths で構築中 loop を公開し、loopEnd で空になる", () => {
    const { result } = renderHook(() => useCommandStack());
    expect(result.current.openLoopPaths).toEqual([]);

    act(() => {
      result.current.handleQr(COMMAND_KIND.LOOP_START);
    });
    act(() => {
      result.current.confirmLoop(2);
    });
    expect(result.current.openLoopPaths).toEqual([[0]]);

    passCooldown();
    act(() => {
      result.current.handleQr(COMMAND_KIND.LOOP_END);
    });
    expect(result.current.openLoopPaths).toEqual([]);
  });

  it("loopStart → confirmLoop → 子追加 → loopEnd の一連の流れで木と選択位置を同期する", () => {
    const { result } = renderHook(() => useCommandStack());

    act(() => {
      result.current.handleQr(COMMAND_KIND.LOOP_START);
    });
    expect(result.current.pendingLoopStart).not.toBeNull();
    expect(result.current.lastOutcome?.outcome.type).toBe(
      COMMAND_BUILDER_OUTCOME_TYPE.LOOP_COUNT_PENDING,
    );
    // LOOP_COUNT_PENDING は nextInsertionPoint を持たないため選択位置は動かない。
    expect(result.current.selected).toEqual({ containerPath: [], index: 0 });

    act(() => {
      result.current.confirmLoop(3);
    });
    expect(result.current.pendingLoopStart).toBeNull();
    expect(result.current.commands).toEqual([{ kind: LOOP_COMMAND_KIND, count: 3, children: [] }]);
    // loop 追加後は loop の中へ選択位置が移る。
    expect(result.current.selected).toEqual({ containerPath: [0], index: 0 });

    act(() => {
      passCooldown();
      result.current.handleQr(COMMAND_KIND.FORWARD);
    });
    expect(result.current.commands).toEqual([
      { kind: LOOP_COMMAND_KIND, count: 3, children: [{ kind: COMMAND_KIND.FORWARD }] },
    ]);
    expect(result.current.selected).toEqual({ containerPath: [0], index: 1 });

    act(() => {
      passCooldown();
      result.current.handleQr(COMMAND_KIND.LOOP_END);
    });
    expect(result.current.lastOutcome?.outcome.type).toBe(COMMAND_BUILDER_OUTCOME_TYPE.LOOP_CLOSED);
    // loop を閉じたら選択位置は loop の直後（root 側）へ戻る。
    expect(result.current.selected).toEqual({ containerPath: [], index: 1 });
  });

  it("cancelLoop で保留中 loopStart を破棄し、選択位置を元へ戻す", () => {
    const { result } = renderHook(() => useCommandStack());

    act(() => {
      result.current.handleQr(COMMAND_KIND.LOOP_START);
    });
    act(() => {
      result.current.cancelLoop();
    });

    expect(result.current.pendingLoopStart).toBeNull();
    expect(result.current.commands).toEqual([]);
    expect(result.current.lastOutcome?.outcome.type).toBe(COMMAND_BUILDER_OUTCOME_TYPE.CANCELLED);
    expect(result.current.selected).toEqual({ containerPath: [], index: 0 });
  });

  it("deleteCommand で命令を削除し、選択位置を再同期する", () => {
    const { result } = renderHook(() => useCommandStack());

    act(() => {
      result.current.handleQr(COMMAND_KIND.FORWARD);
    });
    act(() => {
      passCooldown();
      result.current.handleQr(COMMAND_KIND.TURN_RIGHT);
    });
    expect(result.current.selected).toEqual({ containerPath: [], index: 2 });

    act(() => {
      result.current.deleteCommand([0]);
    });

    expect(result.current.commands).toEqual([{ kind: COMMAND_KIND.TURN_RIGHT }]);
    expect(result.current.lastOutcome?.outcome.type).toBe(
      COMMAND_BUILDER_OUTCOME_TYPE.COMMAND_DELETED,
    );
    // 削除位置が nextInsertionPoint として返り、選択位置が stale にならない。
    expect(result.current.selected).toEqual({ containerPath: [], index: 0 });
  });

  it("selectInsertionPoint で選択位置を直接切り替えられる", () => {
    const { result } = renderHook(() => useCommandStack());

    act(() => {
      result.current.handleQr(COMMAND_KIND.FORWARD);
    });
    act(() => {
      result.current.selectInsertionPoint({ containerPath: [], index: 0 });
    });

    expect(result.current.selected).toEqual({ containerPath: [], index: 0 });
  });

  it("不正な QR ペイロードは error outcome になり、木は変わらない", () => {
    const { result } = renderHook(() => useCommandStack());

    act(() => {
      result.current.handleQr("unknown-payload");
    });

    expect(result.current.commands).toEqual([]);
    expect(result.current.lastOutcome?.outcome.type).toBe(COMMAND_BUILDER_OUTCOME_TYPE.ERROR);
  });

  it("reset で初期状態へ戻る", () => {
    const { result } = renderHook(() => useCommandStack());

    act(() => {
      result.current.handleQr(COMMAND_KIND.FORWARD);
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.commands).toEqual([]);
    expect(result.current.selected).toEqual({ containerPath: [], index: 0 });
    expect(result.current.pendingLoopStart).toBeNull();
    expect(result.current.lastOutcome).toBeNull();
  });
});

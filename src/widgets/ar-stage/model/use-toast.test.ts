// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";

import { COMMAND_KIND } from "@/entities/command";
import { COMMAND_BUILDER_OUTCOME_TYPE } from "@/features/command-management";

import { TOAST_DURATION_MS, useToast } from "./use-toast";
import type { CommandStackOutcome } from "./types";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const addedOutcome = (seq: number): CommandStackOutcome => ({
  seq,
  outcome: {
    type: COMMAND_BUILDER_OUTCOME_TYPE.COMMAND_ADDED,
    commandKind: COMMAND_KIND.FORWARD,
    nextInsertionPoint: { containerPath: [], index: seq },
  },
});

const pendingOutcome = (seq: number): CommandStackOutcome => ({
  seq,
  outcome: {
    type: COMMAND_BUILDER_OUTCOME_TYPE.LOOP_COUNT_PENDING,
    insertionPoint: { containerPath: [], index: 0 },
  },
});

describe("useToast", () => {
  it("outcome 到着で表示し、規定時間後に自動で非表示になる（文言は残る）", () => {
    const { result, rerender } = renderHook(
      ({ outcome }: { outcome: CommandStackOutcome | null }) => useToast(outcome),
      { initialProps: { outcome: null as CommandStackOutcome | null } },
    );
    expect(result.current.message).toBeNull();
    expect(result.current.visible).toBe(false);

    rerender({ outcome: addedOutcome(1) });
    expect(result.current.visible).toBe(true);
    expect(result.current.message).toContain("前にすすむ");

    act(() => {
      vi.advanceTimersByTime(TOAST_DURATION_MS);
    });
    expect(result.current.visible).toBe(false);
    // フェードアウト用に文言は保持される。
    expect(result.current.message).toContain("前にすすむ");
  });

  it("seq が進むたびにタイマーを張り直して再表示する", () => {
    const { result, rerender } = renderHook(
      ({ outcome }: { outcome: CommandStackOutcome | null }) => useToast(outcome),
      { initialProps: { outcome: addedOutcome(1) as CommandStackOutcome | null } },
    );

    act(() => {
      vi.advanceTimersByTime(TOAST_DURATION_MS - 100);
    });
    rerender({ outcome: addedOutcome(2) });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    // 旧タイマーは破棄済みのため、まだ表示中。
    expect(result.current.visible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(TOAST_DURATION_MS);
    });
    expect(result.current.visible).toBe(false);
  });

  it("文言 null の outcome（loop-count-pending）ではトーストを出さない", () => {
    const { result, rerender } = renderHook(
      ({ outcome }: { outcome: CommandStackOutcome | null }) => useToast(outcome),
      { initialProps: { outcome: addedOutcome(1) as CommandStackOutcome | null } },
    );
    expect(result.current.visible).toBe(true);

    // ダイアログが開く outcome は表示中のトーストも畳む。
    rerender({ outcome: pendingOutcome(2) });
    expect(result.current.visible).toBe(false);
  });
});

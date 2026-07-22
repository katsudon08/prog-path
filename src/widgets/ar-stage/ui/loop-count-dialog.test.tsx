// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { LOOP_COUNT_MAX, LOOP_COUNT_MIN } from "@/shared/config";

import { LoopCountDialog } from "./loop-count-dialog";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const noop = (): void => {};

describe("LoopCountDialog", () => {
  it("open=false では何も描かない", () => {
    render(<LoopCountDialog open={false} onConfirm={noop} onCancel={noop} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("開くと最小値から始まり、＋/− で増減する", () => {
    render(<LoopCountDialog open onConfirm={noop} onCancel={noop} />);
    expect(screen.getByText(String(LOOP_COUNT_MIN))).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "ふやす" }));
    expect(screen.getByText(String(LOOP_COUNT_MIN + 1))).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "へらす" }));
    expect(screen.getByText(String(LOOP_COUNT_MIN))).toBeTruthy();
  });

  it("最小値で − が、最大値で ＋ が disabled になる（範囲外へ出ない）", () => {
    render(<LoopCountDialog open onConfirm={noop} onCancel={noop} />);
    const decrement = screen.getByRole("button", { name: "へらす" });
    const increment = screen.getByRole("button", { name: "ふやす" });

    expect(decrement).toHaveProperty("disabled", true);

    for (let i = LOOP_COUNT_MIN; i < LOOP_COUNT_MAX; i += 1) {
      fireEvent.click(increment);
    }
    expect(screen.getByText(String(LOOP_COUNT_MAX))).toBeTruthy();
    expect(increment).toHaveProperty("disabled", true);
    expect(decrement).toHaveProperty("disabled", false);
  });

  it("［けってい］で選択中の回数を onConfirm へ渡す", () => {
    const onConfirm = vi.fn();
    render(<LoopCountDialog open onConfirm={onConfirm} onCancel={noop} />);

    fireEvent.click(screen.getByRole("button", { name: "ふやす" }));
    fireEvent.click(screen.getByRole("button", { name: "けってい" }));
    expect(onConfirm).toHaveBeenCalledWith(LOOP_COUNT_MIN + 1);
  });

  it("［やめる］で onCancel を呼ぶ", () => {
    const onCancel = vi.fn();
    render(<LoopCountDialog open onConfirm={noop} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole("button", { name: "やめる" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("閉じて開き直すと最小値へ戻る", () => {
    const { rerender } = render(<LoopCountDialog open onConfirm={noop} onCancel={noop} />);
    fireEvent.click(screen.getByRole("button", { name: "ふやす" }));
    expect(screen.getByText(String(LOOP_COUNT_MIN + 1))).toBeTruthy();

    rerender(<LoopCountDialog open={false} onConfirm={noop} onCancel={noop} />);
    rerender(<LoopCountDialog open onConfirm={noop} onCancel={noop} />);
    expect(screen.getByText(String(LOOP_COUNT_MIN))).toBeTruthy();
  });
});

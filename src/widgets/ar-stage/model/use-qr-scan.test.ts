// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";

import type { QrResultHandler, QrScanLoop } from "@/shared/qr";

import { useQrScan } from "./use-qr-scan";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

interface FakeLoopHarness {
  createLoop: (video: HTMLVideoElement, onResult: QrResultHandler) => QrScanLoop;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  emit: (data: string) => void;
}

/** 生成・start/destroy の呼び出しと、デコード結果の擬似発火を観測できるフェイクループ。 */
const createFakeLoopHarness = (): FakeLoopHarness => {
  const start = vi.fn();
  const stop = vi.fn();
  const destroy = vi.fn();
  let handler: QrResultHandler | null = null;
  return {
    createLoop: (_video, onResult) => {
      handler = onResult;
      return { start, stop, destroy };
    },
    start,
    stop,
    destroy,
    emit: (data) => {
      handler?.(data);
    },
  };
};

describe("useQrScan", () => {
  it("enabled で start・結果を onPayload へ透過・disabled で destroy する", () => {
    const harness = createFakeLoopHarness();
    const onPayload = vi.fn();
    const videoRef = { current: document.createElement("video") };

    const { rerender, unmount } = renderHook(
      ({ enabled }) => useQrScan({ videoRef, enabled, onPayload, createLoop: harness.createLoop }),
      { initialProps: { enabled: true } },
    );

    expect(harness.start).toHaveBeenCalledTimes(1);
    harness.emit("forward");
    expect(onPayload).toHaveBeenCalledWith("forward");

    // readOnly（実行中）相当で無効化 → 破棄される。
    rerender({ enabled: false });
    expect(harness.destroy).toHaveBeenCalledTimes(1);

    // 再有効化 → 新しいループが張られる。
    rerender({ enabled: true });
    expect(harness.start).toHaveBeenCalledTimes(2);

    unmount();
    expect(harness.destroy).toHaveBeenCalledTimes(2);
  });

  it("video が無い間はループを生成しない", () => {
    const harness = createFakeLoopHarness();
    const videoRef: { current: HTMLVideoElement | null } = { current: null };

    renderHook(() =>
      useQrScan({ videoRef, enabled: true, onPayload: vi.fn(), createLoop: harness.createLoop }),
    );

    expect(harness.start).not.toHaveBeenCalled();
  });
});

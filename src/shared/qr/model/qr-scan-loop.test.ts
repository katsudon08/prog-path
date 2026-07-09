import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ループはデコードを decodeQr に委譲する。ここではループの間引き・ライフサイクル制御だけを
// 検証したいので decodeQr をモックする（qr-scanner には触れない）。
vi.mock("./decode-qr", () => ({
  decodeQr: vi.fn(),
}));

import { decodeQr } from "./decode-qr";
import { createQrScanLoop } from "./qr-scan-loop";

const decodeQrMock = vi.mocked(decodeQr);

// requestVideoFrameCallback を持たない stub → setTimeout 経路（fake timers で決定的に検証できる）。
const makeVideo = (readyState = 2) =>
  ({ readyState, HAVE_CURRENT_DATA: 2 }) as unknown as HTMLVideoElement;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  decodeQrMock.mockResolvedValue("forward");
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createQrScanLoop", () => {
  it("start で連続スキャンを開始し、検出文字列で onResult を呼ぶ", async () => {
    const video = makeVideo();
    const onResult = vi.fn();
    const loop = createQrScanLoop(video, onResult, { maxScansPerSecond: 10 });

    loop.start();
    await vi.advanceTimersByTimeAsync(100);

    expect(decodeQrMock).toHaveBeenCalledTimes(1);
    expect(decodeQrMock).toHaveBeenCalledWith(video);
    expect(onResult).toHaveBeenCalledWith("forward");
    loop.destroy();
  });

  it("QR 未検出(null)では onResult を呼ばない", async () => {
    decodeQrMock.mockResolvedValue(null);
    const onResult = vi.fn();
    const loop = createQrScanLoop(makeVideo(), onResult);

    loop.start();
    await vi.advanceTimersByTimeAsync(100);

    expect(decodeQrMock).toHaveBeenCalled();
    expect(onResult).not.toHaveBeenCalled();
    loop.destroy();
  });

  it("デコード失敗は onError に渡す", async () => {
    decodeQrMock.mockRejectedValue(new Error("boom"));
    const onError = vi.fn();
    const loop = createQrScanLoop(makeVideo(), vi.fn(), { onError });

    loop.start();
    await vi.advanceTimersByTimeAsync(100);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    loop.destroy();
  });

  it("stop 以降はスキャンしない", async () => {
    const loop = createQrScanLoop(makeVideo(), vi.fn(), { maxScansPerSecond: 10 });

    loop.start();
    await vi.advanceTimersByTimeAsync(100);
    const before = decodeQrMock.mock.calls.length;

    loop.stop();
    await vi.advanceTimersByTimeAsync(500);

    expect(decodeQrMock).toHaveBeenCalledTimes(before);
    loop.destroy();
  });

  it("maxScansPerSecond を超えて頻繁にスキャンしない", async () => {
    const loop = createQrScanLoop(makeVideo(), vi.fn(), { maxScansPerSecond: 5 });

    loop.start();
    await vi.advanceTimersByTimeAsync(1000);

    const calls = decodeQrMock.mock.calls.length;
    expect(calls).toBeGreaterThanOrEqual(4);
    expect(calls).toBeLessThanOrEqual(6);
    loop.destroy();
  });

  it("destroy 後はスキャンせず、start しても再開しない", async () => {
    const loop = createQrScanLoop(makeVideo(), vi.fn());

    loop.start();
    await vi.advanceTimersByTimeAsync(100);
    const before = decodeQrMock.mock.calls.length;

    loop.destroy();
    loop.start(); // 無視される
    await vi.advanceTimersByTimeAsync(500);

    expect(decodeQrMock).toHaveBeenCalledTimes(before);
  });

  it("映像未準備(readyState<HAVE_CURRENT_DATA)ではスキャンしない", async () => {
    const loop = createQrScanLoop(makeVideo(0), vi.fn());

    loop.start();
    await vi.advanceTimersByTimeAsync(300);

    expect(decodeQrMock).not.toHaveBeenCalled();
    loop.destroy();
  });

  it("maxScansPerSecond が正の有限数でなければ RangeError", () => {
    for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => createQrScanLoop(makeVideo(), vi.fn(), { maxScansPerSecond: bad })).toThrow(
        RangeError,
      );
    }
  });

  it("maxScansPerSecond=0.5 は許容（約2秒に1回）", async () => {
    const loop = createQrScanLoop(makeVideo(), vi.fn(), { maxScansPerSecond: 0.5 });

    loop.start();
    await vi.advanceTimersByTimeAsync(2000);

    const calls = decodeQrMock.mock.calls.length;
    expect(calls).toBeGreaterThanOrEqual(1);
    expect(calls).toBeLessThanOrEqual(2);
    loop.destroy();
  });
});

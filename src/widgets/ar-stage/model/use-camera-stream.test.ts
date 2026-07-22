// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";

import { CAMERA_ERROR_CODE, CameraAccessError } from "@/shared/camera";
import type { CameraSession, OpenCameraOptions } from "@/shared/camera";

import { useCameraStream } from "./use-camera-stream";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

/** jsdom に MediaStream が無いため、識別可能なフェイクを作る。 */
const createFakeStream = (id: string): MediaStream => ({ id }) as unknown as MediaStream;

const createFakeSession = (id = "fake-stream"): { session: CameraSession; stop: () => void } => {
  const stop = vi.fn();
  return { session: { stream: createFakeStream(id), stop }, stop };
};

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

const createDeferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

/** microtask を flush する（deferred の解決を React へ反映）。 */
const flush = async (): Promise<void> => {
  await act(async () => {});
};

describe("useCameraStream", () => {
  it("取得成功で loading → ready になり、stream を公開する", async () => {
    const { session } = createFakeSession();
    const openCamera = vi.fn().mockResolvedValue(session);

    const { result } = renderHook(() => useCameraStream({ openCamera }));
    expect(result.current.status).toBe("loading");
    expect(result.current.stream).toBeNull();

    await flush();
    expect(result.current.status).toBe("ready");
    expect(result.current.stream).toBe(session.stream);
    expect(result.current.errorCode).toBeNull();
    expect(openCamera).toHaveBeenCalledTimes(1);
  });

  it("CameraAccessError は理由コード付きの error になる", async () => {
    const openCamera = vi
      .fn()
      .mockRejectedValue(new CameraAccessError(CAMERA_ERROR_CODE.PERMISSION_DENIED));

    const { result } = renderHook(() => useCameraStream({ openCamera }));
    await flush();

    expect(result.current.status).toBe("error");
    expect(result.current.stream).toBeNull();
    expect(result.current.errorCode).toBe(CAMERA_ERROR_CODE.PERMISSION_DENIED);
  });

  it("CameraAccessError 以外の例外は unknown に正規化する", async () => {
    const openCamera = vi.fn().mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useCameraStream({ openCamera }));
    await flush();

    expect(result.current.status).toBe("error");
    expect(result.current.errorCode).toBe(CAMERA_ERROR_CODE.UNKNOWN);
  });

  it("unmount でセッションを停止し、待機中の signal を abort する", async () => {
    const { session, stop } = createFakeSession();
    let receivedSignal: AbortSignal | undefined;
    const openCamera = vi.fn(async (options?: OpenCameraOptions): Promise<CameraSession> => {
      receivedSignal = options?.signal;
      return session;
    });

    const { unmount } = renderHook(() => useCameraStream({ openCamera }));
    await flush();

    expect(receivedSignal?.aborted).toBe(false);
    unmount();
    expect(stop).toHaveBeenCalledTimes(1);
    expect(receivedSignal?.aborted).toBe(true);
  });

  it("unmount 後に遅延解決した stream は即時停止する", async () => {
    const { session, stop } = createFakeSession();
    const deferred = createDeferred<CameraSession>();
    const openCamera = vi.fn().mockReturnValue(deferred.promise);

    const { result, unmount } = renderHook(() => useCameraStream({ openCamera }));
    expect(result.current.status).toBe("loading");

    unmount();
    deferred.resolve(session);
    await deferred.promise;

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it("retry で取得をやり直し、error → ready へ回復できる", async () => {
    const { session } = createFakeSession("second-stream");
    const openCamera = vi
      .fn()
      .mockRejectedValueOnce(new CameraAccessError(CAMERA_ERROR_CODE.DEVICE_UNAVAILABLE))
      .mockResolvedValueOnce(session);

    const { result } = renderHook(() => useCameraStream({ openCamera }));
    await flush();
    expect(result.current.status).toBe("error");
    expect(result.current.errorCode).toBe(CAMERA_ERROR_CODE.DEVICE_UNAVAILABLE);

    act(() => {
      result.current.retry();
    });
    expect(result.current.status).toBe("loading");

    await flush();
    expect(result.current.status).toBe("ready");
    expect(result.current.stream).toBe(session.stream);
    expect(openCamera).toHaveBeenCalledTimes(2);
  });
});

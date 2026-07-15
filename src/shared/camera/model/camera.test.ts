import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CAMERA_ERROR_CODE, CameraAccessError, openCamera, type CameraErrorCode } from "./camera";

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

interface FakeTrack {
  stop: ReturnType<typeof vi.fn>;
}

const createDeferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

const createTrack = (): FakeTrack => ({ stop: vi.fn() });

const createStream = (tracks: FakeTrack[] = [createTrack()]): MediaStream =>
  ({ getTracks: () => tracks as unknown as MediaStreamTrack[] }) as unknown as MediaStream;

const createNamedError = (name: string): Error => {
  const error = new Error(name);
  error.name = name;
  return error;
};

const stubCameraEnvironment = (getUserMedia: ReturnType<typeof vi.fn>): void => {
  vi.stubGlobal("isSecureContext", true);
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
};

beforeEach(() => {
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("openCamera", () => {
  it("既定では映像のみを要求してセッションを返す", async () => {
    const stream = createStream();
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    stubCameraEnvironment(getUserMedia);

    const session = await openCamera();

    expect(getUserMedia).toHaveBeenCalledWith({ video: true, audio: false });
    expect(session.stream).toBe(stream);
  });

  it("任意の映像制約を透過し、音声は要求しない", async () => {
    const stream = createStream();
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    const video = { width: { ideal: 1280 }, facingMode: { ideal: "environment" } };
    stubCameraEnvironment(getUserMedia);

    await openCamera({ video });

    expect(getUserMedia).toHaveBeenCalledWith({ video, audio: false });
  });

  it("非 secure context は getUserMedia を呼ばず拒否する", async () => {
    const getUserMedia = vi.fn();
    stubCameraEnvironment(getUserMedia);
    vi.stubGlobal("isSecureContext", false);

    await expect(openCamera()).rejects.toMatchObject({
      code: CAMERA_ERROR_CODE.INSECURE_CONTEXT,
    });
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("MediaDevices API が無い環境は unsupported にする", async () => {
    vi.stubGlobal("isSecureContext", true);
    vi.stubGlobal("navigator", {});

    await expect(openCamera()).rejects.toMatchObject({ code: CAMERA_ERROR_CODE.UNSUPPORTED });
  });

  it.each<[string, CameraErrorCode]>([
    ["NotAllowedError", CAMERA_ERROR_CODE.PERMISSION_DENIED],
    ["SecurityError", CAMERA_ERROR_CODE.PERMISSION_DENIED],
    ["NotFoundError", CAMERA_ERROR_CODE.DEVICE_NOT_FOUND],
    ["NotReadableError", CAMERA_ERROR_CODE.DEVICE_UNAVAILABLE],
    ["OverconstrainedError", CAMERA_ERROR_CODE.CONSTRAINTS_UNSATISFIED],
    ["InvalidStateError", CAMERA_ERROR_CODE.INVALID_STATE],
    ["AbortError", CAMERA_ERROR_CODE.ABORTED],
  ])("%s を %s に正規化する", async (name, code) => {
    const source = createNamedError(name);
    const getUserMedia = vi.fn().mockRejectedValue(source);
    stubCameraEnvironment(getUserMedia);

    try {
      await openCamera();
      expect.fail("openCamera が成功してしまった");
    } catch (error) {
      expect(error).toBeInstanceOf(CameraAccessError);
      expect(error).toMatchObject({ code, cause: source });
    }
  });

  it("未知の失敗は cause を保持して unknown にする", async () => {
    const source = new Error("unexpected");
    const getUserMedia = vi.fn().mockRejectedValue(source);
    stubCameraEnvironment(getUserMedia);

    try {
      await openCamera();
      expect.fail("openCamera が成功してしまった");
    } catch (error) {
      expect(error).toMatchObject({ code: CAMERA_ERROR_CODE.UNKNOWN, cause: source });
    }
  });

  it("stop は全 track を一度だけ停止する", async () => {
    const tracks = [createTrack(), createTrack()];
    const getUserMedia = vi.fn().mockResolvedValue(createStream(tracks));
    stubCameraEnvironment(getUserMedia);
    const session = await openCamera();

    session.stop();
    session.stop();

    for (const track of tracks) {
      expect(track.stop).toHaveBeenCalledTimes(1);
    }
  });

  it("15 秒で timeout になり、遅れて取得した stream を停止する", async () => {
    vi.useFakeTimers();
    const deferred = createDeferred<MediaStream>();
    const track = createTrack();
    const getUserMedia = vi.fn().mockReturnValue(deferred.promise);
    stubCameraEnvironment(getUserMedia);

    const result = openCamera();
    const assertion = expect(result).rejects.toMatchObject({ code: CAMERA_ERROR_CODE.TIMEOUT });
    await vi.advanceTimersByTimeAsync(15_000);
    await assertion;

    deferred.resolve(createStream([track]));
    await deferred.promise;
    await Promise.resolve();
    expect(track.stop).toHaveBeenCalledTimes(1);
  });

  it("AbortSignal で中断し、遅れて取得した stream を停止する", async () => {
    const deferred = createDeferred<MediaStream>();
    const track = createTrack();
    const getUserMedia = vi.fn().mockReturnValue(deferred.promise);
    const controller = new AbortController();
    stubCameraEnvironment(getUserMedia);

    const result = openCamera({ signal: controller.signal });
    const assertion = expect(result).rejects.toMatchObject({ code: CAMERA_ERROR_CODE.ABORTED });
    controller.abort();
    await assertion;

    deferred.resolve(createStream([track]));
    await deferred.promise;
    await Promise.resolve();
    expect(track.stop).toHaveBeenCalledTimes(1);
  });

  it("開始前に abort 済みなら getUserMedia を呼ばない", async () => {
    const getUserMedia = vi.fn();
    const controller = new AbortController();
    controller.abort();
    stubCameraEnvironment(getUserMedia);

    await expect(openCamera({ signal: controller.signal })).rejects.toMatchObject({
      code: CAMERA_ERROR_CODE.ABORTED,
    });
    expect(getUserMedia).not.toHaveBeenCalled();
  });
});

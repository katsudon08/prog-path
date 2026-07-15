/**
 * カメラ取得抽象（FSD: shared/camera/model）
 *
 * Web / Tauri WebView が共通で提供する `getUserMedia` を単一の I/F に閉じ込め、
 * 上位レイヤーへは環境差を正規化したエラーと、明示的に解放できるセッションを返す。
 */

/** カメラ取得失敗の理由（上位 UI はこの値を案内・再試行導線へ変換する）。 */
export const CAMERA_ERROR_CODE = {
  INSECURE_CONTEXT: "insecure-context",
  UNSUPPORTED: "unsupported",
  PERMISSION_DENIED: "permission-denied",
  DEVICE_NOT_FOUND: "device-not-found",
  DEVICE_UNAVAILABLE: "device-unavailable",
  CONSTRAINTS_UNSATISFIED: "constraints-unsatisfied",
  INVALID_STATE: "invalid-state",
  TIMEOUT: "timeout",
  ABORTED: "aborted",
  UNKNOWN: "unknown",
} as const;

/** {@link CAMERA_ERROR_CODE} の値。 */
export type CameraErrorCode = (typeof CAMERA_ERROR_CODE)[keyof typeof CAMERA_ERROR_CODE];

/**
 * `getUserMedia` の環境依存エラーを、上位が安定して判別できる形へ正規化した例外。
 */
export class CameraAccessError extends Error {
  readonly code: CameraErrorCode;

  constructor(code: CameraErrorCode, options: ErrorOptions = {}) {
    super(`Camera access failed: ${code}`, options);
    this.name = "CameraAccessError";
    this.code = code;
  }
}

/** カメラ取得オプション。音声は常に無効で、映像制約だけを受け付ける。 */
export interface OpenCameraOptions {
  /** 映像制約。省略時は `true` とし、ブラウザ／WebView の既定選択に委ねる。 */
  video?: true | MediaTrackConstraints;
  /** 画面離脱等で待機を中断するための Signal。 */
  signal?: AbortSignal;
}

/** 取得済みカメラと、その所有者が呼ぶ解放処理。 */
export interface CameraSession {
  readonly stream: MediaStream;
  /** 全 track を停止する。複数回呼んでも最初の 1 回だけ処理する。 */
  stop: () => void;
}

/** 許可操作が放置された場合に無期限待機しないための上限。 */
const CAMERA_OPEN_TIMEOUT_MS = 15_000;

/** MediaStream の全 track を停止する。 */
const stopMediaStream = (stream: MediaStream): void => {
  for (const track of stream.getTracks()) {
    track.stop();
  }
};

/** MediaStream の所有権と冪等な停止処理をまとめたセッションを作る。 */
const createCameraSession = (stream: MediaStream): CameraSession => {
  let stopped = false;

  return {
    stream,
    stop: (): void => {
      if (stopped) return;
      stopped = true;
      stopMediaStream(stream);
    },
  };
};

/** unknown から例外名を安全に取り出す。別 realm の DOMException も扱えるよう形で判定する。 */
const getErrorName = (error: unknown): string | null => {
  if (typeof error !== "object" || error === null || !("name" in error)) return null;
  return typeof error.name === "string" ? error.name : null;
};

/** Web API の例外名をカメラ取得エラーへ正規化する。 */
const normalizeCameraError = (error: unknown): CameraAccessError => {
  if (error instanceof CameraAccessError) return error;

  const name = getErrorName(error);
  const code: CameraErrorCode = (() => {
    switch (name) {
      case "NotAllowedError":
      case "SecurityError":
        return CAMERA_ERROR_CODE.PERMISSION_DENIED;
      case "NotFoundError":
        return CAMERA_ERROR_CODE.DEVICE_NOT_FOUND;
      case "NotReadableError":
        return CAMERA_ERROR_CODE.DEVICE_UNAVAILABLE;
      case "OverconstrainedError":
        return CAMERA_ERROR_CODE.CONSTRAINTS_UNSATISFIED;
      case "InvalidStateError":
        return CAMERA_ERROR_CODE.INVALID_STATE;
      case "AbortError":
        return CAMERA_ERROR_CODE.ABORTED;
      default:
        return CAMERA_ERROR_CODE.UNKNOWN;
    }
  })();

  return new CameraAccessError(code, { cause: error });
};

/**
 * getUserMedia の完了を待ち、タイムアウト／中断と遅延解決時の track 解放を一元管理する。
 *
 * getUserMedia 自体には AbortSignal が無いため、待機終了後に Promise が成功した場合は
 * その場で stream を停止し、カメラが点灯し続けることを防ぐ。
 */
const waitForCameraStream = (
  request: Promise<MediaStream>,
  signal: AbortSignal | undefined,
): Promise<MediaStream> =>
  new Promise<MediaStream>((resolve, reject) => {
    let finished = false;

    const cleanup = (): void => {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", handleAbort);
    };

    const rejectOnce = (error: CameraAccessError): void => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(error);
    };

    const handleAbort = (): void => {
      rejectOnce(new CameraAccessError(CAMERA_ERROR_CODE.ABORTED));
    };

    const timeoutId = setTimeout(() => {
      rejectOnce(new CameraAccessError(CAMERA_ERROR_CODE.TIMEOUT));
    }, CAMERA_OPEN_TIMEOUT_MS);

    signal?.addEventListener("abort", handleAbort, { once: true });

    void request.then(
      (stream) => {
        if (finished) {
          stopMediaStream(stream);
          return;
        }
        finished = true;
        cleanup();
        resolve(stream);
      },
      (error: unknown) => {
        if (finished) return;
        finished = true;
        cleanup();
        reject(error);
      },
    );
  });

/**
 * Web / Tauri WebView 共通のカメラ映像を取得する。
 *
 * 音声は要求せず、映像だけを取得する。呼び出し側は返されたセッションを所有し、画面離脱時に
 * 必ず `stop()` する。取得失敗は {@link CameraAccessError} に正規化される。
 *
 * @param options 映像制約と待機中断 Signal
 * @returns 取得済み MediaStream と冪等な停止処理を持つセッション
 * @throws {@link CameraAccessError} カメラ非対応、権限拒否、端末なし、タイムアウト等
 */
export const openCamera = async (options: OpenCameraOptions = {}): Promise<CameraSession> => {
  const { video = true, signal } = options;

  if (signal?.aborted) {
    throw new CameraAccessError(CAMERA_ERROR_CODE.ABORTED);
  }
  if (globalThis.isSecureContext === false) {
    throw new CameraAccessError(CAMERA_ERROR_CODE.INSECURE_CONTEXT);
  }
  if (
    typeof navigator === "undefined" ||
    navigator.mediaDevices === undefined ||
    typeof navigator.mediaDevices.getUserMedia !== "function"
  ) {
    throw new CameraAccessError(CAMERA_ERROR_CODE.UNSUPPORTED);
  }

  try {
    const request = navigator.mediaDevices.getUserMedia({ video, audio: false });
    const stream = await waitForCameraStream(request, signal);
    return createCameraSession(stream);
  } catch (error) {
    throw normalizeCameraError(error);
  }
};

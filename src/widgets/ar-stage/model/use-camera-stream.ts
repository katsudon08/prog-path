/**
 * カメラストリーム取得フック（FSD: widgets/ar-stage/model）
 *
 * shared/camera の `openCamera` を React のライフサイクルへ束ねる。mount で取得を開始し、
 * unmount で待機を中断（abort）してセッションを解放する。AR 背景（カメラ映像）を描く
 * ArStage UI が内部で使う想定で、`useArStage`（controller）には含めない分担。
 */
import { useCallback, useEffect, useRef, useState } from "react";

import { CAMERA_ERROR_CODE, CameraAccessError, openCamera } from "@/shared/camera";
import type { CameraErrorCode, CameraSession, OpenCameraOptions } from "@/shared/camera";

/** カメラ取得の進行状態。 */
export type CameraStreamStatus = "loading" | "ready" | "error";

/** `openCamera` と同形の取得関数。テスト・環境差し替え用の注入シーム。 */
export type OpenCameraFn = (options?: OpenCameraOptions) => Promise<CameraSession>;

/** {@link useCameraStream} のオプション。 */
export interface UseCameraStreamOptions {
  /** カメラ取得関数の注入シーム。省略時は shared/camera の `openCamera`。 */
  openCamera?: OpenCameraFn;
}

/** {@link useCameraStream} が返すカメラ状態。 */
export interface UseCameraStreamResult {
  /** 取得の進行状態。 */
  readonly status: CameraStreamStatus;
  /** 取得済みの映像ストリーム。ready 以外は null。 */
  readonly stream: MediaStream | null;
  /** 失敗理由（error 時のみ）。UI は権限案内・再試行導線へ変換する。 */
  readonly errorCode: CameraErrorCode | null;
  /** 取得をやり直す（権限を許可し直した後などに UI から呼ぶ）。 */
  retry: () => void;
}

/** 内部状態。status / stream / errorCode を常にアトミックに更新する。 */
interface CameraStreamState {
  readonly status: CameraStreamStatus;
  readonly stream: MediaStream | null;
  readonly errorCode: CameraErrorCode | null;
}

const LOADING_STATE: CameraStreamState = { status: "loading", stream: null, errorCode: null };

/**
 * カメラ映像のライフサイクルを管理するフック。
 *
 * mount で `AbortController` を作って取得を開始し、unmount（および retry での再取得）時に
 * 待機を中断してセッションを停止する。`CameraAccessError` 以外の想定外例外は
 * `"unknown"` に正規化して UI が常にコードで分岐できるようにする。
 *
 * @param options 取得関数の注入シーム（省略時は shared/camera の実体）
 * @returns カメラ取得状態と再試行操作（{@link UseCameraStreamResult}）
 */
export const useCameraStream = (options: UseCameraStreamOptions = {}): UseCameraStreamResult => {
  const { openCamera: openCameraFn = openCamera } = options;

  // 取得関数の identity 変化で再取得が走らないよう ref 越しに参照する（毎レンダ最新化）。
  const openCameraRef = useRef<OpenCameraFn>(openCameraFn);
  openCameraRef.current = openCameraFn;

  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<CameraStreamState>(LOADING_STATE);

  useEffect(() => {
    const controller = new AbortController();
    let session: CameraSession | null = null;
    let active = true;

    setState(LOADING_STATE);

    const acquire = async (): Promise<void> => {
      try {
        const acquired = await openCameraRef.current({ signal: controller.signal });
        if (!active) {
          // cleanup 後に遅延解決した場合はカメラが点灯し続けないよう即時停止する。
          acquired.stop();
          return;
        }
        session = acquired;
        setState({ status: "ready", stream: acquired.stream, errorCode: null });
      } catch (error) {
        if (!active) {
          // cleanup 起因の中断（aborted 等）は表示すべきエラーではないため無視する。
          return;
        }
        const code = error instanceof CameraAccessError ? error.code : CAMERA_ERROR_CODE.UNKNOWN;
        setState({ status: "error", stream: null, errorCode: code });
      }
    };

    void acquire();

    return () => {
      active = false;
      controller.abort();
      session?.stop();
    };
  }, [attempt]);

  const retry = useCallback((): void => {
    setAttempt((prev) => prev + 1);
  }, []);

  return { status: state.status, stream: state.stream, errorCode: state.errorCode, retry };
};

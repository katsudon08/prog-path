/**
 * QR 連続スキャンループ（FSD: shared/qr/model）
 *
 * 呼び出し側が用意した `HTMLVideoElement`（ストリームは #180 `shared/camera` や widget が供給）を
 * 入力に、`decodeQr` で QR を連続デコードし、成功時に生の文字列をコールバック通知する。
 * デコード本体とエンジン（Worker/BarcodeDetector）は `decode-qr.ts` に集約し、ここはスキャンの
 * 間引き・ライフサイクル制御に専念する（DRY）。**getUserMedia は呼ばない**（カメラ所有は #180）。
 *
 * スキャンは `requestVideoFrameCallback`（対応時）または `setTimeout` で回し、`maxScansPerSecond`
 * で間引く。返す文字列は透過（意味解釈・重複除去・ループ構築中の読取停止は上位 #186 の責務）。
 */
import { decodeQr } from "./decode-qr";

/** デコード成功時に生の QR 文字列を受け取るハンドラ。 */
export type QrResultHandler = (data: string) => void;

/** 連続スキャンの設定。 */
export interface QrScanLoopOptions {
  /** 1 秒あたりの最大スキャン回数（既定 10）。正の有限数のみ。低スペック端末の負荷を抑える間引き。 */
  maxScansPerSecond?: number;
  /** QR 未検出以外のデコード失敗を受け取る任意ハンドラ。 */
  onError?: (error: unknown) => void;
}

/** 連続スキャンの制御ハンドル。 */
export interface QrScanLoop {
  /** スキャンを開始する（`destroy` 済み・実行中は無視）。 */
  start: () => void;
  /** スキャンを停止する（`start` で再開できる）。 */
  stop: () => void;
  /** 停止する。以降 `start` しても再開しない。 */
  destroy: () => void;
}

/** 既定の 1 秒あたり最大スキャン回数。 */
const DEFAULT_MAX_SCANS_PER_SECOND = 10;

/**
 * `requestVideoFrameCallback` に対応する video かを判定する型ガード。
 * この API は TS lib への収録状況が環境により異なるため、lib 依存を避けて自前で検出する。
 */
interface VideoFrameCallbackCapable {
  requestVideoFrameCallback: (callback: (now: number) => void) => number;
  cancelVideoFrameCallback: (handle: number) => void;
}

const supportsVideoFrameCallback = (
  video: HTMLVideoElement,
): video is HTMLVideoElement & VideoFrameCallbackCapable =>
  typeof (video as Partial<VideoFrameCallbackCapable>).requestVideoFrameCallback === "function";

/**
 * video 要素を連続スキャンして QR 文字列をコールバック通知するループを生成する。
 *
 * @param video スキャン対象。`srcObject` へのストリーム供給・再生は呼び出し側の責務
 * @param onResult QR デコード成功ごとに生の文字列で呼ばれる
 * @param options 間引き回数・エラーハンドラ
 * @returns start / stop / destroy を持つ制御ハンドル
 * @throws maxScansPerSecond が正の有限数でない場合（呼び出し側のバグを早期に検出する）
 */
export const createQrScanLoop = (
  video: HTMLVideoElement,
  onResult: QrResultHandler,
  options: QrScanLoopOptions = {},
): QrScanLoop => {
  const { maxScansPerSecond = DEFAULT_MAX_SCANS_PER_SECOND, onError } = options;
  if (!Number.isFinite(maxScansPerSecond) || maxScansPerSecond <= 0) {
    throw new RangeError(
      `createQrScanLoop: maxScansPerSecond は正の有限数である必要があります (received: ${maxScansPerSecond})`,
    );
  }
  const minIntervalMs = 1000 / maxScansPerSecond;

  let running = false;
  let destroyed = false;
  // 1 フレームのデコードが進行中かどうか（重複起動を防ぐ）。
  let scanning = false;
  // 直近スキャン時刻。初回は必ず走るよう -∞ で初期化する。
  let lastScanAt = Number.NEGATIVE_INFINITY;
  let rvfcHandle: number | null = null;
  let timerHandle: ReturnType<typeof setTimeout> | null = null;

  const scanOnce = async (): Promise<void> => {
    if (!running || scanning) return;
    // 映像がまだ 1 フレームも来ていないときはスキップ（未準備時のデコード失敗・空フレームを避ける）。
    if (video.readyState < video.HAVE_CURRENT_DATA) return;
    const now = Date.now();
    if (now - lastScanAt < minIntervalMs) return;
    lastScanAt = now;
    scanning = true;
    try {
      const data = await decodeQr(video);
      if (data !== null && running) onResult(data);
    } catch (error) {
      onError?.(error);
    } finally {
      scanning = false;
    }
  };

  const scheduleNext = (): void => {
    if (!running) return;
    if (supportsVideoFrameCallback(video)) {
      rvfcHandle = video.requestVideoFrameCallback(() => tick());
    } else {
      timerHandle = setTimeout(() => tick(), minIntervalMs);
    }
  };

  const tick = (): void => {
    if (!running) return;
    void scanOnce();
    scheduleNext();
  };

  const clearScheduled = (): void => {
    if (rvfcHandle !== null && supportsVideoFrameCallback(video)) {
      video.cancelVideoFrameCallback(rvfcHandle);
    }
    rvfcHandle = null;
    if (timerHandle !== null) {
      clearTimeout(timerHandle);
      timerHandle = null;
    }
  };

  const start = (): void => {
    if (destroyed || running) return;
    running = true;
    scheduleNext();
  };

  const stop = (): void => {
    running = false;
    clearScheduled();
  };

  const destroy = (): void => {
    destroyed = true;
    stop();
  };

  return { start, stop, destroy };
};

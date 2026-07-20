/**
 * QR 連続スキャン配線フック（FSD: widgets/ar-stage/model）
 *
 * shared/qr の `createQrScanLoop` を React のライフサイクルへ束ねる。カメラ背景の
 * `<video>` 要素（ref）を入力に、`enabled` の間だけスキャンループを回し、デコード結果を
 * `onPayload` へ透過的に渡す。実行中（`controller.readOnly`）はスキャンを止め、
 * unmount・無効化でループを破棄する。ArStage UI が内部で使う想定。
 */
import { useEffect, useRef } from "react";

import { createQrScanLoop } from "@/shared/qr";

/** `createQrScanLoop` と同形の生成関数。テスト・環境差し替え用の注入シーム。 */
export type CreateQrScanLoopFn = typeof createQrScanLoop;

/** {@link useQrScan} のオプション。 */
export interface UseQrScanOptions {
  /** スキャン対象の video 要素（カメラ背景）。null の間はスキャンしない。 */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** スキャンを回すか。カメラ ready かつ編集可能なときのみ true にする。 */
  enabled: boolean;
  /** QR デコード成功時に生ペイロード文字列で呼ばれる（意味解釈は controller 側）。 */
  onPayload: (payload: string) => void;
  /** スキャンループ生成関数の注入シーム。省略時は shared/qr の実体。 */
  createLoop?: CreateQrScanLoopFn;
}

/**
 * video 要素の QR 連続スキャンを `enabled` に同期させるフック。
 *
 * `enabled` が true になった時点の video 要素へループを張り、false・unmount で破棄する。
 * `onPayload` / `createLoop` は ref 越しに参照し、コールバックの identity 変化で
 * ループが張り直されないようにする（スキャンの取りこぼし・Worker 再生成を防ぐ）。
 *
 * @param options video ref・有効フラグ・結果ハンドラ（{@link UseQrScanOptions}）
 */
export const useQrScan = ({
  videoRef,
  enabled,
  onPayload,
  createLoop = createQrScanLoop,
}: UseQrScanOptions): void => {
  const onPayloadRef = useRef(onPayload);
  onPayloadRef.current = onPayload;
  const createLoopRef = useRef(createLoop);
  createLoopRef.current = createLoop;

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const video = videoRef.current;
    if (!video) {
      return undefined;
    }
    const loop = createLoopRef.current(video, (data) => {
      onPayloadRef.current(data);
    });
    loop.start();
    return () => {
      loop.destroy();
    };
  }, [enabled, videoRef]);
};

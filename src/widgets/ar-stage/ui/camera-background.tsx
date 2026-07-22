/**
 * CameraBackground（FSD: widgets/ar-stage/ui）
 *
 * AR ステージ最背面のカメラ映像。取得済み `MediaStream` を `<video>` へ流し、
 * コンテナ全面を `object-cover` で覆う。ストリームの取得・解放は上位
 * （useCameraStream）の責務で、本コンポーネントは表示と `srcObject` の付け外しのみを担う。
 *
 * `videoRef` で video 要素を上位へ公開する — QR スキャンループ（use-qr-scan）が
 * この要素を連続デコードの入力に使うため。
 */
import { useEffect, useRef } from "react";

import { cn } from "@/shared/lib";

interface CameraBackgroundProps {
  /** 表示するカメラ映像（useCameraStream の ready ストリーム）。 */
  stream: MediaStream;
  /** video 要素を上位へ公開する ref（QR スキャンの入力用・任意）。 */
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  /** 既定クラスへの上書き・拡張（cn 経由）。 */
  className?: string;
}

/** カメラ映像を全面に敷く背景 video。 */
export const CameraBackground = ({
  stream,
  videoRef,
  className,
}: CameraBackgroundProps): React.JSX.Element => {
  const innerRef = useRef<HTMLVideoElement | null>(null);

  // 内部 ref と上位公開 ref の両方へ同じ要素を渡す（callback ref で合流させる）。
  const setRef = (element: HTMLVideoElement | null): void => {
    innerRef.current = element;
    if (videoRef) {
      videoRef.current = element;
    }
  };

  // srcObject は属性でなくプロパティのため effect で設定する。stream 差し替えにも追従。
  useEffect(() => {
    const video = innerRef.current;
    if (!video) {
      return undefined;
    }
    video.srcObject = stream;
    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  return (
    <video
      ref={setRef}
      autoPlay
      muted
      playsInline
      aria-hidden="true"
      className={cn("absolute inset-0 size-full object-cover", className)}
    />
  );
};

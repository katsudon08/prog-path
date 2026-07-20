/**
 * CameraError（FSD: widgets/ar-stage/ui）
 *
 * カメラ取得失敗の全面表示。エラーコード別の児童向け文言＋対処案内
 * （lib/camera-error-message）を表示し、再試行できるコードのときだけ
 * 「もういちど ためす」ボタンを出す（insecure-context / unsupported は案内のみ）。
 * 色だけに依存させず、必ずアイコンと文言を対にする（色覚配慮）。
 */
import { CameraOff, RotateCcw } from "lucide-react";

import type { CameraErrorCode } from "@/shared/camera";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui";

import { getCameraErrorMessage } from "../lib/camera-error-message";

interface CameraErrorProps {
  /** useCameraStream が返した失敗理由コード。 */
  errorCode: CameraErrorCode;
  /** 再試行ハンドラ（useCameraStream の retry）。 */
  onRetry: () => void;
  /** 既定クラスへの上書き・拡張（cn 経由）。 */
  className?: string;
}

/** カメラ取得エラーの案内と再試行導線。 */
export const CameraError = ({
  errorCode,
  onRetry,
  className,
}: CameraErrorProps): React.JSX.Element => {
  const { title, description, retryable } = getCameraErrorMessage(errorCode);

  return (
    <div
      role="alert"
      className={cn(
        "flex size-full flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-16 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
      >
        <CameraOff className="size-8" />
      </span>
      <p className="text-xl font-bold">{title}</p>
      <p className="max-w-md text-base leading-relaxed text-muted-foreground">{description}</p>
      {retryable && (
        <Button size="lg" onClick={onRetry}>
          <RotateCcw aria-hidden="true" />
          もういちど ためす
        </Button>
      )}
    </div>
  );
};

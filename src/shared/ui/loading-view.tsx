import { LoaderCircle } from "lucide-react";

import { cn } from "@/shared/lib";

/** 大きさ。全画面ゲート=lg / セクション=md / インライン=sm を想定。 */
export type LoadingViewSize = "sm" | "md" | "lg";

const SPINNER_SIZE: Record<LoadingViewSize, string> = {
  sm: "size-5",
  md: "size-8",
  lg: "size-12",
};

export interface LoadingViewProps {
  /** 補足ラベル（既定「よみこみ中…」）。`role="status"` 内でスクリーンリーダーにも読まれる。 */
  label?: React.ReactNode;
  /** 大きさ。既定 "md"。 */
  size?: LoadingViewSize;
  /** コンテナへの追加クラス（全画面化する場合は `min-h-dvh` 等を呼び出し側で付与）。 */
  className?: string;
}

/**
 * 読み込み中の共通表示（スピナー＋ラベル）。
 *
 * 非同期処理の待機表示を統一するためのプレゼンテーショナル部品。`AsyncBoundary` の
 * pending fallback 既定値としても使う。`role="status"` / `aria-live="polite"` で
 * 状態変化を支援技術へ通知する。配色はデザイントークン準拠でライト/ダークに追従する。
 */
export const LoadingView = ({
  label = "よみこみ中…",
  size = "md",
  className,
}: LoadingViewProps): React.JSX.Element => {
  return (
    <output
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-muted-foreground",
        className,
      )}
    >
      <LoaderCircle aria-hidden="true" className={cn("animate-spin", SPINNER_SIZE[size])} />
      {label != null && <p className="text-base">{label}</p>}
    </output>
  );
};

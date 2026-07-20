/**
 * CameraLoading（FSD: widgets/ar-stage/ui）
 *
 * カメラ取得待ちの全面表示。児童向けのやさしい文言とスピナーで「じゅんび中」を伝える。
 * 配色はデザイントークンのみ（ライト/ダーク追従）。
 */
import { LoaderCircle } from "lucide-react";

import { cn } from "@/shared/lib";

interface CameraLoadingProps {
  /** 既定クラスへの上書き・拡張（cn 経由）。 */
  className?: string;
}

/** カメラ取得待ちのプレースホルダ。 */
export const CameraLoading = ({ className }: CameraLoadingProps): React.JSX.Element => {
  return (
    <output
      className={cn(
        "flex size-full flex-col items-center justify-center gap-4 bg-background text-foreground",
        className,
      )}
    >
      <LoaderCircle aria-hidden="true" className="size-12 animate-spin text-primary" />
      <p className="text-lg font-bold">カメラを じゅんびしているよ…</p>
      <p className="text-base text-muted-foreground">
        「カメラを つかっていいですか？」と きかれたら「きょか」を おしてね
      </p>
    </output>
  );
};

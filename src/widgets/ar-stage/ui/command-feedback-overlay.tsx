/**
 * CommandFeedbackOverlay（FSD: widgets/ar-stage/ui）
 *
 * QR 読み取り（コマンド構築 outcome）の一度きりフィードバックトースト。表示状態・タイマーは
 * model/use-toast、文言化は lib/outcome-message が担い、本コンポーネントは描画のみ。
 * 非モーダル・`pointer-events-none`（操作を妨げない）・`aria-live="polite"`（読み上げ通知）。
 * フェードアウトは opacity トランジションで表現する（文言は use-toast が保持し続ける）。
 *
 * 位置は AR ステージの**中央**（features.md 5.3「読み取り時、画面中央に…オーバーレイで数秒表示」）。
 * 児童はカードとカメラ映像を見ているため、上端では見落とす。とくに loopEnd は成否が
 * コマンドスタックの見た目に現れず、この通知が唯一の手がかりになる。
 */
import { ScanLine } from "lucide-react";

import { cn } from "@/shared/lib";

import { useToast } from "../model/use-toast";
import type { CommandStackOutcome } from "../model/types";

interface CommandFeedbackOverlayProps {
  /** controller の直近 outcome（連番付き）。未操作時は null。 */
  lastOutcome: CommandStackOutcome | null;
  /** 既定クラスへの上書き・拡張（cn 経由）。 */
  className?: string;
}

/** QR 読み取り結果のトーストオーバーレイ。 */
export const CommandFeedbackOverlay = ({
  lastOutcome,
  className,
}: CommandFeedbackOverlayProps): React.JSX.Element => {
  const { message, visible } = useToast(lastOutcome);

  return (
    <div
      aria-live="polite"
      className={cn(
        "pointer-events-none absolute inset-0 flex items-center justify-center p-4",
        className,
      )}
    >
      <div
        className={cn(
          "inline-flex max-w-full items-center gap-3 rounded-card border border-border bg-background/90 px-6 py-4 text-xl font-bold text-foreground shadow-lg transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0",
        )}
      >
        {message !== null && (
          <>
            <ScanLine aria-hidden="true" className="size-7 shrink-0 text-primary" />
            {/* フェードアウト中も文言を残す（aria-live はテキスト変化時のみ通知する）。 */}
            <span>{message}</span>
          </>
        )}
      </div>
    </div>
  );
};

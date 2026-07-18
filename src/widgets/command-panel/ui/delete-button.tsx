/**
 * DeleteButton（FSD: widgets/command-panel/ui・内部）
 *
 * 個別削除の操作部。削除ボタン 1 個だけを描き、押下で `onDelete()` を上位へ通知する。
 * 削除の確認（「本当に消す？」）はこの widget では扱わず、上位で行う
 * （共通の確認ダイアログ機構は後続 Issue で実装する。ここは通知に徹する）。
 */
import { Trash2 } from "lucide-react";

import { cn } from "@/shared/lib";

interface DeleteButtonProps {
  /** 削除ボタン押下時に上位へ通知。 */
  onDelete: () => void;
  /** 既定クラスの上書き・拡張（cn 経由・末尾）。 */
  className?: string;
}

/** 押下で削除を上位通知するだけの削除ボタン。 */
export const DeleteButton = ({ onDelete, className }: DeleteButtonProps): React.JSX.Element => {
  return (
    <button
      type="button"
      aria-label="けす"
      onClick={onDelete}
      className={cn(
        "text-muted-foreground hover:bg-muted hover:text-destructive focus-visible:ring-ring flex size-8 shrink-0 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2",
        className,
      )}
    >
      <Trash2 aria-hidden className="size-4" />
    </button>
  );
};

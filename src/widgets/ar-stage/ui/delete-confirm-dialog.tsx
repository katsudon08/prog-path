/**
 * DeleteConfirmDialog（FSD: widgets/ar-stage/ui）
 *
 * 命令削除の確認ダイアログ。「確認系（削除など）は画面中央のオーバーレイで明示確定」
 * （features.md）に対応し、shared/ui の ConfirmModal（AlertDialog）へ児童向け文言を与える
 * 薄いラッパ。削除対象の表示名（controller.deleteTargetLabel）から「『◯◯』を けす？」を組む。
 * 削除は destructive トーン＋ゴミ箱アイコン＋文言の対で伝える（色覚配慮）。
 */
import { Trash2 } from "lucide-react";

import { ConfirmModal } from "@/shared/ui";

interface DeleteConfirmDialogProps {
  /** 開閉状態（controller.deleteDialogOpen）。 */
  open: boolean;
  /** 削除対象の児童向け表示名（controller.deleteTargetLabel）。open のとき non-null が契約。 */
  targetLabel: string | null;
  /** 実削除の確定（controller.confirmDelete）。 */
  onConfirm: () => void;
  /** 削除の取りやめ（controller.cancelDelete）。 */
  onCancel: () => void;
}

/** 命令削除の確認ダイアログ。 */
export const DeleteConfirmDialog = ({
  open,
  targetLabel,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps): React.JSX.Element => {
  return (
    <ConfirmModal
      open={open}
      tone="destructive"
      icon={<Trash2 aria-hidden="true" />}
      title={`「${targetLabel ?? "このめいれい"}」を けす？`}
      description="けした めいれいは もとに もどせないよ"
      confirmLabel="けす"
      cancelLabel="やめる"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

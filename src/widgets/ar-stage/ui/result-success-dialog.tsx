/**
 * ResultSuccessDialog（FSD: widgets/ar-stage/ui）
 *
 * 実行成功（ゴール到達）の結果ダイアログ。移動回数を添えて称える。
 * 結果の確認は明示的に［とじる］で行わせるため `dismissible=false`
 * （誤タップで結果を見逃さない）。成功は色（success トーン）＋アイコンの対で伝える。
 */
import { Footprints, PartyPopper } from "lucide-react";

import { Button, Modal } from "@/shared/ui";

interface ResultSuccessDialogProps {
  /** 開閉状態（controller.successOpen）。 */
  open: boolean;
  /** ゴールまでの移動回数（controller.moveCount）。 */
  moveCount: number;
  /** 結果を閉じて編集へ戻る（controller.closeResult）。 */
  onClose: () => void;
}

/** 実行成功ダイアログ。 */
export const ResultSuccessDialog = ({
  open,
  moveCount,
  onClose,
}: ResultSuccessDialogProps): React.JSX.Element => {
  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
      dismissible={false}
      tone="success"
      icon={<PartyPopper aria-hidden="true" />}
      title="ゴールできた！"
      description="おめでとう！ロボットが ゴールに とうちゃくしたよ"
      footer={
        <Button size="lg" onClick={onClose}>
          とじる
        </Button>
      }
    >
      <div className="flex items-center justify-center gap-3 py-4">
        <Footprints aria-hidden="true" className="size-8 text-success" />
        <span className="text-lg">うごいた かず</span>
        <span className="text-5xl font-bold tabular-nums">{moveCount}</span>
        <span className="text-lg">かい</span>
      </div>
    </Modal>
  );
};

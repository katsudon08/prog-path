/**
 * ResultFailureDialog（FSD: widgets/ar-stage/ui）
 *
 * 実行失敗の結果ダイアログ。失敗理由の児童向け文言（lib/failure-message）と
 * 再挑戦への励ましを表示する。結果の確認は明示的に［もういちど］で行わせるため
 * `dismissible=false`。失敗は色（destructive トーン）＋アイコンの対で伝える。
 */
import { HeartCrack } from "lucide-react";

import type { FailureReason } from "@/features/maze-simulation";
import { Button, Modal } from "@/shared/ui";

import { getFailureMessage } from "../lib/failure-message";

interface ResultFailureDialogProps {
  /** 開閉状態（controller.failureOpen）。 */
  open: boolean;
  /** 失敗理由（controller.failureReason）。open のとき non-null が契約。 */
  failureReason: FailureReason | null;
  /** 結果を閉じて編集へ戻る（controller.closeResult）。 */
  onClose: () => void;
}

/** 実行失敗ダイアログ。 */
export const ResultFailureDialog = ({
  open,
  failureReason,
  onClose,
}: ResultFailureDialogProps): React.JSX.Element => {
  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
      dismissible={false}
      tone="destructive"
      icon={<HeartCrack aria-hidden="true" />}
      title="ざんねん…"
      description={failureReason === null ? undefined : getFailureMessage(failureReason)}
      footer={
        <Button size="lg" onClick={onClose}>
          もういちど
        </Button>
      }
    >
      <p className="py-2 text-center text-lg">めいれいを なおして、もういちど ちょうせんしよう！</p>
    </Modal>
  );
};

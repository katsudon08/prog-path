/**
 * UnclosedLoopDialog（FSD: widgets/ar-stage/ui）
 *
 * 未完了ループがある状態で［じっこう］が押されたときの警告ダイアログ（features.md 5.3
 * 「実行操作時に未完了ループがあれば警告し、実行を抑止する」）。
 *
 * ［じっこう］を disabled にせず押させてから警告するのは、押せないボタンだけでは
 * 「くりかえし おわり の カードを よませればよい」と児童が気付けないため。次にとる行動を
 * 文言で示すのがこのダイアログの役目。注意は warning トーン＋警告アイコン＋文言の対で伝える。
 */
import { TriangleAlert } from "lucide-react";

import { Button, Modal } from "@/shared/ui";

interface UnclosedLoopDialogProps {
  /** 開閉状態（controller.unclosedLoopDialogOpen）。 */
  open: boolean;
  /** まだ閉じていないループの数（controller.openLoopPaths.length）。 */
  openLoopCount: number;
  /** 警告を閉じる（controller.dismissUnclosedLoop）。 */
  onClose: () => void;
}

/** 未完了ループによる実行抑止の警告ダイアログ。 */
export const UnclosedLoopDialog = ({
  open,
  openLoopCount,
  onClose,
}: UnclosedLoopDialogProps): React.JSX.Element => {
  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
      dismissible={false}
      size="sm"
      tone="warning"
      icon={<TriangleAlert aria-hidden="true" />}
      title="まだ とじてない くりかえしが あるよ"
      description={`とじていない「くりかえし」が ${openLoopCount}こ のこっているよ。`}
      footer={
        <Button size="lg" onClick={onClose}>
          わかった
        </Button>
      }
    >
      <p className="py-2 text-center text-lg">
        「くりかえし おわり」の カードを よみとってから、もういちど ［じっこう］を おしてね。
      </p>
    </Modal>
  );
};

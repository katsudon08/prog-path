import { AlertDialog } from "radix-ui";

import { cn } from "@/shared/lib";

import { Button } from "./button";
import type { ButtonTone } from "./button";
import {
  ModalShell,
  modalContentClassName,
  modalDescriptionClassName,
  modalOverlayClassName,
  modalTitleClassName,
} from "./modal";
import type { ModalSize, ModalTone } from "./modal";

/**
 * tone → 確定ボタンの調子。Button の tone は 3 種のため意味の近い色へ写像する
 * （success は前向きな確定 = primary、warning は取り返しに注意が要る確定 = destructive）。
 */
const CONFIRM_BUTTON_TONE: Record<ModalTone, ButtonTone> = {
  neutral: "neutral",
  primary: "primary",
  success: "primary",
  destructive: "destructive",
  warning: "destructive",
};

export interface ConfirmModalProps {
  /** 開閉状態（制御コンポーネント）。 */
  open: boolean;
  /** 見出し（必須・スクリーンリーダーのラベルにもなる）。例「『前にすすむ』を けす？」 */
  title: React.ReactNode;
  /** 補足説明（任意）。例「けした めいれいは もとに もどせないよ」 */
  description?: React.ReactNode;
  /** 本文（任意・長い場合はスクロール）。 */
  children?: React.ReactNode;
  /** 確定ボタンの文言（例「けす」）。何が起きるかが分かる動詞にする。 */
  confirmLabel: React.ReactNode;
  /** キャンセルボタンの文言。既定「やめる」。 */
  cancelLabel?: React.ReactNode;
  /** 調子（意味づけ）。既定 "destructive"。色のみに依存させず `icon`・文言と対で使う。 */
  tone?: ModalTone;
  /** 見出し脇の装飾アイコン（tone と対で意味を補強）。 */
  icon?: React.ReactNode;
  /** 確定（確定ボタン押下）。閉じるのは呼び出し側が `open` を折ることで行う。 */
  onConfirm: () => void;
  /** キャンセル（キャンセルボタン押下・Esc）。 */
  onCancel: () => void;
  /** 大きさ（最大幅）。確認は短文前提のため既定 "sm"。 */
  size?: ModalSize;
  /** Content コンテナへの追加クラス。 */
  className?: string;
}

/**
 * Radix AlertDialog をラップした確認ダイアログ（画面中央のオーバーレイで明示確定）。
 *
 * 器（Overlay / Content / レイアウト）は `Modal` と同じ共有クラス・ModalShell を使い、
 * 見た目を完全一致させる。セマンティクスは AlertDialog（`role="alertdialog"`）で、
 *  - 初期フォーカスはキャンセル（Radix の既定。急いで Enter しても壊れない）
 *  - 外側クリックでは閉じない（Radix AlertDialog の既定）
 *  - Esc はキャンセル扱い
 *
 * @remarks 閉鎖経路（キャンセル押下・Esc・確定押下）はすべて `onCancel` / `onConfirm` へ
 *   1:1 で写像済みのため `onOpenChange` は使わない（Action 由来の close 要求で `onCancel` が
 *   二重に呼ばれるのを避ける）。`tone` は色のみに依存させず `icon`・文言の対で伝えること
 *   （色覚配慮・→ docs/design-tokens.md §8/§11）。ライト/ダークに追従する。
 */
export const ConfirmModal = ({
  open,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = "やめる",
  tone = "destructive",
  icon,
  onConfirm,
  onCancel,
  size = "sm",
  className,
}: ConfirmModalProps): React.JSX.Element => {
  return (
    <AlertDialog.Root open={open}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay data-slot="confirm-modal-overlay" className={modalOverlayClassName} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <AlertDialog.Content
            data-slot="confirm-modal-content"
            className={cn(modalContentClassName(size), className)}
            onEscapeKeyDown={() => onCancel()}
            {...(description == null ? { "aria-describedby": undefined } : null)}
          >
            <ModalShell
              tone={tone}
              icon={icon}
              title={<AlertDialog.Title className={modalTitleClassName}>{title}</AlertDialog.Title>}
              description={
                description == null ? undefined : (
                  <AlertDialog.Description className={modalDescriptionClassName}>
                    {description}
                  </AlertDialog.Description>
                )
              }
              footer={
                <>
                  <AlertDialog.Cancel asChild>
                    <Button variant="outline" tone="neutral" size="lg" onClick={onCancel}>
                      {cancelLabel}
                    </Button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action asChild>
                    <Button tone={CONFIRM_BUTTON_TONE[tone]} size="lg" onClick={onConfirm}>
                      {confirmLabel}
                    </Button>
                  </AlertDialog.Action>
                </>
              }
            >
              {children}
            </ModalShell>
          </AlertDialog.Content>
        </div>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};

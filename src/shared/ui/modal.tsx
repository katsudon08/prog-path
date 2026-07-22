import { X } from "lucide-react";
import { Dialog } from "radix-ui";

import { cn } from "@/shared/lib";

/** モーダルの大きさ（最大幅）。授業で 2〜3 人が囲むため既定は大きめ。 */
export type ModalSize = "sm" | "md" | "lg";

/**
 * モーダルの調子（意味づけ）。色だけに依存させず、必ず `icon` と対で使う設計
 * （色覚配慮・→ docs/design-tokens.md §8/§11）。
 */
export type ModalTone = "neutral" | "primary" | "success" | "destructive" | "warning";

// --- 器スタイル（Overlay + Content コンテナ + header/footer レイアウト）------------------
// #239 の ConfirmModal（Radix AlertDialog 版）が同じ見た目を再利用できるよう、
// primitive 非依存の共有クラス定数と内部コンポーネント ModalShell を切り出す。
// これらは shared/ui の Public API（index.ts）には出さない（スライス内利用のみ）。

/** 暗幕（Overlay）の共通クラス。Dialog / AlertDialog どちらの Overlay にも適用できる。 */
export const modalOverlayClassName =
  "fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-[progpath-overlay-in_160ms_ease-out] data-[state=closed]:animate-[progpath-overlay-out_120ms_ease-in]";

const MODAL_CONTENT_BASE =
  "relative z-50 flex max-h-[85vh] w-full flex-col rounded-card border border-border bg-popover p-6 text-popover-foreground shadow-2xl outline-none data-[state=open]:animate-[progpath-content-in_170ms_ease-out] data-[state=closed]:animate-[progpath-content-out_130ms_ease-in]";

const MODAL_CONTENT_SIZE: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
};

/** Content コンテナの共通クラス。`size` で最大幅が決まる。 */
export const modalContentClassName = (size: ModalSize = "md"): string =>
  cn(MODAL_CONTENT_BASE, MODAL_CONTENT_SIZE[size]);

/** 見出し（Dialog.Title / AlertDialog.Title）に当てる共通タイポグラフィ。 */
export const modalTitleClassName = "text-xl leading-tight font-bold text-foreground";

/** 説明（Dialog.Description / AlertDialog.Description）に当てる共通タイポグラフィ。 */
export const modalDescriptionClassName = "text-base leading-relaxed text-muted-foreground";

/** tone → アイコンバッジの配色（すべて foreground と 3:1 以上を検証済みのペア）。 */
const MODAL_TONE_BADGE: Record<ModalTone, string> = {
  neutral: "bg-secondary text-secondary-foreground",
  primary: "bg-primary text-primary-foreground",
  success: "bg-success text-success-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  warning: "bg-warning text-warning-foreground",
};

interface ModalShellProps {
  tone?: ModalTone;
  /** 装飾アイコン（tone と対で意味を補強）。省略時はバッジ非表示。 */
  icon?: React.ReactNode;
  /** 既に Title primitive で包んだ見出しノード。 */
  title: React.ReactNode;
  /** 既に Description primitive で包んだ説明ノード（任意）。 */
  description?: React.ReactNode;
  /** 本文（スクロール領域）。 */
  children?: React.ReactNode;
  /** フッター（アクション群など）。 */
  footer?: React.ReactNode;
  /** 閉じるボタン等（Dialog.Close で包んだ×）。省略で非表示。 */
  closeSlot?: React.ReactNode;
  className?: string;
}

/**
 * Content 内部の共通レイアウト（見出し＋アイコン / 説明 / 本文 / フッター / 閉じる）。
 *
 * Radix の primitive に依存しない純レイアウト。`title` / `description` は呼び出し側で
 * 各 primitive（Dialog.Title 等）に包んで渡す前提。Dialog 版（Modal）と AlertDialog 版
 * （#239 ConfirmModal）で共用する。
 */
const ModalShell = ({
  tone = "neutral",
  icon,
  title,
  description,
  children,
  footer,
  closeSlot,
  className,
}: ModalShellProps): React.JSX.Element => {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-4", className)}>
      {closeSlot}
      <div className={cn("flex shrink-0 items-start gap-4", closeSlot != null && "pe-8")}>
        {icon != null && (
          <span
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-full [&_svg]:size-6 [&_svg]:shrink-0",
              MODAL_TONE_BADGE[tone],
            )}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {title}
          {description}
        </div>
      </div>
      {children != null && (
        <div className="min-h-0 flex-1 overflow-y-auto text-base text-foreground">{children}</div>
      )}
      {footer != null && (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">{footer}</div>
      )}
    </div>
  );
};

const MODAL_CLOSE_CLASS =
  "absolute end-4 top-4 inline-flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-5 [&_svg]:shrink-0";

export interface ModalProps {
  /** 開閉状態（制御コンポーネント）。 */
  open: boolean;
  /** 開閉要求のハンドラ（× / Esc / 外側クリック / プログラム）。 */
  onOpenChange: (open: boolean) => void;
  /** 見出し（必須・スクリーンリーダーのラベルにもなる）。 */
  title: React.ReactNode;
  /** 補足説明（任意）。 */
  description?: React.ReactNode;
  /** 本文。 */
  children?: React.ReactNode;
  /** フッター（アクションボタン等）。 */
  footer?: React.ReactNode;
  /** false で × 非表示 + Esc / 外側クリックによる閉鎖を無効化（通知・必須入力の誤操作防止）。 */
  dismissible?: boolean;
  /** 大きさ（最大幅）。既定 "md"。 */
  size?: ModalSize;
  /** 調子（意味づけ・icon と対で使う）。既定 "neutral"。 */
  tone?: ModalTone;
  /** 見出し脇の装飾アイコン。 */
  icon?: React.ReactNode;
  /** Content コンテナへの追加クラス。 */
  className?: string;
}

/**
 * Radix Dialog をラップした中央オーバーレイのモーダル・プリミティブ。
 *
 * フォーカストラップ・`aria-modal`・背景スクロールロックは Radix 標準に委ねる。見た目は
 * デザイントークン（#174）で与え、器（Overlay / Content / header / footer）は ConfirmModal
 * （#239）と共用できるよう切り出してある。
 *
 * @remarks `dismissible=false` のとき Esc / 外側クリックを `preventDefault` で無効化する。
 *   `tone` は色のみに依存させず `icon` と対で使うこと（色覚配慮）。ライト/ダークに追従する。
 */
export const Modal = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  dismissible = true,
  size = "md",
  tone = "neutral",
  icon,
  className,
}: ModalProps): React.JSX.Element => {
  // dismissible=false のときは閉鎖につながる操作を打ち消す。
  const preventWhenLocked = (event: Event): void => {
    if (!dismissible) {
      event.preventDefault();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay data-slot="modal-overlay" className={modalOverlayClassName} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <Dialog.Content
            data-slot="modal-content"
            className={cn(modalContentClassName(size), className)}
            onEscapeKeyDown={preventWhenLocked}
            onPointerDownOutside={preventWhenLocked}
            onInteractOutside={preventWhenLocked}
            {...(description == null ? { "aria-describedby": undefined } : null)}
          >
            <ModalShell
              tone={tone}
              icon={icon}
              title={<Dialog.Title className={modalTitleClassName}>{title}</Dialog.Title>}
              description={
                description == null ? undefined : (
                  <Dialog.Description className={modalDescriptionClassName}>
                    {description}
                  </Dialog.Description>
                )
              }
              footer={footer}
              closeSlot={
                dismissible ? (
                  <Dialog.Close className={MODAL_CLOSE_CLASS} aria-label="閉じる">
                    <X aria-hidden="true" />
                  </Dialog.Close>
                ) : undefined
              }
            >
              {children}
            </ModalShell>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export { ModalShell };

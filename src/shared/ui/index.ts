/**
 * Public API — `shared/ui`
 *
 * Radix UI + Tailwind をラップした共通 UI 部品（Button / Dialog / Overlay 等）と、
 * 非同期 UI の共通境界・表示部品（AsyncBoundary / LoadingView / ErrorView）。
 *
 * 他スライスからの import はこの index.ts 経由のみ。`export * from` は使わず
 * 公開対象を個別に明示し、公開シンボルは実装着手時に追加する
 * （→ docs/directory-structure.md 2.2）。
 */
export { AsyncBoundary } from "./async-boundary";
export type { AsyncBoundaryErrorFallbackProps, AsyncBoundaryProps } from "./async-boundary";
export { Button } from "./button";
export type { ButtonProps, ButtonSize, ButtonTone, ButtonVariant } from "./button";
export { ConfirmModal } from "./confirm-modal";
export type { ConfirmModalProps } from "./confirm-modal";
export { ErrorView } from "./error-view";
export type { ErrorViewProps } from "./error-view";
export { LoadingView } from "./loading-view";
export type { LoadingViewProps, LoadingViewSize } from "./loading-view";
export { Modal } from "./modal";
export type { ModalProps, ModalSize, ModalTone } from "./modal";
export { Switch } from "./switch";

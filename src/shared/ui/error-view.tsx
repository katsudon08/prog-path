import { TriangleAlert } from "lucide-react";

import { cn } from "@/shared/lib";

import { Button } from "./button";

/** エラー値から表示用メッセージを取り出す（取り出せなければ null）。 */
const toMessage = (error: unknown): string | null => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return null;
};

export interface ErrorViewProps {
  /** 発生したエラー（`Error` / 文字列なら詳細メッセージを表示）。 */
  error?: unknown;
  /** 見出し（既定「エラーが おきました」）。 */
  title?: React.ReactNode;
  /** リトライ操作。渡すと「もういちど」ボタンを表示する。 */
  onRetry?: () => void;
  /** リトライボタンの文言。既定「もういちど」。 */
  retryLabel?: React.ReactNode;
  /** コンテナへの追加クラス。 */
  className?: string;
}

/**
 * エラー時の共通表示（アイコン＋見出し＋詳細＋任意のリトライ）。
 *
 * 非同期処理の失敗表示を統一するためのプレゼンテーショナル部品。`AsyncBoundary` の
 * error fallback 既定値としても使い、`onRetry` に境界の reset を渡してリトライ導線にする。
 * `role="alert"` で即時に支援技術へ通知する。色のみに依存させずアイコン＋文言で伝える。
 */
export const ErrorView = ({
  error,
  title = "エラーが おきました",
  onRetry,
  retryLabel = "もういちど",
  className,
}: ErrorViewProps): React.JSX.Element => {
  const message = toMessage(error);
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center justify-center gap-4 text-center", className)}
    >
      <TriangleAlert aria-hidden="true" className="size-12 text-destructive" />
      <div className="flex flex-col gap-1">
        <p className="text-lg font-bold text-foreground">{title}</p>
        {message != null && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
      {onRetry != null && (
        <Button tone="primary" size="lg" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
};

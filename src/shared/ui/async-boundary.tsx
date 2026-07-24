import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";

import { ErrorView } from "./error-view";
import { LoadingView } from "./loading-view";

export interface AsyncBoundaryErrorFallbackProps {
  /** 捕捉したエラー。 */
  error: unknown;
  /** 境界をリセットして再試行する。 */
  reset: () => void;
}

export interface AsyncBoundaryProps {
  /** 境界の内側（サスペンドしうる／エラーを投げうる子）。 */
  children: React.ReactNode;
  /** loading 中の表示。既定は `<LoadingView size="lg" />`。 */
  pendingFallback?: React.ReactNode;
  /** エラー時の表示。既定は `<ErrorView error onRetry={reset} />`。 */
  errorFallback?: (props: AsyncBoundaryErrorFallbackProps) => React.ReactNode;
  /** エラー捕捉時の副作用（ログ等）。 */
  onError?: (error: unknown) => void;
  /** リトライ（境界 reset）時に呼ばれる。キャッシュ済み Promise の破棄などに使う。 */
  onReset?: () => void;
  /** これらの値が変化すると境界を自動リセットする（再試行）。 */
  resetKeys?: readonly unknown[];
}

/**
 * 非同期 UI の共通境界。Error Boundary（react-error-boundary）＋ `Suspense` を 1 枚に合成し、
 * loading / error / リトライの見た目を統一する再利用部品。
 *
 * - loading … `Suspense`（`use()` などレンダー中にサスペンドする子）が担当。既定 `LoadingView`。
 * - error … Error Boundary が担当。既定 `ErrorView`。fallback には境界の reset を渡すので
 *   「もういちど」でそのまま再試行できる。
 *
 * @remarks `Suspense` はイベント/Effect 起点の非同期（カメラ・QR 等）を検知しないため、それらは
 *   命令的な仕組みで扱い、表示だけ `LoadingView`/`ErrorView` を共有して統一する。
 */
export const AsyncBoundary = ({
  children,
  pendingFallback = <LoadingView size="lg" />,
  errorFallback,
  onError,
  onReset,
  resetKeys,
}: AsyncBoundaryProps): React.JSX.Element => {
  const renderFallback = (props: FallbackProps): React.ReactNode => {
    const error: unknown = props.error;
    if (errorFallback != null) {
      return errorFallback({ error, reset: props.resetErrorBoundary });
    }
    return <ErrorView error={error} onRetry={props.resetErrorBoundary} />;
  };

  return (
    <ErrorBoundary
      fallbackRender={renderFallback}
      onError={onError == null ? undefined : (error) => onError(error)}
      onReset={onReset}
      resetKeys={resetKeys == null ? undefined : [...resetKeys]}
    >
      <Suspense fallback={pendingFallback}>{children}</Suspense>
    </ErrorBoundary>
  );
};

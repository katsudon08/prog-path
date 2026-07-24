import { resetDb } from "@/shared/db";
import { AsyncBoundary } from "@/shared/ui";

import { DbGate } from "./db-gate";

/**
 * アプリ全体のプロバイダ合成。
 *
 * 現状 React Context プロバイダは不要（テーマは `initTheme()` のシングルトン、TanStack DB も
 * Provider 不要、Radix ダイアログは自己完結 Portal）。ここでは起動時の DB 初期化ゲートを
 * `AsyncBoundary`（loading / error / リトライ）で包む。将来 Context が要ればここに足す継ぎ目。
 */
export const AppProviders = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  return (
    <AsyncBoundary onReset={resetDb}>
      <DbGate>{children}</DbGate>
    </AsyncBoundary>
  );
};

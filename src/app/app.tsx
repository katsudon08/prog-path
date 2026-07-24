import { AppProviders } from "./providers/app-providers";
import { AppRouter } from "./routing/app-router";

/**
 * アプリの合成ルート（providers → router）。
 *
 * エントリ（`entrypoint/main.tsx`）がこの `App` をマウントする。ビジネスロジックは持たない。
 */
export const App = (): React.JSX.Element => {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
};

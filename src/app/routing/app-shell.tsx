import { Link, Outlet, useLocation } from "react-router";

import { ROUTE_PATH, ROUTE_TITLE, type RouteKey } from "./route-paths";
import { ThemeToggle } from "./theme-toggle";

// 仮 navbar のリンク項目（検証容易性のため全ルート。#198 で Home / Download に整理）。
const NAV_ITEMS: readonly RouteKey[] = ["home", "mazeEdit", "arRun", "download"];

/** pathname から対応するルートキーを引く（無ければ null）。 */
const routeKeyFromPath = (pathname: string): RouteKey | null => {
  const entries = Object.entries(ROUTE_PATH) as [RouteKey, string][];
  const found = entries.find(([, path]) => path === pathname);
  return found == null ? null : found[0];
};

/**
 * 全画面共通の仮レイアウト（暫定 navbar ＋ `<Outlet/>`）。
 *
 * #189 では最低限の遷移担保のみを持つ。#198 で上部バーを `widgets/navbar` に差し替え、
 * 本コンポーネントはレイアウト（Outlet ホスト）として残す想定。
 */
export const AppShell = (): React.JSX.Element => {
  const location = useLocation();
  const currentKey = routeKeyFromPath(location.pathname);
  const currentTitle = currentKey == null ? "" : ROUTE_TITLE[currentKey];

  return (
    // h-dvh（min-h-dvh ではない）で外殻の高さを確定させる。min-height は下限にすぎず高さを
    // 決めないため、下位に min-h-0 を連鎖させても内側スクロール領域が高さを持てず、中身の量だけ
    // ページ全体が縦に伸びる（AR 実行画面のコマンドパネルで顕在化）。画面より高い中身を持つ
    // ページは自前のスクロール領域（overflow-y-auto）を用意すること。
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-4 py-3">
        <span className="text-lg font-bold">ProgPath</span>
        {currentTitle !== "" && (
          <span className="text-sm text-muted-foreground">{currentTitle}</span>
        )}
        <nav className="flex flex-wrap items-center gap-1" aria-label="画面切り替え（仮）">
          {NAV_ITEMS.map((key) => (
            <Link
              key={key}
              to={ROUTE_PATH[key]}
              className="rounded-tile px-3 py-2 text-sm text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              {ROUTE_TITLE[key]}
            </Link>
          ))}
        </nav>
        <div className="ms-auto">
          <ThemeToggle />
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
};

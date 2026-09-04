import { getRouteApi } from "@tanstack/react-router";
import { ARPage } from "@/legacy/pages/ar";

const route = getRouteApi("/shell/ar");

/** URL から迷路 ID とインポート起動かどうかを取り出して画面へ渡すだけのアダプタ */
export function ARRoute() {
  const { id, import: importMode } = route.useSearch();
  return <ARPage mazeId={id} importMode={importMode} />;
}

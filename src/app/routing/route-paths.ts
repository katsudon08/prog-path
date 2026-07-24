/**
 * ルートのパスと表示名（単一の正）。
 *
 * URL パス・現在ページ名の表示・各画面からのナビゲーションで app 内から共有する。navbar 本実装
 * （#198・widgets レイヤー）へは app 側でこの定義を参照して props で渡す（widgets → app の直接
 * import は FSD の逆流になるため行わない）。パスは history モード（クリーン URL）前提。
 */
export const ROUTE_PATH = {
  home: "/",
  mazeEdit: "/maze-edit",
  arRun: "/ar-run",
  download: "/download",
} as const;

/** ルートの識別キー。 */
export type RouteKey = keyof typeof ROUTE_PATH;

/** ルートの表示名（現在ページ名・ナビゲーションのラベル）。 */
export const ROUTE_TITLE: Record<RouteKey, string> = {
  home: "ホーム",
  mazeEdit: "めいろをつくる",
  arRun: "AR でうごかす",
  download: "ダウンロード",
};

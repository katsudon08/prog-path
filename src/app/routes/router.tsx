import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { DownloadPage } from "@/legacy/pages/download";
import { HomePage } from "@/legacy/pages/home";
import "../styles/globals.css";
import { ARRoute } from "./ARRoute";
import { EditorRoute } from "./EditorRoute";
import { Shell } from "./Shell";

const rootRoute = createRootRoute();

// URL のパスを持たないレイアウトルート。path ではなく id を指定して作る
const shellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "shell",
  component: Shell,
});

const homeRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/",
  component: HomePage,
});

const editorRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/editor",
  // URL は書き換えられる外部入力なので、型を絞ってから画面へ渡す
  validateSearch: (search: Record<string, unknown>): { id?: string } => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  component: EditorRoute,
});

const arRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/ar",
  validateSearch: (search: Record<string, unknown>): { id?: string; import?: boolean } => ({
    id: typeof search.id === "string" ? search.id : undefined,
    // 既定のパースで true は boolean になるが、文字列で来た場合も拾う
    import: search.import === true || search.import === "true",
  }),
  component: ARRoute,
});

const downloadRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/download",
  component: DownloadPage,
});

const routeTree = rootRoute.addChildren([
  shellRoute.addChildren([homeRoute, editorRoute, arRoute, downloadRoute]),
]);

export const router = createRouter({ routeTree });

// ルートの型を全体へ登録する。to や search の型チェックがこれで効くようになる
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

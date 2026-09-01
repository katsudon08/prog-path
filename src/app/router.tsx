import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { ARPage } from "@/src/pages/ar";
import { DownloadPage } from "@/src/pages/download";
import { EditorPage } from "@/src/pages/editor";
import { HomePage } from "@/src/pages/home";
import { Navbar, ToastContainer } from "@/src/shared/ui";
import "./styles/globals.css";

const rootRoute = createRootRoute();

/**
 * 全画面共通の外枠
 *
 * URL のパスを持たないレイアウトルート。path ではなく id を指定して作る。
 * Navbar と ToastContainer をここ 1 箇所だけで描画する。
 */
const shellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "shell",
  component: Shell,
});

function Shell() {
  return (
    <>
      <Navbar />
      <Outlet />
      <ToastContainer />
    </>
  );
}

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

// ルート定義と同じモジュールなので editorRoute を直接参照でき、循環参照にならない
function EditorRoute() {
  const { id } = editorRoute.useSearch();
  return <EditorPage mazeId={id} />;
}

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

function ARRoute() {
  const { id, import: importMode } = arRoute.useSearch();
  return <ARPage mazeId={id} importMode={importMode} />;
}

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

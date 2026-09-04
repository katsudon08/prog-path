import { getRouteApi } from "@tanstack/react-router";
import { EditorPage } from "@/legacy/pages/editor";

// ルート定義を import すると router.tsx と循環するため、ID の文字列で引く。
// 文字列は登録済みルートのリテラル型に縛られるので、綴りを誤れば型エラーになる
const route = getRouteApi("/shell/editor");

/** URL から迷路 ID を取り出して画面へ渡すだけのアダプタ */
export function EditorRoute() {
  const { id } = route.useSearch();
  return <EditorPage mazeId={id} />;
}

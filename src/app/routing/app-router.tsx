import { BrowserRouter, Route, Routes } from "react-router";

import { ArRunPage } from "@/pages/ar-run";
import { DownloadPage } from "@/pages/download";
import { HomePage } from "@/pages/home";
import { MazeEditPage } from "@/pages/maze-edit";

import { AppShell } from "./app-shell";

/**
 * アプリのルーティング（react-router v8・declarative・history）。
 *
 * `AppShell` をレイアウトルート（共通の仮 navbar ＋ `<Outlet/>`）にし、4 画面を配置する。
 * 各ページは Public API 経由で import し、後続 Issue（#190/#199/#200/#203）が各スライス内部を
 * 育てる（このルート表は基本触らない）。未知パスは home へフォールバックする。
 */
export const AppRouter = (): React.JSX.Element => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="maze-edit" element={<MazeEditPage />} />
          <Route path="ar-run" element={<ArRunPage />} />
          <Route path="download" element={<DownloadPage />} />
          <Route path="*" element={<HomePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Switch } from "@/shared/ui";

import "../styles/global.css";

// UI 基盤(Tailwind + Radix)の動作確認用の暫定コンポーネント(#169)。
// 本格的な app ルート(providers/routing)は #189 で構築し、この App は差し替える。
const App = (): React.JSX.Element => {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-slate-50 text-slate-900">
      <h1 className="text-3xl font-bold tracking-tight">ProgPath</h1>
      <p className="text-sm text-slate-500">UI 基盤（Tailwind + Radix）動作確認</p>
      <div className="flex items-center gap-3 text-base">
        <span>スイッチ</span>
        <Switch defaultChecked aria-label="動作確認用スイッチ" />
      </div>
    </main>
  );
};

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("ルート要素(#root)が見つかりません");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

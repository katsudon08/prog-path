import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app";
import { initTheme } from "@/shared/theme";

import "../styles/global.css";

// テーマ機構を起動（DOM 反映 + OS 変更監視）。FOUC 防止は index.html のスクリプトが先行実施済み。
initTheme();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("ルート要素(#root)が見つかりません");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

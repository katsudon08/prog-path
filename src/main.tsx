import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// 最小の起動確認用コンポーネント。本格的な app レイヤー(providers/routing)は #168 / #189 で構築する。
const App = (): React.JSX.Element => {
  return <h1>ProgPath</h1>;
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

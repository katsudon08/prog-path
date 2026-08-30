import React from "react";
import { ARPage } from "@/src/pages/ar";
import { DownloadPage } from "@/src/pages/download";
import { EditorPage } from "@/src/pages/editor";
import { HomePage } from "@/src/pages/home";
import "../styles/globals.css";

/**
 * ルートコンポーネント
 *
 * パスの振り分けは #265 で TanStack Router に置き換えるまでの暫定実装。
 * Navbar と ToastContainer は各ページが自前で描画するため、ここには置かない。
 */
export function App(): React.ReactElement {
  const pathname = window.location.pathname;

  if (pathname.startsWith("/editor")) return <EditorPage />;
  if (pathname.startsWith("/ar")) return <ARPage />;
  if (pathname.startsWith("/download")) return <DownloadPage />;
  return <HomePage />;
}

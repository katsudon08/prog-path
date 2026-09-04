import { Outlet } from "@tanstack/react-router";
import { Navbar, ToastContainer } from "@/src/shared/ui";

/**
 * 全画面共通の外枠
 *
 * パスを持たないレイアウトルートの中身。Navbar と ToastContainer を
 * ここ 1 箇所だけで描画し、各画面は Outlet に入る。
 */
export function Shell() {
  return (
    <>
      <Navbar />
      <Outlet />
      <ToastContainer />
    </>
  );
}

import { use } from "react";

import { initDb } from "@/shared/db";

/**
 * DB 起動ゲート。
 *
 * `initDb()`（冪等・モジュールキャッシュ・ブラウザ専用）を `use()` で待ち、初期化完了まで
 * サスペンドする。loading / error / リトライは親の `AsyncBoundary` が担当する（`initDb` は
 * 失敗した Promise も捨てずに保持し続けるため、`use()` がその失敗をレンダー中の throw として
 * Error Boundary へ届けられる。リトライは境界の reset が `resetDb` でキャッシュを捨て、続く
 * 再レンダーで `initDb()` が新しい Promise を作り直して行う）。
 * `use(initDb())` はレンダー中に呼ぶが、`initDb` がキャッシュ済み Promise を返すため
 * 「毎レンダー新規 Promise で fallback ループ」は起きない。
 */
export const DbGate = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  use(initDb());
  return <>{children}</>;
};

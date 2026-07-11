# #179 スパイク: SQLite(WASM+OPFS) 永続化の実機検証

`shared/db` の永続化基盤（TanStack DB `persistedCollectionOptions` + `@tanstack/browser-db-sqlite-persistence`＝wa-sqlite(WASM) + OPFS）が、**実ブラウザで永続するか**を実コード（`@/shared/db` の `initDb()`）で検証する。

db-design §6 で唯一の実リスクとした「OPFS 永続化の成立」を de-risk するのが目的。

## 実行方法

```
mise run dev        # = vp dev（http://localhost:5173）
# ブラウザで開く:
#   http://localhost:5173/spikes/179-sqlite-opfs/index.html
```

- `probe.ts` は `@/shared/db` の `initDb()` を呼び、迷路の追加／削除と再読込後の件数を画面に表示する。
- OPFS はオリジン単位の永続領域。`localhost` は secure context のため利用可。`OPFSCoopSyncVFS` は専用 Worker + 同期アクセスハンドルで動くため **COOP/COEP（cross-origin isolation）不要**。

## 結果（2026-07-11 / 実行環境: Chromium ベースのブラウザペイン）

| 検証項目 | 結果 |
| --- | --- |
| wa-sqlite(WASM) + OPFS Worker のロード | ✅ エラーなし（Vite の `new Worker(new URL(...))` で worker/wasm がバンドル・配信される） |
| `initDb()`（OPFS DB オープン → persistence → コレクション生成） | ✅ 成功 |
| 起動時の未分類フォルダ自動生成（`ensureInitialData`） | ✅ 「フォルダ 1 件（未分類あり ✓）」 |
| 迷路 0 件が正常状態 | ✅ |
| `insert` の永続 | ✅ 追加 → **フルリロード後も同一 id の迷路が残存**（メモリではなくディスク永続を確認） |
| `delete` の永続 | ✅ 全削除 → フルリロード後も 0 件 |
| 未分類フォルダの冪等性（再読込で重複しない） | ✅ 常に 1 件 |
| コンソールエラー | ✅ なし |

**結論**: ブラウザ（Chromium）では SQLite(WASM+OPFS) 永続化が期待どおり動作し、CRUD がページ再読込を跨いで永続する。db-design §6 で採用した方式は成立。

## 残課題（このスパイクの範囲外）

- **Tauri WebView での実機検証**: 本スパイクは Chromium ベースのブラウザで確認した。Windows の WebView2 は Chromium 系のため本結果が強く当てはまるが、macOS(WKWebView)・Linux(WebKitGTK) の OPFS 対応は各 WebView に依存するため、Tauri 実機（`mise run dev:desktop`）での確認を #175 と併せて行う。不成立の場合は Tauri ネイティブ SQLite アダプタ、最終的に RxDB/IndexedDB へフォールバック（→ db-design §6）。

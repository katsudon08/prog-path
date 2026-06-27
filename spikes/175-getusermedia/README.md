# spike #175 — getUserMedia の WebView 動作検証

AR 背景・QR 読み取りの共通土台である `getUserMedia` が各 WebView で動くかを検証する使い捨て probe。
Issue #175 / 結果の要約は [docs/architecture.md §7.2](../../docs/architecture.md)。

## probe.html

secure context（https or localhost）で配信し、「カメラ開始」で `getUserMedia` → `<video>` → canvas 描画までを自己診断して結果 JSON を表示する。
チェック項目: `isSecureContext` / `mediaDevices` 有無 / `enumerateDevices`（許可前後）/ `getUserMedia` 成否 / video 寸法 / canvas `drawImage` / フレーム非黒判定。

## 再現手順

### Web（ブラウザ）

`file://` は secure context でないため localhost で配信する:

```sh
python3 -m http.server 8175 --directory spikes/175-getusermedia
```

ブラウザで `http://localhost:8175/probe.html` を開き「カメラ開始」→ 許可 → JSON を確認。

- Safari = WebKit（≈ Tauri mac の WKWebView）/ Chrome・Edge = Chromium（≈ Windows の WebView2）。

### Tauri（使い捨てシェル）

1. Rust を導入（例: `mise use -g rust@stable`）。
2. 最小シェルを作る:
   ```sh
   pnpm create tauri-app@latest spike -m pnpm -t vanilla --tauri-version 2 --identifier com.progpath.spike175 -y
   ```
3. `src/index.html` を `probe.html` に置き換える（`frontendDist` が `../src`）。
4. macOS は `src-tauri/Info.plist` に `NSCameraUsageDescription` を追加（必須）。
5. `pnpm install && pnpm tauri dev`。開いたウィンドウで「カメラ開始」→ 許可 → JSON。

## Phase A 結果（2026-06-27 / macOS）

Safari / Chrome / Tauri×mac(dev) いずれも **PASS**（getUserMedia〜canvas 描画まで）。詳細は docs/architecture.md §7.2 と Issue #175。

- 注意: `tauri dev` は `http://127.0.0.1` 配信（localhost=secure context）。本番 bundle は custom protocol（mac=`tauri://localhost` / Win=`http://tauri.localhost`）。
- 必要設定: macOS は Info.plist `NSCameraUsageDescription` 必須。Tauri capability は不要（Web 標準 API）。

## Phase B（Windows / 未実施・要実機）チェックリスト

- [ ] Tauri × Windows(WebView2) で probe を実行し `getUserMedia` 可否を確認
- [ ] custom protocol（`http://tauri.localhost`）が `isSecureContext=true` か
- [ ] WebView2 の `PermissionRequested` を Rust 側で処理する必要があるか
- [ ] 必要設定（capability / 権限 / Windows プライバシー設定）を記録 → §7.2 を更新し #175 をクローズ

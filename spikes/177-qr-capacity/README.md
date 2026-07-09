# spike #177 — QRシリアライズ 1迷路=1QR 収容検証

迷路データが圧縮後に **1 つの QR コードへ収まるか** を検証する使い捨て probe。
Issue #177 / 確定結論は [docs/db-design.md §8](../../docs/db-design.md)。

## 何を測るか

迷路ペイロード（`schemaVersion / name / size / floors / tiles`）を複数のエンコード経路
（圧縮ライブラリ × テキスト符号化）で `圧縮 → (Base64|base45) → QR` に通し、各 QR 誤り訂正レベル
（L/M/Q/H）で以下を計測する:

- **最小 QR バージョン**と **1 QR 収容可否**（≤ v40）
- **jsQR による読み戻し**（QR エンコード/デコードの整合。製品の読取は `qr-scanner`=jsQR ラッパ）
- **可逆性**（`decode(encode(payload)) === payload`）

最悪ケースは **7×7×3 = 147 セル**（db-design §3 の上限）。圧縮を最も効かせないため、
`adversarial` モードで 147 セルを 8 種タイルから一様ランダム生成（最大エントロピー）する。
比較のため妥当寄りの `realistic` モードも同時計測する。

## probe.html

`vendor/`（下記 curl で取得）の UMD を読み込み、ページ読込時に全パイプライン × 全 ECC を
自動計測して比較表・サンプル QR・結果 JSON を描画する。依存を製品 `package.json` に持ち込まない。

エンコード・パイプライン:

| id | 圧縮 | 符号化 | QRモード | 位置づけ |
| --- | --- | --- | --- | --- |
| `fflate+b64` | deflate(fflate) | Base64 | Byte | 設計ベースライン |
| `pako+b64` | deflate(pako) | Base64 | Byte | 圧縮ライブラリ比較 |
| `lz-string+b64` | LZString | Base64 | Byte | LZ系比較 |
| `fflate+base45` | deflate(fflate) | base45(RFC 9285) | Alphanumeric | 英数モード |
| `bitpack+base45` | 3bitパック(無圧縮) | base45 | Alphanumeric | 最悪ケース最小 |
| `bitpack+deflate+base45` | 3bitパック→deflate | base45 | Alphanumeric | 低エントロピー向き |

## 再現手順

### 1. ライブラリ取得（`vendor/` は .gitignore・非追跡）

```sh
mkdir -p spikes/177-qr-capacity/vendor && cd spikes/177-qr-capacity/vendor
curl -sSL -o qrcode-generator.js "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js"
curl -sSL -o fflate.js           "https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.js"
curl -sSL -o pako.min.js         "https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js"
curl -sSL -o lz-string.min.js    "https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js"
curl -sSL -o jsQR.js             "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js"
```

### 2. 配信して開く

```sh
python3 -m http.server 8177 --directory spikes/177-qr-capacity --bind 127.0.0.1
```

ブラウザで `http://localhost:8177/probe.html` を開く。`size / floors / name長` を変えて「再計測」。

> ヘッドレスでも同一ロジックを実行できる（qrcode-generator/fflate/pako/lz-string/jsQR は Node でも動く）。
> ただしリポジトリ root の `package.json` が `type: module` のため、`.js` は Node で ESM 扱いになり
> UMD が exports を張れない。Node で回す場合は各 vendor を `*.cjs` としてコピーして `require` する。
> 本 spike の結論値はこのヘッドレス経路（probe.html と同一ロジック）で確定した。

## 結果（2026-07-08 / 最悪ケース 7×7×3=147セル・name=全角50字）

すべての `パイプライン × ECC`（**48/48**）で **収容OK・可逆OK**。読み戻しも 48/48 OK。

| pipeline | mode | 圧縮後B | 符号長 | QR版 L / M / Q / H |
| --- | --- | ---: | ---: | --- |
| `fflate+b64`（ベースライン） | adversarial | 427 | 572 | v16 / **v19** / v23 / v26 |
| `pako+b64` | adversarial | 433 | 580 | v16 / v19 / v23 / v26 |
| `lz-string+b64` | adversarial | 554 | 740 | v19 / v22 / v26 / v30 |
| `fflate+base45` | adversarial | 427 | 641 | v14 / **v16** / v19 / v23 |
| `bitpack+base45` | adversarial | 193 | 290 | v9 / v10 / v12 / v15 |
| `bitpack+deflate+base45` | adversarial | 181 | 272 | v8 / v10 / v12 / v14 |
| `fflate+b64` | realistic | 307 | 412 | v13 / v15 / v19 / v22 |
| `fflate+base45` | realistic | 307 | 461 | v11 / v13 / v16 / v19 |

- QR v40（絶対上限）に対し、最悪ケースでも大きな余裕。
- **base45（英数モード）は同じ圧縮バイトでも Base64（バイトモード）より 2〜3 版低い QR** に収まる（例 M: v19→v16）。
- `bitpack`（タイル3bit）は劇的に小さい（v9〜）が QR 形式をタイル列挙に密結合させる。
- `fflate` と `pako` はほぼ同一サイズ。`lz-string` は最も非効率。

### 過大ケース（name=全角200字・非現実的）

参考にストレス計測。ここでも **48/48 収容OK**（最悪 `lz-string` adversarial H で v36 ＜ v40）。
唯一 `lz-string`×adversarial×H（v36）で jsQR 読み戻しが失敗したが、これは**収容失敗ではなく
最密バージョンの合成描画(4px/module)を jsQR が復号しきれなかった**もの。
→ 「バージョンを低く保つ（base45 + 中庸 ECC・lz-string 回避）」判断を裏付ける。名前長の収容影響は軽微。

## 結論（→ docs/db-design.md §8 に昇格）

- **1 迷路 = 1 QR は確定で実現可能**。仕様内（5〜7・1〜3階）の迷路は単一 QR に余裕で収まり、
  構造上 v40 を超えることはない。**分割は不要**。
- 圧縮 = **deflate（`fflate`）**、テキスト符号化 = **base45（QR 英数モード）**、ECC = **Q（25%復元）**、
  QR 生成 = **`qrcode-generator`**、読取 = 既定どおり **`qr-scanner`（jsQR）**。
- 採用構成（fflate deflate → base45 → 英数モード・ECC Q）で最悪 **v19**（≤ v40）。
- サイズ超過エラーは schemaVersion 変更等に備える防御的セーフティネット（正常運用では発火しない）。

## 残チェックリスト

- [ ] 実カメラ・読取距離での読み取り成否（安価カメラ／低スペック端末）は device 検証で別途（本 spike はスコープ外）
- [ ] 迷路名の最大長確定（features §3.6 の〔要確認〕。収容影響は軽微だが確定後に上限バリデーションへ反映）

# デザイントークン

ProgPath（再開発版）の**デザイントークンとビジュアル対応の統一定義**。配色（ライト/ダーク）・タイポ・スペーシング・タップ最小サイズ、およびタイル/コマンドの識別色・アイコンの単一の参照先とする。

- 対象読者: UI を実装する開発者（人・AI）、および画面ビジュアル仕様（追加 B / #191）の検討者。
- 実装の正: トークン値の実体は [`src/app/styles/global.css`](../src/app/styles/global.css)。本書は**意図・対応・根拠**を示す。齟齬があれば CSS を正とし本書を同期する。
- 用語（`TileKind` / コマンド識別子）の正は [glossary.md](./glossary.md)。
- 位置づけ: 全 entities の UI が依存する**土台**（#174）。最終ビジュアルは画面モック（#191）と往復して確定しうる。

---

## 1. 設計方針（確定事項）

- **利用文脈**: 2〜3 人で 1 台を囲む授業（→ [requirements.md](./requirements.md)）。画面から**距離がある**前提で要素・文字・タップ領域を大きめに取り、コントラストを厚めに確保する。
- **配色は [Radix Colors](https://www.radix-ui.com/colors)（`@radix-ui/colors`）を採用**。ライト/ダーク双方が体系設計された 12 ステップスケールを CSS で import し、Tailwind v4 の `@theme inline` でセマンティックトークンにマップする。手作業 hex を廃し、更新追従・P3 広色域・アクセシビリティ調整を継承する。
- **命名は shadcn/ui 準拠のセマンティック2層**（primitive=Radix / semantic=役割）。CSS 変数を単一ソースとし、DTCG/JSON パイプラインは採用しない（小〜中規模では過剰）。面とテキストは必ずペア（`X` / `X-foreground`）で持ち、コントラストを構造的に担保する。
- **テーマはライト/ダーク両対応**。`.dark` クラス方式（Radix と一致）で切り替え、機構は [`src/shared/theme`](../src/shared/theme) が担う（→ §10）。
- **アクセシビリティは WCAG 準拠**（→ §8・§11）。色のみに依存させず **色＋アイコン**で識別する。
- **タイポは self-host の BIZ UDPGothic**（UD ゴシック・OFL）。オフライン（Tauri）で全 OS 共通の可読性を確保（→ §7）。

### Radix 12 ステップの役割（要約）

| Step | 役割 | Step | 役割 |
| --- | --- | --- | --- |
| 1 | アプリ背景 | 7 | UI 境界・フォーカスリング |
| 2 | 微妙な背景（カード面） | 8 | hover 境界 |
| 3 | UI 要素背景 | **9** | **ソリッド（純色）** |
| 4 | hover 背景 | 10 | ソリッド hover |
| 5 | active/選択 背景 | **11** | **低コントラストテキスト** |
| 6 | 微妙な境界・区切り | **12** | **高コントラストテキスト** |

> 青ブランドの公式ニュートラルは `slate`。step 11/12 は step 1–2 背景上でアクセシブルになるよう設計されている。

---

## 2. セマンティックトークン（shadcn/ui 準拠）

`@theme inline` で Radix ステップへマップし、`var()` 参照を保つため `.dark` 付与でダークに追従する。utility は `bg-*` / `text-*` / `border-*` / `ring-*`。

| トークン | utility 例 | 役割 | Radix ソース |
| --- | --- | --- | --- |
| `background` / `foreground` | `bg-background` `text-foreground` | 画面背景 / 既定テキスト | `slate-1` / `slate-12` |
| `card` / `card-foreground` | `bg-card` | カード・パネル面 | `slate-2` / `slate-12` |
| `popover` / `popover-foreground` | `bg-popover` | ポップオーバ面 | `slate-2` / `slate-12` |
| `primary` / `primary-foreground` | `bg-primary` | 主アクション | `blue-9` / `#fff` |
| `secondary` / `secondary-foreground` | `bg-secondary` | 副次面 | `slate-3` / `slate-12` |
| `muted` / `muted-foreground` | `text-muted-foreground` | 控えめ面 / 補助テキスト | `slate-3` / `slate-11` |
| `accent` / `accent-foreground` | `bg-accent` | hover 等の強調面 | `slate-4` / `slate-12` |
| `destructive` / `destructive-foreground` | `bg-destructive` | 失敗・破壊的操作 | `tomato-9` / `#fff` |
| `success` / `success-foreground` | `bg-success` | 成功（ゴール到達等） | `grass-9` / `#fff` |
| `warning` / `warning-foreground` | `bg-warning` | 注意 | `amber-9` / `#4f3422`（固定） |
| `border` | `border-border` | 微妙な境界・区切り | `slate-6` |
| `input` | `border-input` | 入力の境界 | `slate-7` |
| `ring` | `ring-ring` | フォーカスリング | `blue-9` |

> `success`/`warning` は shadcn 標準外だが、迷路実行の成功/注意表現のためドメイン都合で追加。`warning-foreground` は固定暗色（理由は §3 冒頭）。

---

## 3. タイル種別のビジュアル対応（TileKind）

識別子・定義の正は [glossary.md](./glossary.md) §2。fill は Radix step 9（**彩度色はライト/ダークで同値＝モード非依存**）。そのため明色系 fill の前景は **固定の暗色リテラル**（step 12 はモードで明暗が反転し、片方で破綻するため参照しない）。アイコンは [lucide-react](https://lucide.dev)。

| 日本語名 | 識別子 | fill utility / ソース | 前景 fg | lucide |
| --- | --- | --- | --- | --- |
| 床 | `floor` | `bg-tile-floor` = `slate-3` | `slate-12`（追従） | `Square` |
| 壁 | `wall` | `bg-tile-wall` = `slate-9` | `#fff` | `BrickWall` |
| 穴 | `hole` | `bg-tile-hole` = `#1c2024`（固定暗色） | `#fff` | `CircleDashed` |
| スタート | `start` | `bg-tile-start` = `grass-9` | `#fff` | `Flag` |
| ゴール | `goal` | `bg-tile-goal` = `amber-9` | `#4f3422`（固定） | `Trophy` |
| テレポート（上へ） | `teleportUp` | `bg-tile-teleport-up` = `violet-9` | `#fff` | `CircleArrowUp` |
| テレポート（下へ） | `teleportDown` | `bg-tile-teleport-down` = `indigo-9` | `#fff` | `CircleArrowDown` |
| カギ | `key` | `bg-tile-key` = `yellow-9` | `#473b1f`（固定） | `Key` |

- 前景は `text-tile-<name>-foreground` utility。
- `floor`/`wall` は slate（テーマ追従）。`hole` は「穴＝暗い」を保つため固定暗色（ダークでは背景と近くなるためアイコン/枠で識別）。
- 3D 表現（`entities/maze` の Tile3d）でもこの色を基調に質感・陰影を加える。

---

## 4. コマンド種別のビジュアル対応

ファミリ単位で色を割り当て、同ファミリ内はアイコンで区別。識別子の正は [glossary.md](./glossary.md) §4。

| 日本語名 | 識別子 | fill utility / ソース | 前景 fg | lucide |
| --- | --- | --- | --- | --- |
| 前にすすむ | `forward` | `bg-cmd-move` = `blue-9` | `#fff` | `ArrowUp` |
| 右にまがる | `turnRight` | `bg-cmd-turn` = `cyan-9` | `#0d3c48`（固定） | `RotateCw` |
| 左にまがる | `turnLeft` | `bg-cmd-turn` = `cyan-9` | `#0d3c48`（固定） | `RotateCcw` |
| 穴をうめる | `ifHole` | `bg-cmd-fill` = `orange-9` | `#582d1d`（固定） | `Shovel` |
| ループ | `loop` / `loopStart` / `loopEnd` | `bg-cmd-loop` = `purple-9` | `#fff` | `Repeat` / `Repeat1` |

- 前景は `text-cmd-<family>-foreground` utility。
- ループのネスト表示は色に加え階層インデントで視認性を確保（→ [features.md](./features.md) 5.3）。

---

## 5. タイル/コマンド色の型付き実装（今後）

`entities/maze`（#182）・`entities/command`（#184）が `TileKind` / コマンド識別子 → 上記 utility の型付きマッピングを持ち、UI から参照する。本書と glossary を正とする。

---

## 6. ブランド階調

青ブランドの Radix `blue` と、調和する `slate` ニュートラルを基調にする（Radix 公式のペア推奨）。アクセントは用途別に `grass`（成功/start）・`amber`（注意/goal）・`violet`/`indigo`（テレポート）・`yellow`（カギ）・`cyan`（旋回）・`orange`（穴うめ）・`purple`（ループ）・`tomato`（失敗）。使用スケールの light + dark を `global.css` で import する。

---

## 7. タイポグラフィ

- **フォント（`--font-sans`）**: `"BIZ UDPGothic"`（先頭）→ `"Hiragino Sans", "Yu Gothic UI", Meiryo, system-ui, sans-serif`（フォールバック）。
- **BIZ UDPGothic**: モリサワ製の**ユニバーサルデザイン（UD）ゴシック**（プロポーショナル版）。教室で距離を置いた可読性・教育適性に優れ、**SIL OFL 1.1** で再配布可。Regular(400)/Bold(700) を **self-host**（[`public/fonts/biz-udpgothic-*.woff2`](../public/fonts)）。丸ゴシックは小サイズ・距離での可読性が劣るため不採用（親しみは配色/角丸/アイコン/3D で補う）。
- **入手/生成**: 上流 `googlefonts/morisawa-biz-ud-gothic`。`pyftsubset` で「英数記号＋ラテン＋かな＋記号＋CJK(U+4E00–9FFF)」にサブセットした woff2（各 ≈1.5MB）。自由入力（迷路名）に備え範囲は広め。
- **ライセンス**: [`public/fonts/OFL-BIZUDGothic.txt`](../public/fonts/OFL-BIZUDGothic.txt) を同梱。無改変同梱のため予約フォント名（RFN）の影響なし。
- **等幅（`--font-mono`）**: QR 文字列・デバッグ表示向けの system 等幅スタック。
- **サイズ**: Tailwind 既定スケール（`text-sm`〜）。距離のある視認前提で **本文は `text-base`(16px) 以上、主要ラベルは `text-lg`(18px 相当) 以上**を目安とする。

---

## 8. スペーシング・タップターゲット（WCAG 準拠）

`--spacing-tap*` から `size-*` / `min-h-*` / `min-w-*` / `p-*` / `gap-*` 等の utility が生成される。

| トークン | utility 例 | 値 | 根拠 |
| --- | --- | --- | --- |
| `tap-min` | `min-h-tap-min` | `2.75rem`(44px) | WCAG 2.1 SC 2.5.5 Target Size(Enhanced, AAA) / Apple HIG 44pt |
| `tap` | `size-tap` | `3rem`(48px) | **標準**。Material 48dp。子どもの操作精度＋距離を考慮 |
| `tap-lg` | `min-h-tap-lg` | `3.5rem`(56px) | 主要操作 |

> 操作可能要素は**最低でも `tap`(48px)**。WCAG 2.2 SC 2.5.8(Minimum, AA)=24px を大きく上回る安全側。ターゲット間は 8px 以上を推奨。

---

## 9. 角丸

| トークン | utility | 値 | 用途 |
| --- | --- | --- | --- |
| `tile` | `rounded-tile` | `0.5rem` | タイル・小さなチップ |
| `button` | `rounded-button` | `0.75rem` | ボタン・入力 |
| `card` | `rounded-card` | `1.25rem` | カード・パネル・ダイアログ |

---

## 10. ダークモード機構

- **方式**: `.dark` クラス（Radix / `@custom-variant dark` と一致）。`<html>` に `.dark` が付くとセマンティック/タイル/コマンドの全 utility がダーク値へ追従する。
- **実装**: [`src/shared/theme`](../src/shared/theme)。`ThemeMode = "light" | "dark" | "system"`（既定 `system` = OS 追従）。追加依存なし（React `useSyncExternalStore`）。
  - `initTheme()`: 起動時に一度呼び、DOM 反映＋OS 変更監視を開始。
  - `useTheme()`: 現在の `mode`/`resolved` を購読し `setMode` で切替。
  - 永続化: localStorage（キー `progpath-theme`）。
- **FOUC 防止**: [`index.html`](../index.html) の `<head>` インラインスクリプトが描画前に同ロジックで `.dark` を確定する（キー/判定を theme-store と一致させること）。
- 現状は `main.tsx` に動作確認用トグルを設置。正式なトグル UI / プロバイダは #189 で構築する。

---

## 11. コントラスト検証（WCAG）

方針: 本文テキスト **AA 4.5:1 以上（AAA 7:1 目標）**、大きいテキスト/アイコン/ソリッド面・フォーカスリング等の非テキストは **3:1 以上（SC 1.4.11）**。「大きいテキスト」= 18pt(24px) / 14pt 太字(18.66px)。ソリッド面のラベルは主要ラベル基準（18px 相当以上）で扱い 3:1 を適用。

実測（`@radix-ui/colors` の値で算出。ライト/ダーク両モードで基準クリアを確認済み）:

| ペア | 基準 | Light | Dark |
| --- | --- | --- | --- |
| background / foreground | 4.5（本文） | 15.98 | 16.25 |
| muted / muted-foreground | 4.5（本文） | 5.22 | 7.64 |
| primary / primary-fg | 3.0（ソリッド） | 3.26 | 3.26 |
| destructive / dest-fg | 3.0 | 3.87 | 3.87 |
| success / success-fg | 3.0 | 3.03 | 3.03 |
| warning / warning-fg | 3.0 | 7.21 | 7.21 |
| ring(blue-9) / background | 3.0（非テキスト） | 3.18 | 5.78 |
| tile goal / fg | 3.0 | 7.21 | 7.21 |
| tile key / fg | 3.0 | 8.68 | 8.68 |
| tile wall / fg | 3.0 | 3.30 | 5.13 |
| cmd turn / fg | 3.0 | 3.98 | 3.98 |
| cmd ifHole / fg | 3.0 | 3.91 | 3.91 |

> `primary`/`success` 等のソリッド面 + 白文字は 3:1（大きいテキスト/アイコン）を満たす。小サイズの本文にソリッド面を使わないこと（本文は foreground on background を用いる）。`border`(slate-6) は「微妙な区切り」用で意図的に低コントラスト（SC 1.4.11 の対象となる**必須の**境界には `input`/`ring` や面の塗りで別途 3:1 を確保する）。

---

## 12. 利用方針

- 色は原則**セマンティックトークン**（§2）を使い、テーマ差を吸収する。Radix 生値（`--blue-9` 等）や Tailwind 既定色の直書きは、タイル/コマンド識別色以外では避ける。
- タイル/コマンドは §3・§4 の対応（色＋アイコン）に従う。
- 新トークンは `global.css` に追加し、本書の対応表・検証を同期する。

---

## 13. 関連ドキュメント・クレジット

- [glossary.md](./glossary.md) — タイル/コマンドの識別子と定義の正。
- [features.md](./features.md) — 画面別の振る舞いと共通ビジュアル方針。
- [requirements.md](./requirements.md) — 利用前提・UI 方針の源泉。
- [`src/app/styles/global.css`](../src/app/styles/global.css) — トークン値の実装（正）。
- **フォント**: [BIZ UDPGothic](https://fonts.google.com/specimen/BIZ+UDGothic) © The BIZ UDGothic Project Authors、[SIL OFL 1.1](../public/fonts/OFL-BIZUDGothic.txt)。
- **配色**: [Radix Colors](https://www.radix-ui.com/colors)（MIT）。

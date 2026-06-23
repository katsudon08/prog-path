# 用語集

ProgPath（再開発版）で用いる主要用語の**統一定義**。ドキュメント間・実装間の表記揺れを防ぐための単一の参照先とする。

- 対象読者: 新規開発者、および設計判断の参照者（人・AI）。
- 使い方: 各ドキュメント・コード・UI 文言は本書の表記に合わせる。詳細な振る舞いは各用語の関連ドキュメントを参照。
- 表記の原則: 日本語名（UI 表示・文章で使う）と、英語名／コード識別子（型・変数・QR 文字列）を対応づける。識別子の大小文字・綴りはコードの正とする。

> 用語は [features.md](./features.md) / [architecture.md](./architecture.md) / [directory-structure.md](./directory-structure.md) / [db-design.md](./db-design.md) / [requirements.md](./requirements.md) から集約した。定義の正は各関連ドキュメント。

---

## 1. ドメイン基本

| 日本語名 | 識別子 | 定義 | 関連 |
| --- | --- | --- | --- |
| 迷路 | `maze` | ロボットを動かす対象。階層・サイズ・タイル配置を持つドメインの中心。 | [db-design](./db-design.md) 3.2 |
| フォルダ | `folder` | 迷路を分類する入れ物。迷路は必ず 1 つのフォルダに属する。 | [db-design](./db-design.md) 3.1 |
| 未分類 | （予約フォルダ） | 既定のフォルダ。常に存在し、削除・リネーム不可（`isDefault: true`）。どのフォルダにも属さない迷路が入る。 | [features](./features.md) 3.4 |
| 階層 | `floors` / `floor` | 迷路の階の数（**1〜3**）。`floor` は各階のインデックス（0 始まり、表示階 = `floor + 1`）。 | [db-design](./db-design.md) 3.4 |
| サイズ | `size` | 迷路一辺のマス数（**5〜7**）。**全階共通**で正方グリッド。 | [db-design](./db-design.md) 3.2 |
| タイル | `Tile` / `TileKind` | グリッドの 1 マス。種別を `TileKind` で表す（→ [2](#2-タイル種別tilekind)）。 | [db-design](./db-design.md) 3.3 |
| タイル配置 | `tiles` | 迷路のタイルを表す 3 次元密配列 `tiles[floor][row][col]`。 | [db-design](./db-design.md) 3.4 |
| グリッド | grid | 迷路を構築・編集する 1 階分のマス目。 | [features](./features.md) 4.3 |

---

## 2. タイル種別（TileKind）

`TileKind` は 8 種の文字列リテラルユニオン。

| 日本語名 | 識別子 | 定義 | 関連 |
| --- | --- | --- | --- |
| 床 | `floor` | 通行可能なマス。 | [features](./features.md) 4.4 |
| 壁 | `wall` | 通行不可。前方が壁のまま前進すると失敗。 | [features](./features.md) 4.4 |
| 穴 | `hole` | 埋めていない穴に進入すると落下して失敗。`ifHole` で埋めると床になる。 | [features](./features.md) 4.4 |
| スタート | `start` | ロボットの開始位置。**迷路に 1 つ必須**。 | [features](./features.md) 4.4 |
| ゴール | `goal` | 到達目標。**迷路に 1 つ必須**。全カギ取得が到達条件。 | [features](./features.md) 4.4 |
| テレポート（上へ） | `teleportUp` | 上階の同位置へ移動。向きは維持。 | [features](./features.md) 4.4 |
| テレポート（下へ） | `teleportDown` | 下階の同位置へ移動。向きは維持。 | [features](./features.md) 4.4 |
| カギ | `key` | 踏むと自動取得。設置した全カギの取得がゴール条件。 | [features](./features.md) 4.4 |

> テレポートの整合（移動先が存在しない／壁・穴・テレポート）は編集時にエラー検出する。

---

## 3. ロボットと実行

| 日本語名 | 識別子 | 定義 | 関連 |
| --- | --- | --- | --- |
| ロボット | `robot` | 迷路上を動く対象。位置・向き・階層・取得済みカギを持つ。 | [features](./features.md) 5.6 |
| 向き | direction | ロボットの方位（4 方向）。例 `(1,0)/(0,1)/(-1,0)/(0,-1)`。初期向きは**固定**。 | [features](./features.md) 5.6 |
| 実行 | run | コマンドスタックを先頭から順次解釈し、ロボットを動かすこと。実行前にスタート位置・初期向きへリセット。 | [features](./features.md) 5.4 |
| 成功 | success | ゴール到達かつ全カギ取得。 | [features](./features.md) 5.5 |
| 失敗 | failure | 壁衝突／穴落下／カギ未取得でゴール到達／コマンド尽きで未到達のいずれか。 | [features](./features.md) 5.5 |
| カギ取得 | — | カギタイルを踏むと自動で取得（順不同）。 | [features](./features.md) 5.5 |
| ミニマップ | mini-map | ロボットの位置・階層を示す俯瞰表示。 | [features](./features.md) 5.2 |
| 移動カウント | move-count | ロボットが進んだマス数。 | [features](./features.md) 5.4 |

---

## 4. コマンド

| 日本語名 | 識別子（QR 文字列） | 定義 | 関連 |
| --- | --- | --- | --- |
| コマンド | `command` | ロボットへの 1 命令。QR カードを読み取って作る。 | [features](./features.md) 5.3 |
| コマンドスタック | command stack | コマンドの並び。実行はこの先頭から順次行う。**永続化しない**（毎セッションで作る）。 | [features](./features.md) 5.3 |
| 前にすすむ | `forward` | 向いている方向へ 1 マス進む。 | [features](./features.md) 5.3 |
| 右にまがる | `turnRight` | 向きを右に 90 度回転。 | [features](./features.md) 5.3 |
| 左にまがる | `turnLeft` | 向きを左に 90 度回転。 | [features](./features.md) 5.3 |
| 穴をうめる | `ifHole` | 前方に穴があれば埋める。無ければ何もしない（no-op）。 | [features](./features.md) 5.3 |
| ループ | `loop` | 内側のコマンド群を繰り返す構造。開始・終了の対で構成（下記）。 | [features](./features.md) 5.3 |
| ループ開始 | `loopStart` | 新しいループの構築を開始。回数（**2〜10**）を入力。 | [features](./features.md) 5.3 |
| ループ終了 | `loopEnd` | 構築中の一番内側のループを完了。 | [features](./features.md) 5.3 |
| ネスト | nest | ループの中にループを入れた入れ子構造。**多重ネスト可**。 | [features](./features.md) 5.3 |
| 構築モード | building | `loopStart` 後、コマンドがループ内に追加される状態。スタックで管理。 | [features](./features.md) 5.3 |

---

## 5. QR・AR

| 日本語名 | 識別子 | 定義 | 関連 |
| --- | --- | --- | --- |
| QR カード | QR card | コマンドに対応する物理カード。カメラで読み取り命令を作る。 | [requirements](./requirements.md) 2.2 |
| QR 共有 | QR share | 迷路を QR で受け渡す機能。**1 迷路 = 1 QR**。 | [features](./features.md) 3.5 |
| エクスポート | export | 迷路を QR に変換して表示すること。 | [features](./features.md) 3.5 |
| インポート | import | QR を読み取って迷路を取り込むこと（未分類に追加・再採番）。 | [db-design](./db-design.md) 8 |
| AR | AR | カメラ映像を背景に 3D 迷路・ロボットを重ねて表示する方式。 | [architecture](./architecture.md) 6.1 |
| 重畳 | overlay | カメラ映像の上に 3D・UI を重ねること。 | [architecture](./architecture.md) 6.1 |

---

## 6. アーキテクチャ（FSD）

| 日本語名 | 識別子 | 定義 | 関連 |
| --- | --- | --- | --- |
| FSD | Feature-Sliced Design | 採用するアーキテクチャ。レイヤーを上位→下位の一方向に依存させる。 | [architecture](./architecture.md) 3 |
| レイヤー | layer | `app` → `pages` → `widgets` → `features` → `entities` → `shared` の階層。 | [architecture](./architecture.md) 3.1 |
| スライス | slice | レイヤー内の機能単位ディレクトリ（例 `features/maze-simulation`）。同一レイヤー内の直接参照は禁止。 | [directory-structure](./directory-structure.md) 2 |
| セグメント | segment | スライス内の区分。`ui` / `model` / `lib` /（任意）`api`。 | [directory-structure](./directory-structure.md) 2.1 |
| Public API | — | スライス直下の `index.ts`。他スライスからの import はここ経由のみ。 | [directory-structure](./directory-structure.md) 2.2 |
| エンティティ | entity | ドメインの中核オブジェクト（`maze` / `robot` / `command` / `folder`）。相互参照しない。 | [directory-structure](./directory-structure.md) 4.5 |
| フィーチャー | feature | ユーザー価値を生む機能単位（`maze-edit` / `command-management` / `maze-simulation` 等）。 | [directory-structure](./directory-structure.md) 4.4 |
| ウィジェット | widget | 複数 feature/entity を束ねた画面ブロック。`maze-library` / `maze-editor` / `ar-stage` / `command-panel`。 | [directory-structure](./directory-structure.md) 4.3 |
| 迷路実行エンジン | `maze-simulation` | コマンドを解釈しロボットを動かし成功/失敗を判定する feature。AR 実行フローの XState を持つ。 | [architecture](./architecture.md) 4.2 |

---

## 7. 技術スタック

| 日本語名／用語 | 識別子 | 定義 | 関連 |
| --- | --- | --- | --- |
| TanStack DB | TanStack DB | 永続データへのリアクティブアクセス層。Provider 不要。 | [architecture](./architecture.md) 2 |
| コレクション | collection | TanStack DB の正規化キャッシュ。`shared/db` でモジュールレベルのシングルトンとして定義。 | [db-design](./db-design.md) 5 |
| ライブクエリ | `useLiveQuery` | コレクションを直接購読し、変更で自動再描画する Hook。 | [db-design](./db-design.md) 5 |
| IndexedDB | IndexedDB | ブラウザ／WebView 内のローカル DB。迷路・フォルダを永続化。 | [db-design](./db-design.md) 6 |
| Zod | Zod | スキーマ定義・バリデーションライブラリ。永続データ・QR・入力を検証。 | [db-design](./db-design.md) 4 |
| qr-scanner | qr-scanner | QR デコードライブラリ（jsQR を Web Worker でラップ）。`shared/qr` の内部実装。 | [architecture](./architecture.md) 2 |
| Tauri | Tauri | デスクトップ配布のためのフレームワーク（WebView ベース）。 | [architecture](./architecture.md) 7 |
| WebView | WebView | Tauri が用いる OS 組み込みのブラウザエンジン（Windows = WebView2）。 | [architecture](./architecture.md) 7.2 |
| R3F | React Three Fiber | Three.js の React バインディング。3D/AR 描画に使用。 | [architecture](./architecture.md) 6.2 |
| Zustand | Zustand | 既定の状態管理（揮発状態）。 | [architecture](./architecture.md) 5.2 |
| XState | XState | 明示的ステートマシン。**AR 実行フローのみ**に適用。 | [architecture](./architecture.md) 5.2 |
| Vite+ | vp | dev/build・lint/format・型チェック・テスト・パッケージングの統合 CLI。 | [CLAUDE.md](../CLAUDE.md) |
| mise | mise | ランタイム固定とタスク実行の入口。 | [CLAUDE.md](../CLAUDE.md) |
| pnpm | pnpm | パッケージマネージャー（依存解決）。 | [CLAUDE.md](../CLAUDE.md) |

---

## 8. 関連ドキュメント

- [requirements.md](./requirements.md) — 要件定義
- [features.md](./features.md) — 機能仕様
- [architecture.md](./architecture.md) — アーキテクチャ設計
- [directory-structure.md](./directory-structure.md) — ディレクトリ構成
- [db-design.md](./db-design.md) — DB 設計
- [CLAUDE.md](../CLAUDE.md) — リポジトリ運用指針

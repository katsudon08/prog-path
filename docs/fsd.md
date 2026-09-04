## このドキュメントの概要

本リポジトリのディレクトリ構成の規約です。**FSD (Feature-Sliced Design)** を採用しています。

「新しいファイルをどこに置くか」で迷ったら、まず [どこに置くかの判断フロー](#どこに置くかの判断フロー) を開いてください。1分で答えが出るように書いています。

構造の規則のうち機械で判断できるものは Steiger (FSD 公式のリンター) が検査します。
このドキュメントは「なぜその規則なのか」と「機械では判断できない部分」だけを書きます。

規約を変えたい時は Issue を立て、このドキュメントと `steiger.config.ts` を**同じ PR** で変えます。
設定だけを黙って緩めることはしません。

## 対象読者

数ヶ月後にこのリポジトリの構成をすっかり忘れてしまった自分を含めて、開発に参画するエンジニアです。
FSD を知らなくても読めるように、次の節に用語集を置いています。

## 用語集

以降の節は、この8語だけで書いています。

| 用語 | 意味 | このリポジトリでの例 |
| --- | --- | --- |
| **層 (layer)** | `src/` 直下の6つのフォルダ。上から `app / pages / widgets / features / entities / shared`。**上の層だけが下の層を import できる** | `src/entities/` |
| **slice** | 層の中を「業務の意味」で切ったフォルダ。`app` と `shared` には slice が無い | `src/entities/maze/`、`src/pages/home/` |
| **segment** | slice の中を「役割」で切ったフォルダ。`ui / model / lib / config` の4つだけ使う | `src/entities/maze/ui/` |
| **Public API** | slice 直下の `index.ts` (slice の無い `shared` では segment 直下)。**外からは index.ts に書いたものだけ import できる** | `src/entities/maze/index.ts` |
| **エイリアス** | `@/` で始まる import パス。`@/` は `src/` を指す | `import { MazeData } from "@/entities/maze"` |
| **昇格** | `pages` の中に置いていたコードを、2つ目の利用者が現れた時に `entities / features / widgets` の slice として独立させること | `pages/ar/ui/robot/` → `entities/robot/` |
| **legacy** | `src/legacy/` にある Next.js 時代のコード。**読むだけで直さない。** 画面を作り直すごとに消えていく | `src/legacy/pages/home/` |
| **Steiger** | FSD 公式のリンター。上の規則を `pnpm run lint:fsd` で検査する | `steiger.config.ts` |

## なぜ FSD か

このアプリは「**1つの迷路データを、一覧・編集・AR 実行の3つの画面で表現する**」構造です。
機能ごとに独立していないので、機能単位でコードを丸ごと抱える構成 (例: Bulletproof React の `features/`) では、
迷路の型・検証・表示が各機能に散ります。
FSD は「もの (entities)」と「画面 (pages)」を分けるので、迷路の知識を `entities/maze/` の1箇所に集められます。

Next.js 版も FSD の6層で書かれていました。
ただし規則の判断が人に任されていたため、shared がドメインを知る・features 同士が import する、といった破れが起きました。
今回は Steiger に機械検査させ、人が判断する部分だけをこのドキュメントに絞ります。

6層をそのまま使うのは、旧コードと同じ語彙で読み替えの学習コストが無いからです。

## 層と依存の向き

上の層は下の層を import できます。
**下から上は import できません。同じ層の別 slice も import できません** (pages 同士、features 同士など)。
この2つは Steiger の `fsd/forbidden-imports` が検査します。

```text
app       配線。ルーター・レイアウト・グローバル CSS。全部知っているが業務 UI は持たない
  ↓ import できる
pages     1画面。URL・遷移・レイアウト・その画面だけの状態。画面を知っている
  ↓
widgets   画面の一区画。複数の entities / features を束ねる。2画面で使うものだけ
  ↓
features  ユーザーの操作 (動詞)。entities を変更する1操作 + そのダイアログ。2画面で使うものだけ
  ↓
entities  業務上の「もの」(名詞)。型・store・永続化・検証・その表示。どの画面かは知らない
  ↓
shared    部品と道具。迷路・ロボット・命令という言葉が出てこない
```

覚え方は、**下から上へ「知っていること」が増える**です。shared は何も知らず、app は全部知っています。

### 各層にこのアプリでは何を置くか

| 層 | 名詞 / 動詞 | 画面を知っているか | 具体例 |
| --- | --- | --- | --- |
| `shared` | 名詞 (部品・道具) | 知らない。ドメインの言葉も出ない | `shared/ui`: Button・Dialog・FloatingActionButton・toast / `shared/lib/storage`: 型付き localStorage / `shared/lib/qr-scanner`: カメラで QR を読み「文字列」を返すフック |
| `entities` | 名詞 (業務上のもの) | 知らない。表示はするが「押したら何が起きるか」は props で外から受け取る | `entities/maze/model`: `MazeData` `TileType` 型・`MIN_GRID_SIZE` 等の定数・`useMazeStore` / `entities/maze/lib`: `validateMaze`・`findStartPosition`・永続化・QR 符号化 / `entities/maze/ui`: 2D プレビュー・3D タイル描画 / **1画面目を作り直している間は0個が正常** (2つ目の画面が同じものを使い始めた時に pages から昇格させる) |
| `features` | 動詞 (ユーザーの操作) | 知らない | 「QR で迷路を取り込む」(ホームと AR の両方で取り込むようになったら) / 「迷路を削除する」確認ダイアログ (ホームと編集の両方に削除が付いたら) / **作り直しの初期状態では0個が正常** |
| `widgets` | 名詞 (画面の一区画) | 知らない (URL 遷移は pages に任せる) | フォルダツリー + 迷路一覧のブロック (編集画面にも一覧が生えたら) / ロボット付き 3D 迷路ビュー (ホームに 3D プレビューが生えたら) / **初期状態では0個が正常** |
| `pages` | 名詞 (1画面) | **知っている** | `pages/home`: フォルダ + カード一覧・右側プレビュー・FAB・ダイアログの開閉 / `pages/editor`: グリッド編集ボード・保存 / 削除・「新規か既存か」の判定 / `pages/ar`: 3D ビュー・命令スタック・実行エンジン・結果表示 |
| `app` | — (配線) | 全部知っている | `app/routes`: TanStack Router のルート定義・URL → props のアダプタ・Shell / `app/styles`: `globals.css` / 将来 Navbar を作り直す時は `app/layouts` |

## slice と segment の書き方

### slice の名前

- kebab-case。`entities` は**名詞・単数** (`maze` `robot` `folder`)。`features` は**動詞-名詞** (`import-maze-by-qr`)。`widgets` / `pages` は名詞 (`home` `editor`)
- `ui` `lib` `model` のような segment 名を slice 名に使わない (`fsd/ambiguous-slice-names`)

### segment は4つだけ

| segment | 置くもの | 迷ったら |
| --- | --- | --- |
| `ui` | React コンポーネント | JSX を返すなら ui |
| `model` | 型・store・状態の変化を扱うロジック | 「状態と型」は model |
| `lib` | それ以外の関数・フック (変換・検証・永続化) | 「関数」は lib |
| `config` | 定数・設定値 | 値しか無いなら config。少なければ model に置いてよい |

`api` は使いません (バックエンドが無いため)。
`components` `hooks` `utils` `types` のような「種類」の名前は禁止です (`fsd/segments-by-purpose`)。

`app` は slice が無いので、この4つには縛られません。
`routes` (ルート定義・URL → props のアダプタ)、`styles` (グローバル CSS)、
`layouts` (全画面共通の外枠) を役割の名前として使います。
`segments-by-purpose` が弾くのは「種類」の名前だけなので、この3つは通ります。

### Public API は index.ts の1枚

- slice 直下に `index.ts` を置き、**外に見せるものだけ** export する (`fsd/public-api`)
- 外から slice の中身を直接 import しない (`fsd/no-public-api-sidestep`)。必要なものが index に無ければ index に足す
- `shared` と `app` は slice が無いので、**segment 直下**の `index.ts` が Public API。`@/shared/ui` `@/shared/lib` のように segment 単位で import する

### import の書き方

| どこから | 書き方 | 例 |
| --- | --- | --- |
| 同じ slice の中 | **相対パス** | `import { useMazeStore } from "../model/store"` |
| 別の slice・別の層 | **エイリアス + Public API** | `import { MazePreview2D } from "@/entities/maze"` |
| `shared` / `app` の中 (slice が無い層) | **相対パス** (層全体を1つの slice とみなす) | `shared/ui/button.tsx` から `import { cn } from "../lib"` |

この使い分けは Steiger の `fsd/import-locality` が検査します (推奨設定では off なので、このリポジトリで on にしています)。
`shared` の中から `@/shared/lib` と書くと「相対で書け」と弾かれます。

### slice の例

```text
src/entities/maze/
  index.ts            ← Public API。外に見せるものだけ
  model/
    types.ts          ← MazeData, TileType
    store.ts          ← useMazeStore
  lib/
    validate.ts       ← validateMaze
    storage.ts        ← load / save (@/shared/lib の storage を使う)
    qr.ts             ← encode / decode
  ui/
    MazePreview2D.tsx
    MazeMap3D.tsx
```

## エイリアス

エイリアスは `@/*` → `src/*` の**1つだけ**です。
`tsconfig.json` の `paths` に定義し、Vite は `vite-tsconfig-paths` で同じ定義を読みます。

| 書き方 | 指す先 | 状態 |
| --- | --- | --- |
| `@/entities/maze` | `src/entities/maze` | 正 |
| `@/legacy/pages/home` | `src/legacy/pages/home` | legacy のみ。`app/routes` からの橋渡しにだけ使う |
| `@/src/...` | 存在しない | 誤。Next.js 時代の記法。`tsc` と Vite が解決できずに落ちる |

## どこに置くかの判断フロー

上から順に Yes / No で答えます。**「予定」は数えません。今この瞬間のコードだけで判断します。**

```text
Q1. 既にある slice (例: entities/maze) に中身を足すだけか？
    Yes → その slice の segment (ui / model / lib) に置く。外に見せるなら index.ts に追記。終わり
    No  → Q2

Q2. 迷路・タイル・ロボット・命令・フォルダ、または特定の画面の言葉が1つでも出てくるか？
    No  → shared。見た目なら shared/ui、関数・フックなら shared/lib、層をまたぐ型なら shared/model。終わり
    Yes → Q3

Q3. URL・画面遷移・画面レイアウト・「この画面でだけ」使う状態を扱うか？
    Yes → 1画面のものは pages/<画面>/。全画面に共通の枠 (ナビゲーション・ルート定義・
          グローバル CSS) なら app/{routes,layouts,styles}。終わり
    No  → Q4

Q4. それを使う slice は、今この瞬間に2つ以上あるか？ (app から使うなら Yes でよい)
    No  → 使う画面の pages/<画面>/{ui,model,lib} に置く。終わり
          (Steiger の insignificant-slice が1参照の slice を弾く。→「slice を切る条件と昇格ルール」の節)
    Yes → Q5

Q5. それは「もの」か「操作」か、複数を束ねた「画面の一区画」か？
    もの (型・store・永続化・検証・その表示)     → entities/<名詞>/。終わり
    操作 (ユーザーが押して entity が変わる)      → Q6
    一区画 (複数の entities / features を束ねる) → Q7

Q6. その操作は、別の features を import しないと書けないか？
    Yes → 2つを1つの features に合流させる。または共通部分を entities に下ろす
          (features 同士の import は forbidden-imports)
    No  → features/<動詞-名詞>/。終わり

Q7. 複数の entities / features を束ねた「画面の一区画」で、2つ目の画面でも同じ塊が要るか？
    Yes → widgets/<名詞>/
    No  → pages に留める。凝集はフォルダ分けで保つ (pages/ar/ui/robot/ など)
```

### Steiger が弾くもの / 人が判断するもの

| 判断 | 誰が | 根拠 |
| --- | --- | --- |
| 下の層から上の層、同じ層の別 slice を import した | Steiger | `forbidden-imports` |
| index.ts を通さず中身を import した | Steiger | `no-public-api-sidestep` |
| slice 内を `@/` で、slice 外を相対で書いた | Steiger | `import-locality` |
| 0参照・1参照の slice がある | Steiger | `insignificant-slice` |
| **entities か features か** (名詞か動詞か) | 人 | Q5 |
| **shared が画面やドメインを知っていないか** (Navbar のパス表など) | 人 | Q2。Steiger は import の向きしか見ない |
| **localStorage のキーを entities の lib の外で触っていないか** | 人 | レビュー |
| 新しい slice から legacy を import した | ESLint | `no-restricted-imports` (legacy の節)。Steiger は legacy を見ないので ESLint が担当する |

## slice を切る条件と昇格ルール

slice (`entities / features / widgets`) を作る条件は1つだけです。

> **2つ以上の slice (または app) から使われること。**
> 使う画面が1つしかないものは、その画面の `pages/<画面>/` の中に置きます。

先に予測して slice を作りません。「いつか他の画面でも使うはず」は数えません。
Steiger の `fsd/insignificant-slice` が、参照元が0か1の slice を error にします
(`pages` は対象外、`app` からだけ使われる slice は免除)。

### 1画面専用のものは pages の中でフォルダ分けする

```text
src/pages/ar/
  index.ts
  ui/
    ARPage.tsx
    robot/            ← 凝集した塊はフォルダで分ける。slice にはしない
      RobotModel.tsx
    command-stack/
  model/
    robot.ts
    simulation.ts
  lib/
    command-tree.ts
```

### 昇格の手順 (2つ目の利用者が現れた時)

1. `src/entities/robot/` のように slice のフォルダを作り、segment ごとにファイルを移す
2. `index.ts` を書き、外に見せるものだけ export する
3. 元の page の import を相対から `@/entities/robot` に直す
4. `pnpm run lint:fsd` と `pnpm run typecheck` を通す

widgets も同じ条件です。
「1画面の中で大きな塊になった」だけでは widgets にしません。
2つ目の画面が同じ塊を必要とした時に切り出します。

## 検査ツールの分担と実行方法

| 何を見るか | ツール | コマンド | いつ走るか |
| --- | --- | --- | --- |
| 整形 | Prettier | `pnpm run format <対象>` | コミット前 / CI |
| 記法・品質 (コメント長も) | ESLint | `pnpm run lint <対象>` | コミット前 / CI |
| 型 | TypeScript | `pnpm run typecheck` | プッシュ前 / CI |
| **FSD の構造** | **Steiger** | `pnpm run lint:fsd` | プッシュ前 / CI |

手元でまとめて走らせるなら `pnpm check` です (整形・記法・型・FSD の構造の4つを順に叩きます)。
詳しい設定は [CI設定のドキュメント](ci.md) を参照してください。

Steiger をコミット前ではなくプッシュ前に置くのは、型チェックと同じ理由です。
`src/` 全体を走査するので時間がかかり、
作業途中のコミットで構造が未完成 (slice の `index.ts` を後で書く等) なのは正常な状態だからです。

### 被ったら Steiger を優先する

import の書き方に関するルールが ESLint と Steiger で被った場合は、**Steiger 側を残し ESLint 側を削除**します。
例として ESLint の `import/no-relative-parent-imports` は「slice 内は相対 import」と衝突するため削除し、
Steiger の `import-locality` に任せました。

例外は legacy への import の禁止です。
Steiger は `src/legacy/` を見ないため、これだけは ESLint の `no-restricted-imports` が担当します (legacy の節)。

### 違反が出たときの読み方

Steiger の出力は「ファイル → メッセージ → ルール名」の順です。ルール名で下の表を引いてください。
表に無いルールは [公式のルール一覧](https://github.com/feature-sliced/steiger/tree/master/packages/steiger-plugin-fsd) を見て、
当たったらこの表に行を足します。

| ルール | 何を弾くか | 直し方 |
| --- | --- | --- |
| `forbidden-imports` | 下の層から上の層、同じ層の別 slice を import | 依存の向きを直す。共通部分を下の層へ下ろす |
| `no-public-api-sidestep` | index.ts を通さず中身を import | index.ts から import する。無ければ index.ts に export を足す |
| `public-api` | slice に index.ts が無い | 作る |
| `import-locality` | slice 内を `@/`、slice 外を相対で書いた | 書き方を入れ替える (「slice と segment の書き方」の節) |
| `insignificant-slice` | 参照元が0か1の slice | 0なら消す。1なら使う画面の pages に畳む (「slice を切る条件と昇格ルール」の節) |
| `segments-by-purpose` | `components` `hooks` `utils` `types` 等の種類名の segment | `ui / model / lib / config` に置き直す |
| `no-ui-in-app` | app 層に `ui` segment | `routes` か `layouts` に置き直す |

実際の出力は次のように出ます (導入時に違反を仕込んで確認したもの)。

```text
┌ src/shared/lib/x.ts
✘ Forbidden import from higher layer "entities".
│
└ fsd/forbidden-imports: https://github.com/feature-sliced/steiger/tree/master/packages/steiger-plugin-fsd/src/forbidden-imports

┌ src/entities/robot
✘ This slice has only one reference on layer "shared". Consider moving this code to "shared".
│
└ fsd/insignificant-slice: https://github.com/feature-sliced/steiger/tree/master/packages/steiger-plugin-fsd/src/insignificant-slice

┌ src/pages/tmp
✘ This slice is missing a public API.
✔ Auto-fixable
│
└ fsd/public-api: https://github.com/feature-sliced/steiger/tree/master/packages/steiger-plugin-fsd/src/public-api

┌ src/entities/robot/lib/other.ts
✘ Import from "@/entities/robot/lib/robot" should be relative.
│
└ fsd/import-locality: https://github.com/feature-sliced/steiger/tree/master/packages/steiger-plugin-fsd/src/import-locality

────────────────────────────────────────────────────────
 Found 4 errors (1 can be fixed automatically with --fix)
```

`✔ Auto-fixable` が付いた診断は `--fix` で自動修正できると表示されますが、
このリポジトリでは使いません。`public-api` の自動修正で生えるのは
**中身が空の `index.js`** で (TypeScript ではない)、しかも終了コードが 0 になるため
直ったように見えてしまいます。`index.ts` を自分で書いてください。

違反が1件でもあると終了コードが 1 になるので、プッシュ前と CI が止まります。

## 旧コード (src/legacy/) の扱いと1画面の作り直し手順

### legacy の3つの規則

1. **読むだけで直さない。** Next.js 版がそのまま仕様書です。バグも直さず、作り直しで消します
2. **検査しない。** ESLint と Prettier から `src/legacy/` を除外しています。
   Steiger には除外を書いていません。`legacy` は層名ではないので、層として認識されず走査されません。
   ただし **Tailwind のクラス名の走査からは外しません**。旧画面はまだ配信されているので、
   外すとスタイルが消えます (`src/app/styles/globals.css` の `source("../../")`)
3. **新しい slice から import しない。** `@/legacy/...` を書けるのは `src/app/routes/` だけです (旧画面と新画面をルーターで切り替えるための橋渡し)。Steiger は legacy を見ないので、ESLint の `no-restricted-imports` が止めます

3つ目はエイリアス (`@/legacy/...`) だけでなく相対パス (`../../legacy/...`) も止めます。
書き方を変えれば抜けられる、という状態にしないためです。
触ると次のように出ます (導入時に違反を仕込んで確認したもの)。

```text
src/pages/tmp/ui/TmpPage.tsx
  1:1  error  '@/legacy/pages/home' import is restricted from being used by a pattern. src/legacy は移行元の旧コードです。新コードからは参照せず、必要な処理は FSD の層へ移してから使ってください。  no-restricted-imports

✖ 1 problem (1 error, 0 warnings)
```

### 1画面の作り直し手順

1. 画面の Issue を立てる。何を作るかは `src/legacy/pages/<画面>` を読んで決める
2. `src/pages/<画面>/` を新しく作る。legacy には触らない。`entities` / `shared` に置くものは「どこに置くかの判断フロー」の節で決める
3. `src/app/routes/router.tsx` の該当ルートの import を `@/legacy/pages/<画面>` から `@/pages/<画面>` に切り替える
4. `pnpm check` `pnpm run build` を通し、`pnpm dev` で画面を確認する
5. legacy から不要になったファイルを消す (他の旧画面がまだ使うものは残す)
6. 全画面が終わったら `src/legacy/` を消し、ESLint (除外行と `no-restricted-imports` の2ブロック) と Prettier の除外を消す

## このドキュメントの概要

このドキュメントは本リポジトリにおいて設定するCI項目について詳述するドキュメントです。
**コミット前** / **プッシュ前** / **GitHub Actions**の3フェーズに分かれており、各領域について記載しています。

## 対象読者

CIで何が走るのかを把握したいエンジニアです。
また、CIだけでなく、コミット前とプッシュ前に走るものについても記載しているので、それについても参照が可能です。

## 検査対象の範囲

`src/legacy/` と `main.js` は移行にともない破棄する予定のため、フォーマットとLintの対象から除外しています。
`src/legacy/`はNext.js版の旧コードで、画面を1つずつ作り直すたびに減っていきます。
それ以外の`src/`配下 (`src/main.tsx` / `src/app/`) は今後も触り続ける新しいコードなので、すべて検査の対象です。

除外を書く場所は`.prettierignore`の`/src/legacy/`と`eslint.config.mjs`の`src/legacy/**`の2箇所です。
Steiger には除外を書いていません。`legacy`はFSDの層名ではないため、層として認識されず中身が走査されないからです。
移行が終わって`src/legacy/`が消えたら、この2箇所も一緒に消します。

旧コードの位置づけと作り直しの手順は[ディレクトリ構成のドキュメント](fsd.md)を参照してください。

### PrettierとESLintで除外リストが揃っていない理由

2つのツールで除外リストの役割が正反対だからです。

| | Prettier | ESLint |
| --- | --- | --- |
| 対象の決め方 | **まず全部やる**→除外リストで削る (引き算) | **configが`files`で宣言した拡張子だけ** (足し算) |
| 実際の対象 | `format:check .`がツリー全体を歩き、`--ignore-unknown`でパーサの無いものだけ飛ばす | 既定の`**/*.js` `**/*.mjs` `**/*.cjs`と、typescript-eslintが足す`**/*.ts` `**/*.tsx` `**/*.mts` `**/*.cts` |
| 除外リストに書くもの | やらないものを全部 (`public/`や`*.md`やロックファイルまで) | JS/TSのうち外したいものだけ |

## コミット前

### 使用技術

`lefthook`を使用しています。
Goで書かれているため高速で、Gitフックをより簡単にします。
フックの設置は`pnpm install`時に`prepare`が行います。
各人が手で`lefthook install`を叩く必要がなくなるためです。

参考記事：[Git フック管理ツール「Lefthook」の紹介](https://zenn.dev/sukesan0720/articles/87a8c005f82522)

### チェック項目

| 項目 | ツール | 実行されるコマンド |
| --- | --- | --- |
| フォーマット | Prettier | `pnpm run format <対象>` |
| 文法・コーディング規約 (コメントも含む) | ESLint | `pnpm run lint:fix <対象>` |
| ユニットテスト | 未定 | なし |
| コミットメッセージ規約 | commitlint | `pnpm run commitlint` |

参考記事：[commitlint の紹介](https://qiita.com/ybiquitous/items/74225bc4bf0a9ddcd7dd)

## プッシュ前

### 使用技術

**コミット前**と同様に`lefthook`を使う想定です（`pre-push`フック）。

### チェック項目

| 項目 | ツール | 実行されるコマンド |
| --- | --- | --- |
| 型チェック | TypeScript | `pnpm run typecheck` |
| FSD 構造 | Steiger | `pnpm run lint:fsd` |
| インテグレーションテスト | 未定 | なし |

型チェックをコミット前ではなくプッシュ前に置く理由は次の2点です。

- リポジトリ全体を走査するため時間がかかる (引数を渡してしまうと`tsconfig`を無視する)
- **作業途中のコミットで型が通らないのは正常な状態**であり、そこで止めると作業の邪魔になる

FSD構造の検査 (Steiger) も同じ理由でプッシュ前に置いています。
`src/`全体を走査するうえ、**作業途中で`index.ts`をまだ書いていない、といった未完成な構造も正常な状態**だからです。

## CI

### 使用技術

`GitHub Actions`を用いてリポジトリにイベントが発生した際に、あらかじめ定義してワークフローを実行します。
イベントの種類としては多様ですが、今回のメインターゲットは**PR作成**のタイミングです。
また、CIのチェック項目はコミット前やプッシュ前にもチェックした項目を含めて包括的に行います。

参考記事：[(CI/CD)Github Workflows を使ってCI自動テストを作成](https://zenn.dev/hyoni/articles/d53a4c57979e7d)

### 実行タイミング

ワークフローは`.github/workflows/ci.yml`に定義しています。

| イベント | 対象 |
| --- | --- |
| PRの作成・更新 | すべてのブランチ |
| push | `main`のみ |

`main`へのpushも監視するのは、`--no-verify`でフックを外して入った変更を拾うためです。
また同じブランチへ連続でpushした場合は、古い実行を打ち切ります (`concurrency`)。

### 実行環境の固定

CIとローカルで結果が食い違わないように、ツールのバージョンを固定しています。

| 対象 | 固定する場所 | CIでの読み取り方 | ローカルでの読み取り方 |
| --- | --- | --- | --- |
| Node | `.node-version` (動作範囲は`package.json`の`engines`) | `actions/setup-node`の`node-version-file` | fnm (`--use-on-cd`でcd時に切り替え) |
| pnpm | `package.json`の`packageManager` | `pnpm/action-setup`が自動で読む | corepack (`corepack enable`で有効化) |
| npmパッケージ (Vite / Reactなど) | `pnpm-lock.yaml` | `pnpm install --frozen-lockfile` | `pnpm install` |

`vite`や`react`のようなnpmパッケージは`pnpm-lock.yaml`が依存の依存まで固定しているため、
これとは別にバージョン管理の仕組みを用意する必要はありません。

`--frozen-lockfile`を付ける理由は、`pnpm-lock.yaml`の更新をコミットし忘れたときに、
CIが黙って辻褄を合わせたまま成功してしまうのを防ぐためです。
lockfileと`package.json`が食い違っていれば、インストールの時点で落ちます。

Nodeが揃っていないまま作業が進むのを防ぐため、`pnpm-workspace.yaml`に`engineStrict: true`を置いています。
`engines`が許さないNodeで`pnpm install`を実行すると、依存を入れる前に次のエラーで止まります。

```
 ERR_PNPM_UNSUPPORTED_ENGINE  Unsupported environment (bad pnpm and/or Node.js version)

Your Node version is incompatible with "/path/to/prog-path".

Expected version: 24.x
Got: v22.0.0

This is happening because the package's manifest has an engines.node field specified.
To fix this issue, install the required Node version.
```

1行目が`bad pnpm and/or Node.js version`となっているのは、`engineStrict`が`engines`の`node`と`pnpm`の両方を検査するためで、
どちらが原因かは2行目以降 (この例では`Your Node version is incompatible`) で判別します。

ただし**止まるのはメジャーバージョンが違うときだけ**です。
`engines`の`node`は`24.x`という「動作範囲」なので、24.0.0でも24.14.1でも通ります。
`.node-version`に書いた1つの値まで揃えるのは、それを読むfnmの役目です。
役割を分けているのは、`engines`を1つの値まで狭めるとNodeを上げるたびに`package.json`も直すことになり、
揃える値の置き場が2箇所に増えるためです。

pnpmはcorepackが`packageManager`を読み、書かれたバージョンを用意します。
ただしcorepackは**Node 25から同梱されません**。
Nodeを25以上に上げるときは、pnpmを手元に用意する方法を合わせて決め直す必要があります。

ローカル側の用意の手順は[セットアップ手順のドキュメント](setup.md)を参照してください。

### チェック項目

| 項目 | ツール | 実行されるコマンド |
| --- | --- | --- |
| フォーマット | Prettier | `pnpm run format:check .` |
| 文法・コーディング規約 (コメントも含む) | ESLint | `pnpm run lint .` |
| 型チェック | TypeScript | `pnpm run typecheck` |
| FSD 構造 | Steiger | `pnpm run lint:fsd` |
| ユニットテスト | 未定 | なし |
| インテグレーションテスト | 未定 | なし |
| E2Eテスト | 未定 | なし |
| ビルド | Vite | `pnpm run build` |

### なぜコミット前と重複して検査するのか

ローカルのGitフックは`git commit --no-verify`で外せてしまうためです。

### 検査結果の扱い (ブランチ保護)

検査が通らないPRをマージできないように、`main`へブランチ保護 (Rulesets) をかけています。
設定はリポジトリの Settings > Rules > Rulesets から確認と変更ができます。

| ルール | 内容 |
| --- | --- |
| PRの経由 | `main`への直接pushを禁止する |
| 必要な承認数 | 0 (レビュー体制ができるまでは要求しない) |
| 必須の検査 | CIの`check`ジョブが成功していること |
| 最新化 | `main`が進んだ場合は取り込んでから再検査する |
| force push | 禁止 |
| ブランチの削除 | 禁止 |

直線的な履歴 (linear history) は必須にしていません。
PRのコミットを1つずつ残すため、マージコミット方式を採っているからです。

最新化を必須にしているのは、個別には検査を通ったPRが、
マージ後に組み合わせで壊れるケースを防ぐためです。

なお保護のせいで作業が進められなくなった場合は、Rulesetsを一時的に`Disabled`にして回避します。

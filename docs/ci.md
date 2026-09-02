## このドキュメントの概要

このドキュメントは本リポジトリにおいて設定するCI項目について詳述するドキュメントです。
**コミット前** / **プッシュ前** / **GitHub Actions**の3フェーズに分かれており、各領域について記載しています。

## 対象読者

CIで何が走るのかを把握したいエンジニアです。
また、CIだけでなく、コミット前とプッシュ前に走るものについても記載しているので、それについても参照が可能です。

## 検査対象の範囲

`src/` と `main.js` は移行にともない破棄する予定のため、フォーマットとLintの対象から除外しています。
ただし Vite への移行で新規に追加したファイル (`src/main.tsx` や `src/app/`) も `src/` 配下にあるため、
現状はそれらも除外されたままです。範囲の見直しはディレクトリ構成の確定時に行います。

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
| インテグレーションテスト | 未定 | なし |

型チェックをコミット前ではなくプッシュ前に置く理由は次の2点です。

- リポジトリ全体を走査するため時間がかかる (引数を渡してしまうと`tsconfig`を無視する)
- **作業途中のコミットで型が通らないのは正常な状態**であり、そこで止めると作業の邪魔になる

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

| 対象 | 固定する場所 | CIでの読み取り方 |
| --- | --- | --- |
| Node | `.node-version` (動作範囲は`package.json`の`engines`) | `actions/setup-node`の`node-version-file` |
| pnpm | `package.json`の`packageManager` | `pnpm/action-setup`が自動で読む |
| npmパッケージ (Vite / Reactなど) | `pnpm-lock.yaml` | `pnpm install --frozen-lockfile` |

`vite`や`react`のようなnpmパッケージは`pnpm-lock.yaml`が依存の依存まで固定しているため、
これとは別にバージョン管理の仕組みを用意する必要はありません。

`--frozen-lockfile`を付ける理由は、`pnpm-lock.yaml`の更新をコミットし忘れたときに、
CIが黙って辻褄を合わせたまま成功してしまうのを防ぐためです。
lockfileと`package.json`が食い違っていれば、インストールの時点で落ちます。

### チェック項目

| 項目 | ツール | 実行されるコマンド |
| --- | --- | --- |
| フォーマット | Prettier | `pnpm run format:check .` |
| 文法・コーディング規約 (コメントも含む) | ESLint | `pnpm run lint .` |
| 型チェック | TypeScript | `pnpm run typecheck` |
| ユニットテスト | 未定 | なし |
| インテグレーションテスト | 未定 | なし |
| E2Eテスト | 未定 | なし |
| ビルド | Vite | `pnpm run build` |

### なぜコミット前と重複して検査するのか

ローカルのGitフックは`git commit --no-verify`で外せてしまうためです。

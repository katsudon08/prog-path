## このドキュメントの概要

このドキュメントは本リポジトリで**どこに何のテストを書くか**を決めたものです。

いつ走るのか (コミット前 / プッシュ前 / GitHub Actions) は[CIのドキュメント](ci.md)を参照してください。
このドキュメントは「何を書くか」だけを扱います。

## 対象読者

本リポジトリでテストを書くエンジニアです。

## 使用技術

`Vitest`を使用しています。
`vite.config.ts`の`test`フィールドに設定を書いており、専用の設定ファイルは持ちません。

Jest ではなく Vitest を選んだ理由は次の3点です。

| | 理由 |
| --- | --- |
| エイリアス | `vite.config.ts`の設定をそのまま使うため、`tsconfig.json`の`paths`が単一の正であり続ける |
| ESM | `package.json`が`"type": "module"`のため。Vitest は ESM ネイティブで動く |
| TypeScript | Vite が変換するため、`ts-jest`のような追加の変換設定が要らない |

## どこに書くか

| 対象 | 書く |
| --- | :--: |
| `entities` / `features` / `shared` の `lib`・`model` | ○ |
| `widgets` / `pages` / `app` | × |
| `ui`セグメント | × |
| `config`セグメント | × |
| `src/legacy/` | × |

対象は`vite.config.ts`の`test.include`が決めています。

```ts
include: ["src/{entities,features,shared}/**/*.test.ts"],
```

除外リストではなく**ホワイトリスト**にしているのは、除外方式だと新しいレイヤが増えたときに素通りしてしまうためです。

### 判断基準は「振る舞いを持つものだけ」

- **書く**: 入力に対して出力が決まる関数、状態が遷移するもの
- **書かない**: 型、定数、データ

型や定数にテストを書いても「書いた通りに書いてある」ことを確認するだけで、負債が増えるだけです。

## ファイルの置き場所

**実装ファイルの隣**に置きます。

```
src/entities/maze/lib/
├── sort-folders.ts
└── sort-folders.test.ts
```

`__tests__`のようなディレクトリに隔離はしません。

## 書き方

`describe` / `it` / `expect`は**明示的に import** します。

```ts
import { describe, expect, it } from "vitest";
```

テストの文言は**日本語**で書きます。

```ts
describe("sortFolders", () => {
  it("チュートリアルを先頭、マイ迷路を末尾に並べる", () => {
```

## 実行方法

| コマンド | 中身 | 使う場面 |
| --- | --- | --- |
| `pnpm run test` | 単発実行 | プッシュ前とCIが自動で実行 |
| `pnpm run test:watch` | 監視モード | 開発中に手で実行する |

監視モードはファイルの変更を検知して自動で走り続けます。
プロセスが終わらないため、フックやCIからは呼びません。

## カバレッジ

現時点では取得していません。
テストのカバー範囲を実際に調べる必要が出てきた時点で、`@vitest/coverage-v8`の導入を検討します。

## このドキュメントの概要

本リポジトリが採用しているディレクトリアーキテクチャ **FSD (Feature-Sliced Design)** と、
その検査に使うリンター **Steiger** について、公式ドキュメントから要点を引用してまとめたものです。

規則の詳細は公式ドキュメントと `steiger.config.ts` が正です。ここでは全体像だけを扱います。

## 対象読者

本リポジトリの開発に参加するエンジニアです。FSD を初めて触る人を想定しています。

## FSD について

> Feature-Sliced Design (FSD) is an architectural methodology for scaffolding front-end applications.
> Simply put, it's a compilation of rules and conventions on organizing code.

(フロントエンドアプリの土台を組み立てるためのアーキテクチャ手法。ひとことで言えば、コードの並べ方についての規則と慣習をまとめたもの)

コードは **層 (layers) → スライス (slices) → セグメント (segments)** の3階層で分けます。

- **層**: `src/` 直下のフォルダ。上から `app / pages / widgets / features / entities / shared`
  > modules on one layer can only know about and import from modules from the layers strictly below

  (ある層のモジュールは、自分より厳密に下の層しか知ることも import することもできない)
- **スライス**: 層の中を業務ドメインで分けたフォルダ (例: `entities/maze`)。同じ層の別スライスは import できない
- **セグメント**: スライスの中を目的で分けたフォルダ。`ui` (UI とスタイル) / `api` (バックエンドとのやり取り) / `model` (データ構造と業務ロジック) / `lib` (共通のライブラリコード) / `config` (設定値)

公式が挙げる利点は次の4つです。

| 利点 | 公式の説明 |
| --- | --- |
| Uniformity | 構成が標準化されるので、プロジェクトが統一され、新しいメンバーの参加が楽になる |
| Stability in face of changes and refactoring | ある層のモジュールは同じ層や上の層を使えないため、他への影響を気にせず局所的に手を入れられる |
| Controlled reuse of logic | 層によって「再利用しやすさ」と「局所性」を選べる。DRY と実用性のバランスを取れる |
| Orientation to business and users needs | アプリを業務ドメインで分け、命名にも業務の言葉を使う。無関係な部分を理解しなくても仕事ができる |

参照: [Feature-Sliced Design — Overview](https://feature-sliced.design/docs/get-started/overview)

## Steiger について

FSD の構造を検査するリンターです。本リポジトリでは `pnpm run lint:fsd` (`steiger ./src`) で実行します。

> Universal file structure and project architecture linter.

(ファイル構成とプロジェクトアーキテクチャのための汎用リンター)

公式が挙げる特徴は次の3つです。

- Built-in set of rules to validate adherence to Feature-Sliced Design (FSD に沿っているかを検査する組み込みルール群)
- Watch mode (監視モード)
- Rule configurability (ルールの設定変更)

設定は `steiger.config.ts` に書きます。設定ファイルの形は ESLint に強く影響を受けているので、
ESLint を設定したことがあれば同じ感覚で読めます。

参照: [feature-sliced/steiger](https://github.com/feature-sliced/steiger)

### ESLint とルールが被ったら Steiger を優先する

import の書き方など、ESLint と Steiger で同じことを見るルールが被った場合は、
**Steiger 側を残して ESLint 側を削除**します。

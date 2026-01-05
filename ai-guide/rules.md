# 開発ルール (Core Development Rules)

AIエージェントは、実装およびリファクタリング時に以下のルールを優先度順に遵守すること。

## 1. ディレクトリ構造と型定義 (Architecture & Types)
- **ディレクトリ構成の遵守**: `architecture.md` に定義された構造を厳守すること。
- **型定義の集約 (新規)**: 型定義（interface, type）は必ず各機能ディレクトリの下に `types` ディレクトリを作成して切り出し、そこから export して使用すること。
- **配置制限**: 機能ディレクトリの下には、定められたディレクトリ（ui, hooks, lib, store, constants, types）とバレルファイル（index.ts）以外のファイルやディレクトリを配置してはいけない。

## 2. カプセル化と依存関係 (Encapsulation)
- **バレルファイル (index.ts) の徹底**:
  - ディレクトリ外部のモジュールを参照する際は、必ず `index.ts` を経由すること。
  - 外部公開が必要なコンポーネント、関数、型のみを `index.ts` で export し、内部用ヘルパー等はカプセル化を維持すること。
- **循環参照の禁止**: バレルファイル同士の相互参照による循環参照（Circular Dependency）を厳防すること。
- **依存の方向**: 依存関係は `domains` -> `機能` のように、常に上位から下位への一方向とすること。

## 3. コンポーネント設計原則 (Component Design)
- **SOLID原則 & SRP**: 1ファイル1責務を徹底し、1ファイルが100行を超えた場合は分割を検討すること。
- **Atomic Design**: `ui` ディレクトリ内は `Atoms`, `Molecules`, `Organisms` の3層のみで構成すること。
- **Atomsの責務**: 完全にステートレス、またはUI状態のみを管理し、ドメイン知識（API通信等）を含めないこと。
- **ロジックの分離**: 複雑な状態管理やUIに関わらないロジックは、必ず `Custom Hooks` または `zustand` (store) へ抽出すること。

## 4. 命名規則・App Router (Naming & routing)
- **イベントハンドリング**: Props名は `on[Event]`（例: `onClick`）、受け取る関数名は `handle[Event]`（例: `handleClick`）を徹底すること。
- **Page構成**: `app/` 直下の `page.tsx` は以下の例のように、各ドメインの `Page.tsx` を default export するだけの記述とすること。
  ```tsx
  export { HomePage as default } from "@domains/home"
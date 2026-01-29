---
trigger: always_on
---

# 02-coding.md: コーディング規約

## 概要

ProgPath におけるコードの品質、保守性、および実行パフォーマンスを維持するための規約です。エージェントはコード生成の際、以下のルールを厳守してください。

### 1. 命名規則

| 対象 | 形式 | 例 |
| --- | --- | --- |
| **ファイル / ディレクトリ** | `kebab-case` | `robot-model.tsx`, `use-maze-state.ts` |
| **コンポーネント / クラス** | `PascalCase` | `RobotController`, `MazeGrid` |
| **変数 / 関数 / インスタンス** | `camelCase` | `robotPosition`, `calculateDistance()` |
| **型 (Type) / インターフェース** | `PascalCase` | `RobotConfig`, `MazeCellProps` |
| **定数 (Const)** | `UPPER_SNAKE_CASE` | `MAX_GRID_SIZE`, `DEFAULT_SPEED` |

- **Hookの名前**: 必ず `use` で始め、`use-maze-state.ts` のようにファイル名も kebab-case にします。

### 2. TypeScript 運用ルール

- **`any` の禁止**: 原則禁止。`unknown` を使用し、型ガード（`is` 演算子等）で対応してください。
- **インターフェース vs 型定義**:
  - オブジェクトの形状定義（拡張を想定するもの）: `interface`
  - ユニオン型、交差型、プリミティブの別名: `type`
- **関数の型**: 引数と戻り値の型を明示してください。
- **非同期処理**: `Promise` を返す関数は `async/await` を用い、必ず `try-catch` によるエラーハンドリングを含めてください。

### 3. React / Next.js コンポーネント

- **定義方式**: `const` を用いたアロー関数で定義。
- **Props**: 引数でのデストラクチャリングとデフォルト値の設定を推奨。
- **ロジックの分離**: 
  - 複雑な計算や状態操作はカスタム Hook に抽出。
  - **View と Logic の分離**: UIコンポーネントは `shared/ui` の部品を組み合わせることに集中し、ビジネスロジックを直接記述しない。

### 4. Three.js (React Three Fiber) 最適化ルール

- **useFrame の活用**: ロボットの移動など、高頻度な更新は `state` ではなく `ref.current.position` を `useFrame` 内で直接操作してください（React の再レンダリングを避けるため）。
- **リソース管理**: 
  - `useLoader` や `useGLTF` を使用してアセットをキャッシュ。
  - コンポーネント削除時にジオメトリ/マテリアルを自動破棄（R3Fの基本機能）を妨げない設計にする。
- **イミュータブルな操作**: ベクトル演算で副作用を避ける場合は `.clone()` を使用。逆に、`useFrame` 内のパフォーマンス優先箇所では、あらかじめ定義した一時変数（`dummyVector` 等）を再利用して GC を抑制してください。

### 5. コメントと教育的配慮

- **JSDoc**: 公開関数には引数と戻り値の説明を記述。
- **数式の解説**: 3D座標変換（例：行列計算やクォータニオン）を行う箇所には、その数学的意図をコメントで残してください。

---

**エージェントへの指示**:
規約違反（特に `any` の使用や、`useFrame` 内での不適切な `setState`）を発見した場合は、修正案を提示してください。
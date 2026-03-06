# コーディング規約（Coding Style Guidelines）

コードの一貫性を保ち、チーム全体での可読性と保守性を高めるためのルールです。このプロジェクトでは自動フォーマッター（Prettier）およびリンター（ESLint）を使用し、ルールの一部を機械的に強制します。

## フォーマットと基本構文
- **インデント**: 半角スペース4つを使用します。
- **セミコロン**: 文末のセミコロンは必須とします。
- **関数定義**: 従来の `function` 宣言ではなく、アロー関数 (`const ... = () => {}`) を基本とします。これにより `this` のバインディング問題を回避し、構文を統一します。

## 命名規則
- **ファイル・ディレクトリ名**: ケバブケース (`kebab-case.ts`, `my-feature/`) を使用します。
- **Reactコンポーネント**: パスカルケース (`MyComponent`) を使用し、ファイル名についてはケバブケース（`my-component.tsx`）とし、各スライス単位の `index.ts` からエクスポートする形を取ります。
- **変数・関数名**: キャメルケース (`useRobotAnimation`, `handleScanResult`) を使用します。
- **真偽値変数**: `is`, `has`, `should`, `can` などのプレフィックスを付け、一目で真偽値と分かるようにします（例: `isRunning`, `hasError`）。
- **イベントハンドラ**: propsとして渡す関数は `on～` (例: `onScanComplete`)、コンポーネント内部で定義するハンドラ関数は `handle～` (例: `handleScanResult`) とします。
- **Type/Interface名**: `I` などのプレフィックス（`IRobot` など）は**使用しません**。単に `Robot` と命名します。

## TypeScriptの型定義
- **型の安全性**: `any` 型の使用は極力避け、不明な型は `unknown` やGeneric型を適切に使用します。
- `interface` よりも `type` エイリアスの使用を好みます（複雑な結合やUnion表現が容易なため）。ただしオブジェクトの形状をオーバライド・マージする必要がある場合に限り `interface` を許可します。

## Reactコンポーネントの設計
- **フックの活用**: ライフサイクル管理や状態管理には Hooks API を使用します。
- **プレゼンテーショナル/コンテナの分離**: UIを描画することに特化した「純粋な」コンポーネントと、ロジック（状態管理・データ取得）を持つコンテナコンポーネント（Feature層など）の責務を分離します。
- **カスタムフックの抽出**: コンポーネント内のロジックが20〜30行を超える場合、または他のコンポーネントで再利用可能な場合は `use...` のカスタムフック（例: `useCamera`）として分離します。

## FSD (Feature-Sliced Design) のPublic API制限
- 各スライス（`entities/robot` など）の外部への公開内容は、そのディレクトリ直下の `index.ts`（Public API）に制限します。
- スライス内部のファイルへの直接アクセス（ディープインポート）は禁止します。（例：`import { RobotCard } from '@/entities/robot/ui/RobotCard'` ではなく `import { RobotCard } from '@/entities/robot'` を使用）

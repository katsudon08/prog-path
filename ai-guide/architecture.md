## アーキテクチャ

Screaming Architecture

## ディレクトリ構成

```
src/
├─ domains/
│   ├─ home/
│   │   ├─ [ドメインの各機能]/
│   │   │   ├─ context/    # React Context
│   │   │   ├─ constants/  # 定数
│   │   │   ├─ lib/        # 汎用関数
│   │   │   ├─ hooks/      # Custom hooks
│   │   │   └─ ui/         # UI Component
│   │   └─ index.ts
│   ├─ maze/
│   │   ├─ [ドメインの各機能]/
│   │   │   ├─ context/    # React Context
│   │   │   ├─ constants/  # 定数
│   │   │   ├─ lib/        # 汎用関数
│   │   │   ├─ hooks/      # Custom hooks
│   │   │   └─ ui/         # UI Component
│   │   └─ index.ts
│   ├─ ar/
│   │   ├─ [ドメインの各機能]/
│   │   │   ├─ context/    # React Context
│   │   │   ├─ constants/  # 定数
│   │   │   ├─ lib/        # 汎用関数
│   │   │   ├─ hooks/      # Custom hooks
│   │   │   └─ ui/         # UI Component
│   │   └─ index.ts
│   └─ download/
│       ├─ [ドメインの各機能]/
│       │   ├─ context/    # React Context
│       │   ├─ constants/  # 定数
│       │   ├─ lib/        # 汎用関数
│       │   ├─ hooks/      # Custom hooks
│       │   └─ ui/         # UI Component
│       └─ index.ts
└─ shared/
    ├─ 共通の各機能/
    │   ├─ context/    # React Context
    │   ├─ constants/  # 定数
    │   ├─ lib/        # 汎用関数
    │   ├─ hooks/      # Custom hooks
    │   └─ ui/         # UI Component
    └─ index.ts
```

それぞれの機能をもとに各ドメインの下にディレクトリを作成し、そこに該当する機能の実装を配置する。(Sharedの下にあるディレクトリ構成を機能ディレクトリの下に配置する)

これによりCo-locationを崩すことなくアーキテクチャの設計ができる

FSDからの移行に際し、古くなったディレクトリ構造は削除してクリーンアップすること

## ルール

1. SOLID原則に従うこと
2. Co-locationを崩さないようにすること
3. コンポーネントの責務を明確にし、一つのコンポーネントに一つの責務を持たせること（二つ以上持たせてはいけない）
4. １つのファイルの行数が100行を超えたら分割できないか考えること
5. 依存関係はドメイン -> 機能のように上から下への依存関係にする
6. ディレクトリ外部のモジュールを参照する際は、必ず index.ts（バレルファイル）を経由すること
7. 新規に公開用ファイルを作成した場合は、即座に対応する index.ts を更新すること
8. 循環参照（Circular Dependency）を防ぐため、バレルファイル同士の相互参照には十分注意すること
9. 外部から利用されるべきコンポーネント、関数、型のみを index.ts で export すること
10. ディレクトリ内だけで使用するヘルパー関数や定数は export せず、カプセル化を維持すること
11. 機能ディレクトリの下には定められたディレクトリ以外のファイルやディレクトリを配置してはいけない
12. Atomic Designを踏襲し、大きく3つの分類をuiディレクトリにおいて採用(Atoms, Organisms, Pagesの三つのみ)し、コンポーネント分割を行うこと
13. Atomic Designをもとに、UIコンポーネントの命名を行うこと
14. コンポーネント内に記述する非表示（UIに関わらない）ロジックや状態管理が複雑になる場合は、必ず Custom Hooks へ抽出すること
15. イベントを渡す際の Props 名は on[Event]（例: onClick）、それを受け取る関数名は handle[Event]（例: handleClick）という命名規則を徹底すること
16. Atoms は完全にステートレス、またはUIの状態（開閉など）のみを管理し、ドメイン知識（API通信や特定の業務ロジック）を含めてはいけない。 ドメインに関わるデータ注入は Organisms または Pages で行うこと。
17. テストファイル（*.test.ts）は、対象のソースコードと同じディレクトリ内に配置すること
18. ディレクトリ構造を順守すること

---

### SOLID原則

- Single Responsibility Principle (SRP): 1つの責任を持つ
- Open/Closed Principle (OCP): 開閉の原則
- Liskov Substitution Principle (LSP): リスコフの置換原則
- Interface Segregation Principle (ISP): インターフェースの分離原則
- Dependency Inversion Principle (DIP): 依存逆転原則

---
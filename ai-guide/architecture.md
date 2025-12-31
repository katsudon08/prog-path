## アーキテクチャ

Screaming Architecture

## ディレクトリ構成

```
src/
├─ domains/
│   ├─ home/
│   │   ├─ [機能ディレクトリ]/
│   │   └─ index.ts
│   ├─ maze/
│   │   ├─ [機能ディレクトリ]/
│   │   └─ index.ts
│   ├─ ar/
│   │   ├─ [機能ディレクトリ]/
│   │   └─ index.ts
│   └─ download/
│       ├─ [機能ディレクトリ]/
│       └─ index.ts
└─ shared/
    ├─ [共通機能ディレクトリ]/
    ├─ context/    # 共通React Context
    ├─ constants/  # 共通定数
    ├─ lib/        # 共通汎用関数
    ├─ hooks/      # 共通Custom hooks
    ├─ ui/         # 共通UI Component
    └─ index.ts
```


各機能ディレクトリは下記のディレクトリ構造を保有する

├─ context/ # React Context
├─ constants/ # 定数
├─ lib/ # 汎用関数
├─ hooks/ # React Custom hooks
└─ ui/ # UI Component
```

それぞれの機能をもとに各ドメインの下にディレクトリを作成し、そこに該当する機能の実装を配置する。(Sharedの下にあるディレクトリ構成を機能ディレクトリの下に配置する)

これによりCo-locationを崩すことなくアーキテクチャの設計ができる

FSDからの移行に際し、古くなったディレクトリ構造は削除してクリーンアップすること

## ルール

- SOLID原則に従うこと
- Co-locationを崩さないようにすること
- コンポーネントの責務を明確にし、一つのコンポーネントに一つの責務を持たせること（二つ以上持たせてはいけない）
- １つのファイルの行数が100行を超えたら分割できないか考えること
- 依存関係はドメイン -> 機能のように上から下への依存関係にする

---

### SOLID原則

- Single Responsibility Principle (SRP): 1つの責任を持つ
- Open/Closed Principle (OCP): 開閉の原則
- Liskov Substitution Principle (LSP): リスコフの置換原則
- Interface Segregation Principle (ISP): インターフェースの分離原則
- Dependency Inversion Principle (DIP): 依存逆転原則

---
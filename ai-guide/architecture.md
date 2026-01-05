# アーキテクチャ

`Screaming Architecture`

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

それぞれの機能をもとに各ドメインの下にディレクトリを作成し、そこに該当する機能の実装を行う
機能ディレクトリについては`features.md`を参照すること

これによりCo-locationを崩すことなくアーキテクチャの設計を目指す

FSDからの移行に際し、古くなったディレクトリ構造は削除してクリーンアップすること
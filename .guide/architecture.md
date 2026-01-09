# アーキテクチャ

`FSD`

## ディレクトリ構成

```
/
└─ src
   ├─ app
   ├─ pages
   ├─ widgets
   ├─ features
   │  ├─ folder-management
   │  ├─ maze-management
   │  ├─ maze-qr-management
   │  ├─ maze-edit
   │  ├─ command-management
   │  ├─ maze-simulation
   │  └─ app-download
   ├─ entities
   │  ├─ maze
   │  ├─ command
   │  ├─ folder
   │  └─ robot
   └─ shared
```

## セグメントが保有するディレクトリ

`*`がついているディレクトリは使用する必要はありません

1. `ui`
2. `model`
3. `lib`
4. (*) `api`
5. (*) `config`
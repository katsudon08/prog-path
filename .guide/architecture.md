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
   ├─ entities
   │  ├─ maze-2d
   │  ├─ maze-3d
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
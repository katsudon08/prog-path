# Dexie.js メソッドチェーンとインデックス

## Table\<T, K\> 型

Dexie が提供するジェネリック型。

- **第1型引数 `T`** — テーブルに格納されるレコードの型
- **第2型引数 `K`** — 主キーの型

```ts
// 例: Maze型のレコードを持ち、主キーがnumberであるテーブル
Table<Maze, number>
```

DI（ファクトリパターン）で使う場合、特定の DB インスタンスに依存せず「このインターフェースのテーブルなら何でも受け取れる」という入口になる。

---

## 中間メソッド vs 終端メソッド

| 種類 | 返り値 | 例 |
|---|---|---|
| **中間** | `Collection`（チェーン継続） | `.where()`, `.equals()`, `.reverse()`, `.filter()` |
| **終端** | `Promise<T[]>` / `Promise<T>` | `.toArray()`, `.sortBy()`, `.first()`, `.count()` |

### 例

```ts
// toArray() で終端
table.orderBy('createdAt').reverse().toArray()

// sortBy() で終端（toArray不要）
table.where('mazeId').equals(mazeId).reverse().sortBy('createdAt')
```

`.sortBy()` と `.toArray()` はどちらも「結果を配列で返す」終端メソッド。`.sortBy()` はメモリ上でのソート機能を含むため、同時に `.toArray()` を呼ぶ必要はない。

---

## 個別インデックス vs 複合インデックス

### 個別インデックス

```ts
commandHistories: '++id, mazeId, createdAt'
```

`mazeId` と `createdAt` はそれぞれ独立したインデックス。`where` で1つのインデックスを使うと、同時に別のインデックスでソートはできない。

### 複合インデックス

```ts
commandHistories: '++id, [mazeId+createdAt]'
```

複数フィールドを組み合わせた1つのインデックス。フィルタとソートを IndexedDB 内で一括処理できる。

```ts
// 複合インデックスを使ったクエリ例
table
  .where('[mazeId+createdAt]')
  .between([mazeId, Dexie.minKey], [mazeId, Dexie.maxKey])
  .reverse()
  .toArray()
```

### 使い分け

| 状況 | 推奨 |
|---|---|
| レコード数が少ない（数十〜数百件） | 個別インデックス + `sortBy` |
| レコード数が多い（数千件〜） | 複合インデックス |
| フィルタとソートを常に同じ組み合わせで使う | 複合インデックス |

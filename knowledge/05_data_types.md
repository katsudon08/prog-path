# データ型定義

## 型定義ファイル (`lib/types.ts`)

### TileType
迷路のタイル種別を表す型。

```typescript
type TileType = "wall" | "floor" | "hole" | "start" | "goal" | "teleportUp" | "teleportDown" | "key"
```

| 値 | 説明 |
|----|------|
| `wall` | 壁（通行不可） |
| `floor` | 床（通行可能） |
| `hole` | 穴（条件分岐で埋める） |
| `start` | スタート地点 |
| `goal` | ゴール地点 |
| `teleportUp` | 上の階層へ移動 |
| `teleportDown` | 下の階層へ移動 |
| `key` | 鍵（収集アイテム） |

---

### MazeData
迷路データを表すインターフェース。

```typescript
interface MazeData {
    id: string          // 一意識別子
    name: string        // 迷路名
    layers: TileType[][][] // 複数階層対応（3次元配列）
    size: number        // 迷路サイズ（正方形の一辺）
    currentLayer?: number // エディター用の現在表示階層
    category?: string   // 迷路のカテゴリ（フォルダ名）
}
```

#### layers構造
```
layers[階層][行][列] = TileType
```
- 階層: 0から始まるインデックス（複数階建ての迷路に対応）
- 行・列: 0から`size-1`までのインデックス

---

### CommandType
コマンド種別を表す型。

```typescript
type CommandType = "forward" | "turnRight" | "turnLeft" | "ifHole" | "loop"
```

| 値 | 説明 |
|----|------|
| `forward` | 前進（1マス進む） |
| `turnRight` | 右に90度回転 |
| `turnLeft` | 左に90度回転 |
| `ifHole` | 穴があれば埋める（条件分岐） |
| `loop` | 繰り返し（子コマンドを指定回数実行） |

---

### Command
コマンドを表すインターフェース。

```typescript
interface Command {
    type: CommandType      // コマンド種別
    loopCount?: number     // ループ回数（loopタイプ時のみ）
    children?: Command[]   // 子コマンド（loopタイプ時のみ）
}
```

#### ループコマンドの例
```typescript
{
    type: "loop",
    loopCount: 3,
    children: [
        { type: "forward" },
        { type: "turnRight" }
    ]
}
```

---

### DirectionVector
ロボットの向きをベクトルで表す型。

```typescript
type DirectionVector = [number, number];
```

| 値 | 方向 |
|----|------|
| `[0, -1]` | 北（上） |
| `[1, 0]` | 東（右） |
| `[0, 1]` | 南（下） |
| `[-1, 0]` | 西（左） |

---

### RobotState
ロボットの状態を表すインターフェース。

```typescript
interface RobotState {
    x: number               // X座標（列）
    y: number               // Y座標（行）
    z: number               // Z座標（階層、0-indexed）
    direction: DirectionVector  // 向き
    hasKey?: boolean        // 鍵を持っているか
}
```

---

## データ保存

### localStorage構造

| キー | 内容 |
|------|------|
| `mazes` | `MazeData[]`をJSON文字列化したもの |

### QRコードエンコード形式
```
maze:<Base64エンコードされたMazeDataのJSON>
```

例: `maze:eyJpZCI6Im1hemUxIiwibmFtZSI6...`

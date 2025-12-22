# コンポーネント詳細

## メインコンポーネント

### HomeScreen (`components/home-screen.tsx`)
**行数**: 821行

ホーム画面を管理するメインコンポーネント。

#### 主な機能
- 迷路一覧の表示・管理
- フォルダ（カテゴリ）機能
- 迷路のQRコード共有・読み込み
- ドラッグ&ドロップによる迷路の移動
- Webcamを使用したQRスキャン

#### 主要な関数
| 関数名 | 説明 |
|--------|------|
| `toggleCategory` | カテゴリの開閉切り替え |
| `initializeMazes` | 迷路データの初期化 |
| `handleCreateNew` | 新規迷路作成 |
| `handleEditMaze` | 迷路編集画面へ遷移 |
| `handleRunAR` | AR実行画面へ遷移 |
| `handleShareMaze` | QRコード共有ダイアログ表示 |
| `handleImportMaze` | QRコードから迷路読み込み |
| `handleCreateFolder` | 新規フォルダ作成 |
| `handleDeleteFolder` | フォルダ削除 |
| `handleRenameStart/Save/Cancel` | フォルダ名変更 |
| `handleDragStart/Over/Leave/Drop` | D&Dハンドラー |
| `startWebcam` | Webカメラ起動 |
| `scanLoop` | QRコードスキャンループ |

---

### ARExecutionScreen (`components/ar-execution-screen.tsx`)
**行数**: 1132行

迷路プレイ画面を管理するコンポーネント。

#### 主な機能
- コマンドの実行・アニメーション制御
- ロボット状態の管理
- QRコードからのコマンド読み取り
- ループ・条件分岐の処理
- ゴール/失敗判定

#### 主要な関数
| 関数名 | 説明 |
|--------|------|
| `flattenCommands` | ネストされたコマンドを平坦化 |
| `migrateMazeData` | 旧データ形式のマイグレーション |
| `executeCommand` | コマンド実行ロジック |
| `handleLoopConfirm` | ループ回数確定 |
| `handleRemoveCommand` | コマンド削除 |
| `handleUpdateCommand` | コマンド更新 |
| `handleReset` | 状態リセット |
| `handleExecute` | 実行開始/一時停止 |

---

### MazeView3D (`components/maze-view-3d.tsx`)
**行数**: 1204行

Three.js/React Three Fiberを使用した3D描画コンポーネント。

#### 内部コンポーネント
| コンポーネント | 説明 |
|----------------|------|
| `TeleportTile` | テレポートタイルの3D表現 |
| `KeyTile` | 鍵タイルの3D表現 |
| `MazeMap` | 迷路全体の3Dレンダリング |
| `RobotModel` | GLTFモデルのロボット |

#### 主な機能
- 迷路の3Dレンダリング
- ロボットのアニメーション（移動・回転）
- Webカメラ映像の表示
- QRコードスキャン
- コマンド検出時の視覚フィードバック

---

### MazeEditor (`components/maze-editor.tsx`)
**行数**: 514行

迷路作成・編集画面。

#### 主な機能
- グリッドベースの迷路編集
- 複数階層（レイヤー）対応
- タイルタイプの選択・配置
- 迷路の保存・削除
- サイズ変更

#### タイルタイプ
| タイプ | 説明 |
|--------|------|
| `floor` | 床（通行可能） |
| `wall` | 壁（通行不可） |
| `start` | スタート地点 |
| `goal` | ゴール地点 |
| `hole` | 穴（条件分岐用） |
| `teleportUp` | 上階へ移動 |
| `teleportDown` | 下階へ移動 |
| `key` | 鍵（収集アイテム） |

---

### CommandStack (`components/command-stack.tsx`)
**行数**: 411行

コマンド一覧の表示・管理。

#### 主な機能
- コマンドリストの表示
- ループコマンドの展開/折りたたみ
- 子コマンドの追加・削除
- ループ回数の編集
- 現在実行中コマンドのハイライト

#### コマンドタイプ
| タイプ | 説明 | アイコン色 |
|--------|------|-----------|
| `forward` | 前進 | シアン |
| `turnRight` | 右回転 | 青 |
| `turnLeft` | 左回転 | 赤 |
| `loop` | ループ | 紫 |
| `ifHole` | 穴判定（条件分岐） | 緑 |

---

## 補助コンポーネント

### MazePreview (`components/maze-preview.tsx`)
迷路のサムネイルプレビューを表示。

### MinimapView (`components/minimap-view.tsx`)
プレイ中の現在位置を示すミニマップ。

### Navbar (`components/navbar.tsx`)
アプリケーションのナビゲーションバー。

---

## UIコンポーネント (`components/ui/`)

shadcn/uiベースの汎用UIコンポーネント（new-yorkスタイル）。

| ファイル | 用途 |
|----------|------|
| `button.tsx` | ボタン |
| `card.tsx` | カードコンテナ |
| `dialog.tsx` | モーダルダイアログ |
| `input.tsx` | テキスト入力 |
| `label.tsx` | ラベル |

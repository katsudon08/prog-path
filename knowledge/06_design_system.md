# デザインシステム

## テーマ: Space/Cosmic

宇宙・サイバーパンクをモチーフにしたダークテーマを採用。

## カラーパレット

### ベースカラー
| 変数名 | 値 | 用途 |
|--------|----|----|
| `--space-dark` | `oklch(0.12 0.02 250)` | 背景色 |
| `--space-blue` | `oklch(0.25 0.08 250)` | ミュートカラー |

### ネオンカラー
| 変数名 | 値 | 用途 |
|--------|----|----|
| `--neon-cyan` | `oklch(0.75 0.18 200)` | プライマリ・アクセント |
| `--neon-blue` | `oklch(0.65 0.25 250)` | セカンダリ |
| `--neon-green` | `oklch(0.75 0.25 140)` | 条件分岐コマンド |
| `--neon-red` | `oklch(0.65 0.25 25)` | デストラクティブ・左回転 |
| `--neon-purple` | `oklch(0.55 0.25 290)` | ループコマンド |

## セマンティックトークン

| トークン | 参照先 |
|----------|--------|
| `--background` | `--space-dark` |
| `--foreground` | `oklch(0.95 0.02 250)` |
| `--primary` | `--neon-cyan` |
| `--secondary` | `--neon-blue` |
| `--destructive` | `--neon-red` |
| `--muted` | `--space-blue` |

## タイポグラフィ

### フォント
| 用途 | フォント名 | CSS変数 |
|------|------------|---------|
| 本文 | Orbitron | `--font-orbitron` |
| 見出し | Michroma | `--font-michroma` |

両フォントともGoogle Fontsからロード。

## グローエフェクト

ネオン風の発光効果用CSSクラス:

```css
.glow-cyan {
    text-shadow: 0 0 10px var(--neon-cyan), 
                 0 0 20px var(--neon-cyan),
                 0 0 30px var(--neon-cyan);
}

.glow-blue {
    text-shadow: 0 0 10px var(--neon-blue), 
                 0 0 20px var(--neon-blue);
}
```

## アニメーション

### 組み込みアニメーション
| クラス名 | 用途 |
|----------|------|
| `.animate-bounce-in` | 成功時のバウンスイン |
| `.animate-shake` | 失敗時のシェイク |

### キーフレーム定義
```css
@keyframes bounce-in {
    0% { transform: scale(0.8); opacity: 0; }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); opacity: 1; }
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
}
```

## UIスタイル

### スクロールバー
全要素でスクロールバーを非表示:
```css
* {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE/Edge */
}
*::-webkit-scrollbar {
    display: none;
}
```

### 角丸
| トークン | 値 |
|----------|-------|
| `--radius` | `0.5rem` |
| `--radius-sm` | `calc(var(--radius) - 4px)` |
| `--radius-md` | `calc(var(--radius) - 2px)` |
| `--radius-lg` | `var(--radius)` |
| `--radius-xl` | `calc(var(--radius) + 4px)` |

## コマンドカラー

| コマンド | 背景色クラス |
|----------|-------------|
| 前進 | `bg-neon-cyan` |
| 右回転 | `bg-neon-blue` |
| 左回転 | `bg-neon-red` |
| ループ | `bg-neon-purple` |
| 穴判定 | `bg-neon-green` |

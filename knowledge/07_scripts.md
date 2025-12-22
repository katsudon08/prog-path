# NPMスクリプト・コマンド

## 開発コマンド

| コマンド | 説明 |
|----------|------|
| `npm run dev` | Next.js開発サーバー起動（localhost:3000） |
| `npm run build` | Next.js本番ビルド（静的書き出し） |
| `npm run start` | 本番サーバー起動 |
| `npm run lint` | ESLint実行 |

## Electron開発

| コマンド | 説明 |
|----------|------|
| `npm run electron:dev` | Next.js + Electron同時起動（開発用） |
| `npm run electron:build` | Next.jsビルド + Electronパッケージング |

### electron:dev の動作
1. `npm run dev` でNext.js開発サーバー起動
2. `wait-on tcp:3000` で3000番ポートの起動を待機
3. `electron .` でElectronアプリ起動
4. `concurrently -k` で両プロセスを並列実行（終了時は両方停止）

### electron:build の動作
1. `npm run build` でNext.jsを静的ファイルに書き出し（`out/`フォルダ）
2. `electron-builder` でアプリをパッケージング（`dist/`フォルダ）

## ビルド設定

### Next.js設定 (`next.config.ts`)
```typescript
const nextConfig: NextConfig = {
    output: 'export', // 静的HTMLとして書き出す
    images: {
        unoptimized: true, // Electronでは画像最適化サーバーが使えないため
    },
};
```

### Electron-Builder設定 (`package.json`)
```json
{
    "build": {
        "appId": "app.prog-path.vercel",
        "productName": "prog-path",
        "files": ["out/**/*", "main.js", "package.json"],
        "directories": { "output": "dist" },
        "mac": { "target": "dmg", "icon": "build/icon.icns" },
        "win": { "target": "nsis", "icon": "build/icon.ico" },
        "linux": { "target": "AppImage", "icon": "build/icon.png" }
    }
}
```

## 出力ディレクトリ

| ディレクトリ | 内容 |
|--------------|------|
| `.next/` | Next.js開発キャッシュ |
| `out/` | Next.js静的書き出し結果 |
| `dist/` | Electronパッケージング結果 |
| `build/` | Electronビルド用アイコン |

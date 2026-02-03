![prog-path-header](docs/images/prog-path-header.png)

<h1 align="center">ProgPath</h1>

<h3 align="center">物理的なカードと3Dシュミレーションを融合したプログラミング学習アプリ</h3>

<h2 align="center">使用技術一覧</h2>
<!-- シールド一覧 -->
<p align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=vite,ts,react,tauri,git,github" />
  </a>
</p>

## 概要
ProgPathは、**QRコードカードによる物理的なコマンド入力**と**3Dロボットシミュレーション**を組み合わせた、新しい形のプログラミング学習環境です。

- **対象**: 小学校高学年（プログラミング初学者）
- **学習形態**: CSCL（コンピュータ支援型協働学習）を基盤とした共創型学習
- **特徴**: 画面に向き合うだけでなく、カードを手に取り・並べ・議論することで、対話を生むプログラミング体験を実現


## 主な機能
- **QRコードプログラミング**: カードを読み込んでプログラムを構築
- **3Dシミュレーション**: プログラムを実行して、迷路空間でロボットを動かす
- **迷路エディタ**: 自分だけの迷路を作成・共有
- **マルチプラットフォーム**: Webブラウザとデスクトップアプリに対応

## デモ
- [サイトURL](https://prog-path.vercel.app/)

## 前提条件
- Windows 11
- Node.js v24.13.0 以上
- npm v11.8.0 以上
- Visual Studio Build Tools 2026
- rustup v1.28.2 以上

## セットアップ手順
1. リポジトリをクローン
```bash
   git clone https://github.com/katsudon08/prog-path.git
   cd prog-path
```

2. 依存関係をインストール
```bash
   npm install
```

3. 開発サーバーを起動
```bash
   npm run dev
```

4. Tauriアプリケーションを起動
```bash
   npx tauri dev
```
# プロジェクト概要（Overview）

QRコードを読み取ってロボットの動作を制御・シミュレーションするWebアプリケーションです。

## システムの目的と概要
- ユーザー（主に子供やプログラミング初学者）が物理的なブロックやカード等に印字されたQRコードをカメラで読み取り、ロボットのコマンド（前進、回転など）を組み立てます。
- 画面上の3D空間で、そのコマンド列に従ってロボットのシミュレーション・アニメーションを実行し、ゴールを目指すパズル的な体験を提供します。
- PWA（Progressive Web App）として構築されるため、オフライン環境（ネットワークがない教室などの現場）でも安定して動作することを目指しています。

## 主要な技術スタック
- **フロントエンド**: React, Vite, TypeScript
- **スタイリング**: Tailwind CSS
- **3Dシミュレーション**: React Three Fiber, Three.js
- **QRコード認識**: jsQR（デバイスのカメラ機能と連携）
- **データベース**: Dexie.js (IndexedDBのラッパー。ローカルへのデータ永続化に使用)
- **アプリケーション基盤**: PWA (Service Workerによるキャッシュとオフライン化)
- **テスト**: Vitest, React Testing Library, Playwright
- **コード品質**: ESLint, Prettier

## アーキテクチャ方針：FSD (Feature-Sliced Design)
保守性と拡張性の高いフロントエンド構成を維持するため、FSDのルールに従います。
詳細の仕様や、それぞれの Layer, Slice, Segment の概念・制約については、独立した [アーキテクチャ方針（Architecture）](./architecture.md) のドキュメントを参照してください。

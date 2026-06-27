/**
 * Public API — `features/maze-simulation` スライス
 *
 * 迷路実行エンジン・成功/失敗判定・AR 実行フロー。maze / robot / command を
 * またぐ実行ロジックの置き場所で、`model` に XState マシンと純粋な実行ロジック
 * （移動・衝突/落下/カギ/ゴール判定）を集約し、ui は持たない（描画は widgets/entities 側）。
 *
 * 他スライスからの import はこの index.ts 経由のみ。`export * from` は使わず
 * 公開対象を個別に明示し、公開シンボルは実装着手時に追加する
 * （→ docs/directory-structure.md 2.2）。
 */
export {};

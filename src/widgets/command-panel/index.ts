/**
 * Public API — `widgets/command-panel` スライス
 *
 * コマンド操作ブロック。コマンドスタック表示＋位置選択＋個別削除を束ねる
 * （command-management / entities(command)）。ドメイン状態は controlled（props）で受け取る。
 *
 * 他スライスからの import はこの index.ts 経由のみ。`export * from` は使わず
 * 公開対象を個別に明示する（→ docs/directory-structure.md 2.2）。
 */
export { CommandPanel } from "./ui/command-panel";
export type { CommandPanelProps } from "./ui/command-panel";

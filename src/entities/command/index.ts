/**
 * Public API — `entities/command` スライス
 *
 * コマンド（種別・ループのネスト構造）の型と `CommandItem`（アイコン・名称）。
 * 型・状態・純粋ロジックのみで、他 entity を参照しない。
 *
 * 他スライスからの import はこの index.ts 経由のみ。`export * from` は使わず
 * 公開対象を個別に明示する（→ docs/directory-structure.md 2.2）。
 */

export {
  COMMAND_KIND,
  CommandKindSchema,
  isCommandKind,
  isLoopCommand,
  LOOP_COMMAND_KIND,
} from "./model/types";
export type { Command, CommandKind, LeafCommand, LoopCommand } from "./model/types";
export { COMMAND_VISUALS } from "./model/command-visual";
export type { CommandVisual, CommandVisualKey } from "./model/command-visual";
export { CommandItem } from "./ui/command-item";

/**
 * Public API — `entities/folder` スライス
 *
 * フォルダの型・種別（予約 ID からの判別）・種別ごとの可否・サイドバーの振り分け・`FolderItem`。
 * 型・状態・純粋ロジックのみで、他 entity を参照しない。
 *
 * 他スライスからの import はこの index.ts 経由のみ。`export * from` は使わず
 * 公開対象を個別に明示する（→ docs/directory-structure.md 2.2）。
 */

export { FOLDER_KIND, FolderKindSchema, getFolderKind, isFolderKind } from "./model/types";
export type { Folder, FolderKind } from "./model/types";
export {
  FOLDER_CAPABILITIES,
  canManageFolder,
  getFolderCapabilities,
} from "./model/folder-capabilities";
export type { FolderCapabilities } from "./model/folder-capabilities";
export { FOLDER_VISUALS } from "./model/folder-visual";
export type { FolderVisual } from "./model/folder-visual";
export { buildFolderSections } from "./lib/build-folder-sections";
export type { FolderSection } from "./lib/build-folder-sections";
export { FolderItem } from "./ui/folder-item";

import { TUTORIAL_FOLDER_ID, UNCATEGORIZED_FOLDER_ID } from "../model/constants";
import type { Folder } from "../model/types";
import { isReservedFolder } from "./is-reserved-folder";

/**
 * チュートリアル → ユーザーが作ったフォルダ (元の順番) → マイ迷路 の順に並べ替える
 *
 * チュートリアルは削除できるため、位置ではなく ID で仕分ける
 */
export const sortFolders = (folders: Folder[]): Folder[] => [
  ...folders.filter((folder) => folder.id === TUTORIAL_FOLDER_ID),
  ...folders.filter((folder) => !isReservedFolder(folder.id)),
  ...folders.filter((folder) => folder.id === UNCATEGORIZED_FOLDER_ID),
];

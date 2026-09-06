import { TUTORIAL_FOLDER_ID, UNCATEGORIZED_FOLDER_ID } from "../model/constants";

export const isReservedFolder = (folderId: string): boolean =>
  folderId === TUTORIAL_FOLDER_ID || folderId === UNCATEGORIZED_FOLDER_ID;

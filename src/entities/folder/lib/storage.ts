import { getItem, setItem } from '@/src/shared/lib/storage'
import type { FolderSettings } from '../model/types'

const FOLDERS_KEY = 'progpath_folders'
const EXPANDED_FOLDERS_KEY = 'progpath_expanded_folders'

/**
 * LocalStorageからフォルダ一覧を読み込む
 */
export function loadFoldersFromStorage(): string[] {
    const data = getItem<string[]>(FOLDERS_KEY)
    return data ?? []
}

/**
 * LocalStorageにフォルダ一覧を保存する
 */
export function saveFoldersToStorage(folders: string[]): void {
    setItem(FOLDERS_KEY, folders)
}

/**
 * LocalStorageから展開されたフォルダを読み込む
 */
export function loadExpandedFoldersFromStorage(): Set<string> {
    const data = getItem<string[]>(EXPANDED_FOLDERS_KEY)
    return data ? new Set(data) : new Set<string>()
}

/**
 * LocalStorageに展開されたフォルダを保存する
 */
export function saveExpandedFoldersToStorage(folders: Set<string>): void {
    setItem(EXPANDED_FOLDERS_KEY, [...folders])
}

/**
 * フォルダ設定をまとめて読み込む
 */
export function loadFolderSettings(): FolderSettings {
    return {
        folders: loadFoldersFromStorage(),
        expandedFolders: [...loadExpandedFoldersFromStorage()]
    }
}

/**
 * フォルダ設定をまとめて保存する
 */
export function saveFolderSettings(settings: FolderSettings): void {
    saveFoldersToStorage(settings.folders)
    saveExpandedFoldersToStorage(new Set(settings.expandedFolders))
}

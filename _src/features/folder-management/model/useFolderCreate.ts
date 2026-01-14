import { create } from 'zustand'
import { useFolderStore, saveFoldersToStorage, saveExpandedFoldersToStorage } from '@/_src/entities/folder'
import type { ActionResult } from '@/_src/shared/model'

/**
 * フォルダ作成ダイアログの状態管理
 */
interface FolderCreateState {
    // State
    isOpen: boolean
    folderName: string

    // Actions
    open: () => void
    close: () => void
    setFolderName: (name: string) => void
    create: () => ActionResult
}

/**
 * フォルダ作成機能のストア
 */
export const useFolderCreate = create<FolderCreateState>((set, get) => ({
    // Initial State
    isOpen: false,
    folderName: '',

    // アクション
    open: () => set({ isOpen: true, folderName: '' }),

    close: () => set({ isOpen: false, folderName: '' }),

    setFolderName: (name) => set({ folderName: name }),

    create: () => {
        const { folderName, close } = get()
        const trimmed = folderName.trim()

        if (!trimmed) {
            return {
                success: false,
                type: 'error',
                message: 'フォルダ名を入力してください',
            }
        }

        // entities/folder ストアに追加
        const { folders, addFolder, expandedFolders } = useFolderStore.getState()

        // 重複チェック
        if (folders.includes(trimmed)) {
            return {
                success: false,
                type: 'error',
                message: `「${trimmed}」は既に存在します`,
            }
        }

        // ストアに追加（展開状態も自動的に追加される）
        addFolder(trimmed)

        // LocalStorageに永続化
        const updatedFolders = [...folders, trimmed]
        const updatedExpanded = new Set(expandedFolders).add(trimmed)
        saveFoldersToStorage(updatedFolders)
        saveExpandedFoldersToStorage(updatedExpanded)

        close()

        return {
            success: true,
            type: 'success',
            message: `フォルダ「${trimmed}」を作成しました`,
        }
    }
}))

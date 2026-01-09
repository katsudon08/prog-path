import { create } from 'zustand'
import { useFolderStore, saveFoldersToStorage, saveExpandedFoldersToStorage, DEFAULT_FOLDER_NAME } from '../../../entities/folder'
import { useMazeStore, saveMazesToStorage } from '../../../entities/maze'
import type { ActionResult } from '../../../shared/model'

/**
 * フォルダ削除ダイアログの状態管理
 */
interface FolderDeleteState {
    // State
    folderToDelete: string | null

    // Actions
    open: (folder: string) => void
    close: () => void
    confirmDelete: () => ActionResult
}

/**
 * フォルダ削除機能のストア
 */
export const useFolderDelete = create<FolderDeleteState>((set, get) => ({
    // Initial State
    folderToDelete: null,

    // アクション
    open: (folder) => set({ folderToDelete: folder }),

    close: () => set({ folderToDelete: null }),

    confirmDelete: () => {
        const { folderToDelete, close } = get()
        if (!folderToDelete) {
            return {
                success: false,
                type: 'error',
                message: '削除対象のフォルダが選択されていません',
            }
        }

        // entities/folder ストアから削除
        const folderStore = useFolderStore.getState()
        folderStore.removeFolder(folderToDelete)

        // LocalStorageに永続化
        const updatedFolders = folderStore.folders.filter(f => f !== folderToDelete)
        const updatedExpanded = new Set(folderStore.expandedFolders)
        updatedExpanded.delete(folderToDelete)
        saveFoldersToStorage(updatedFolders)
        saveExpandedFoldersToStorage(updatedExpanded)

        // フォルダ内の迷路を未分類に移動
        const mazeStore = useMazeStore.getState()
        const updatedMazes = mazeStore.mazes.map(maze =>
            maze.folder === folderToDelete
                ? { ...maze, folder: DEFAULT_FOLDER_NAME }
                : maze
        )
        mazeStore.setMazes(updatedMazes)
        saveMazesToStorage(updatedMazes)

        const deletedName = folderToDelete
        close()

        return {
            success: true,
            type: 'success',
            message: `フォルダ「${deletedName}」を削除しました`,
        }
    }
}))

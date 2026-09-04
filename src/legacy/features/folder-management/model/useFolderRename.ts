import { create } from 'zustand'
import { useFolderStore, saveFoldersToStorage } from '@/legacy/entities/folder'
import { useMazeStore, saveMazesToStorage } from '@/legacy/entities/maze'
import type { ActionResult } from '@/legacy/shared/model'

/**
 * フォルダ名変更の状態管理
 */
interface FolderRenameState {
    // State
    editingFolder: string | null
    editingName: string

    // Actions
    startRename: (folder: string) => void
    setEditingName: (name: string) => void
    saveRename: () => ActionResult
    cancelRename: () => void
}

/**
 * フォルダ名変更機能のストア
 */
export const useFolderRename = create<FolderRenameState>((set, get) => ({
    // Initial State
    editingFolder: null,
    editingName: '',

    // アクション
    startRename: (folder) => set({ editingFolder: folder, editingName: folder }),

    setEditingName: (name) => set({ editingName: name }),

    cancelRename: () => set({ editingFolder: null, editingName: '' }),

    saveRename: () => {
        const { editingFolder, editingName } = get()
        if (!editingFolder) {
            return {
                success: false,
                type: 'error',
                message: '編集対象のフォルダが選択されていません',
            }
        }

        const trimmed = editingName.trim()
        if (!trimmed) {
            return {
                success: false,
                type: 'error',
                message: 'フォルダ名を入力してください',
            }
        }

        if (trimmed === editingFolder) {
            set({ editingFolder: null, editingName: '' })
            return {
                success: true,
                type: 'info',
                message: '変更はありません',
            }
        }

        // entities/folder ストアを更新
        const folderStore = useFolderStore.getState()

        // 重複チェック
        if (folderStore.folders.includes(trimmed)) {
            return {
                success: false,
                type: 'error',
                message: `「${trimmed}」は既に存在します`,
            }
        }

        const updatedFolders = folderStore.folders.map(f =>
            f === editingFolder ? trimmed : f
        )
        folderStore.setFolders(updatedFolders)
        saveFoldersToStorage(updatedFolders)

        // 迷路のフォルダ名も更新
        const mazeStore = useMazeStore.getState()
        const updatedMazes = mazeStore.mazes.map(maze =>
            maze.folder === editingFolder
                ? { ...maze, folder: trimmed }
                : maze
        )
        mazeStore.setMazes(updatedMazes)
        saveMazesToStorage(updatedMazes)

        set({ editingFolder: null, editingName: '' })

        return {
            success: true,
            type: 'success',
            message: `フォルダ名を「${trimmed}」に変更しました`,
        }
    }
}))

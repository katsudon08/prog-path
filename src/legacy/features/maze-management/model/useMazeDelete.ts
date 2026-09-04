import { create } from 'zustand'
import { useMazeStore, saveMazesToStorage } from '@/legacy/entities/maze'
import type { ActionResult } from '@/legacy/shared/model'

/**
 * 迷路削除ダイアログの状態管理
 */
interface MazeDeleteState {
    // State
    mazeToDelete: string | null

    // Actions
    open: (mazeId: string) => void
    close: () => void
    confirmDelete: () => ActionResult
}

/**
 * 迷路削除機能のストア
 */
export const useMazeDelete = create<MazeDeleteState>((set, get) => ({
    // Initial State
    mazeToDelete: null,

    // アクション
    open: (mazeId) => set({ mazeToDelete: mazeId }),

    close: () => set({ mazeToDelete: null }),

    confirmDelete: () => {
        const { mazeToDelete, close } = get()
        if (!mazeToDelete) {
            return {
                success: false,
                type: 'error',
                message: '削除対象の迷路が選択されていません',
            }
        }

        // entities/maze ストアから削除
        const mazeStore = useMazeStore.getState()
        const mazeToDeleteData = mazeStore.getMazeById(mazeToDelete)
        const mazeName = mazeToDeleteData?.name || '迷路'

        mazeStore.deleteMaze(mazeToDelete)

        // LocalStorageに永続化
        saveMazesToStorage(mazeStore.mazes)

        close()

        return {
            success: true,
            type: 'success',
            message: `「${mazeName}」を削除しました`,
        }
    }
}))

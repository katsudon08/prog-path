import { create } from 'zustand'
import { useMazeStore, saveMazesToStorage, validateMaze, type MazeData } from '../../../entities/maze'
import type { ActionResult } from '../../../shared/model'
import { decodeMazeFromQR, isMazeQRCode } from '../../../shared/lib'

/**
 * QRインポートストアの状態
 */
interface QRImportState {
    // State
    isOpen: boolean

    // Actions
    open: () => void
    close: () => void
    handleQRDetected: (data: string) => ActionResult
}

/**
 * QRコードインポート機能のストア
 * ロジックのみを担当し、UIへの通知はActionResultを通じて行う
 */
export const useQRImport = create<QRImportState>((set) => ({
    // Initial State
    isOpen: false,

    // アクション
    open: () => set({ isOpen: true }),

    close: () => set({ isOpen: false }),

    /**
     * QRコード検出時のハンドラー
     * 純粋なロジック処理のみを担当し、UIへの通知はActionResultで返す
     */
    handleQRDetected: (data) => {
        // 迷路QRコードかチェック
        if (!isMazeQRCode(data)) {
            return {
                success: false,
                type: 'error',
                message: '迷路のQRコードではありません',
            }
        }

        // デコード
        const maze = decodeMazeFromQR(data)
        if (!maze) {
            return {
                success: false,
                type: 'error',
                message: 'QRコードの解析に失敗しました',
            }
        }

        // バリデーション
        const validation = validateMaze(maze)
        if (!validation.success) {
            return validation
        }

        // 重複チェック
        const mazeStore = useMazeStore.getState()
        if (mazeStore.mazes.find(m => m.id === maze.id)) {
            return {
                success: false,
                type: 'error',
                message: `「${maze.name}」は既にインポート済みです`,
            }
        }

        // ストアに追加
        mazeStore.addMaze(maze)
        saveMazesToStorage(mazeStore.mazes)

        // ダイアログを閉じる（ロジック側で状態を更新）
        set({ isOpen: false })

        return {
            success: true,
            type: 'success',
            message: `「${maze.name}」をインポートしました`,
        }
    },
}))

import { create } from "zustand"

interface MazeDeleteDialogState {
    // 状態
    mazeToDelete: string | null

    // アクション
    openDialog: (id: string) => void
    closeDialog: () => void
    confirmDelete: (deleteMaze: (id: string) => void) => void
}

/**
 * 迷路削除ダイアログストア
 * 迷路削除確認ダイアログの状態を管理
 */
export const useMazeDeleteDialogStore = create<MazeDeleteDialogState>((set, get) => ({
    // 初期状態
    mazeToDelete: null,

    // ダイアログを開く
    openDialog: (id) => {
        set({ mazeToDelete: id })
    },

    // ダイアログを閉じる
    closeDialog: () => {
        set({ mazeToDelete: null })
    },

    // 削除確定
    confirmDelete: (deleteMaze) => {
        const { mazeToDelete } = get()
        if (mazeToDelete) {
            deleteMaze(mazeToDelete)
            set({ mazeToDelete: null })
        }
    },
}))

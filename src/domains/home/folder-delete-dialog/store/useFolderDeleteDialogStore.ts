import { create } from "zustand"

interface FolderDeleteDialogState {
    // 状態
    folderToDelete: string | null

    // アクション
    openDialog: (category: string) => void
    closeDialog: () => void
    confirmDelete: (deleteFolder: (category: string) => void) => void
}

/**
 * フォルダ削除ダイアログストア
 * フォルダ削除確認ダイアログの状態を管理
 */
export const useFolderDeleteDialogStore = create<FolderDeleteDialogState>((set, get) => ({
    // 初期状態
    folderToDelete: null,

    // ダイアログを開く
    openDialog: (category) => {
        set({ folderToDelete: category })
    },

    // ダイアログを閉じる
    closeDialog: () => {
        set({ folderToDelete: null })
    },

    // 削除確定
    confirmDelete: (deleteFolder) => {
        const { folderToDelete } = get()
        if (folderToDelete) {
            deleteFolder(folderToDelete)
            set({ folderToDelete: null })
        }
    },
}))

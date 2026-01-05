import { create } from "zustand"

interface FolderCreateDialogState {
    // 状態
    showDialog: boolean
    folderName: string

    // アクション
    openDialog: () => void
    closeDialog: () => void
    setFolderName: (name: string) => void
    reset: () => void
}

/**
 * フォルダ作成ダイアログストア
 * フォルダ作成ダイアログの状態を管理
 */
export const useFolderCreateDialogStore = create<FolderCreateDialogState>((set) => ({
    // 初期状態
    showDialog: false,
    folderName: "",

    // ダイアログを開く
    openDialog: () => {
        set({ showDialog: true, folderName: "" })
    },

    // ダイアログを閉じる
    closeDialog: () => {
        set({ showDialog: false, folderName: "" })
    },

    // フォルダ名を設定
    setFolderName: (name) => {
        set({ folderName: name })
    },

    // リセット
    reset: () => {
        set({ showDialog: false, folderName: "" })
    },
}))

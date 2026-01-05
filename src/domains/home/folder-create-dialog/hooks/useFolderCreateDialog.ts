"use client"

import { useCategoryStore } from "@domains/home/maze-list/store"
import { useFolderCreateDialogStore } from "../store"

/**
 * フォルダ作成ダイアログのロジックフック
 */
export function useFolderCreateDialog() {
    const dialogStore = useFolderCreateDialogStore()
    const addCategory = useCategoryStore((s) => s.addCategory)

    // フォルダを作成
    const createFolder = () => {
        const folderName = dialogStore.folderName.trim()
        if (!folderName) return
        addCategory(folderName)
        dialogStore.closeDialog()
    }

    return {
        // 状態
        open: dialogStore.showDialog,
        folderName: dialogStore.folderName,
        // アクション
        openDialog: dialogStore.openDialog,
        closeDialog: dialogStore.closeDialog,
        setFolderName: dialogStore.setFolderName,
        createFolder,
    }
}

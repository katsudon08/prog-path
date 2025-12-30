"use client"

import { useState } from "react"
import type { MazeData } from "@/src/entities/maze"
import { createFolder, deleteFolder, renameFolder } from "./folder-operations"

interface UseFolderOperationsProps {
    customCategories: string[]
    setCustomCategories: (categories: string[]) => void
    mazes: MazeData[]
    setMazes: (mazes: MazeData[]) => void
    addToExpanded: (category: string) => void
    removeFromExpanded: (category: string) => void
}

/**
 * フォルダ操作を担当するフック
 * FSD: features層 - 再利用可能なフォルダ管理機能
 */
export function useFolderOperations({
    customCategories,
    setCustomCategories,
    mazes,
    setMazes,
    addToExpanded,
    removeFromExpanded,
}: UseFolderOperationsProps) {
    const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
    const [newFolderName, setNewFolderName] = useState("")
    const [editingCategory, setEditingCategory] = useState<string | null>(null)
    const [editingName, setEditingName] = useState("")

    const openNewFolderDialog = () => setShowNewFolderDialog(true)
    const closeNewFolderDialog = () => {
        setShowNewFolderDialog(false)
        setNewFolderName("")
    }

    const handleCreateFolder = () => {
        const result = createFolder(customCategories, newFolderName)
        if (!result.success) {
            if (result.error) alert(result.error)
            return
        }
        setCustomCategories(result.categories)
        addToExpanded(newFolderName.trim())
        closeNewFolderDialog()
    }

    const handleDeleteFolder = (category: string) => {
        if (!confirm(`フォルダ「${category}」を削除しますか？\n中にある迷路は「未分類」に移動されます。`)) return
        const result = deleteFolder(customCategories, mazes, category)
        setCustomCategories(result.categories)
        setMazes(result.mazes)
        removeFromExpanded(category)
    }

    const startRename = (category: string) => {
        setEditingCategory(category)
        setEditingName(category)
    }

    const saveRename = () => {
        if (!editingCategory) {
            setEditingCategory(null)
            return
        }
        const result = renameFolder(customCategories, mazes, editingCategory, editingName)
        if (!result.success) {
            if (result.error) alert(result.error)
            setEditingCategory(null)
            return
        }
        setCustomCategories(result.categories)
        setMazes(result.mazes)
        removeFromExpanded(editingCategory)
        addToExpanded(editingName.trim())
        setEditingCategory(null)
    }

    const cancelRename = () => setEditingCategory(null)

    return {
        showNewFolderDialog,
        newFolderName,
        setNewFolderName,
        openNewFolderDialog,
        closeNewFolderDialog,
        createFolder: handleCreateFolder,
        deleteFolder: handleDeleteFolder,
        editingCategory,
        editingName,
        setEditingName,
        startRename,
        saveRename,
        cancelRename,
    }
}

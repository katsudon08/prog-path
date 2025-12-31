"use client"

import { useState, useCallback } from "react"
import type { MazeData } from "@/src/entities/maze"
import { saveMazes } from "@shared/lib"

const STORAGE_KEY_CATEGORIES = "progpath_categories"

interface UseFolderOperationsProps {
    customCategories: string[]
    setCustomCategories: (categories: string[]) => void
    mazes: MazeData[]
    setMazes: (mazes: MazeData[]) => void
    addToExpanded: (category: string) => void
    removeFromExpanded: (category: string) => void
}

/**
 * フォルダ操作フック
 * フォルダの作成、削除、リネームを管理
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

    // フォルダ作成ダイアログを開く
    const openNewFolderDialog = useCallback(() => {
        setNewFolderName("")
        setShowNewFolderDialog(true)
    }, [])

    // フォルダ作成ダイアログを閉じる
    const closeNewFolderDialog = useCallback(() => {
        setShowNewFolderDialog(false)
        setNewFolderName("")
    }, [])

    // フォルダを作成
    const createFolder = useCallback(() => {
        if (!newFolderName.trim()) return
        const trimmed = newFolderName.trim()
        if (customCategories.includes(trimmed)) return

        const updated = [...customCategories, trimmed]
        setCustomCategories(updated)
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated))
        addToExpanded(trimmed)
        closeNewFolderDialog()
    }, [newFolderName, customCategories, setCustomCategories, addToExpanded, closeNewFolderDialog])

    // フォルダを削除
    const deleteFolder = useCallback((category: string) => {
        const updated = customCategories.filter(c => c !== category)
        setCustomCategories(updated)
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated))
        removeFromExpanded(category)

        // フォルダ内の迷路を未分類に移動
        const updatedMazes = mazes.map(m =>
            m.category === category ? { ...m, category: undefined } : m
        )
        setMazes(updatedMazes)
        saveMazes(updatedMazes)
    }, [customCategories, setCustomCategories, removeFromExpanded, mazes, setMazes])

    // リネーム開始
    const startRename = useCallback((category: string) => {
        setEditingCategory(category)
        setEditingName(category)
    }, [])

    // リネーム保存
    const saveRename = useCallback(() => {
        if (!editingCategory || !editingName.trim()) return
        const trimmed = editingName.trim()
        if (trimmed === editingCategory) {
            setEditingCategory(null)
            return
        }

        // カテゴリ名更新
        const updated = customCategories.map(c => c === editingCategory ? trimmed : c)
        setCustomCategories(updated)
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated))

        // 迷路のカテゴリ更新
        const updatedMazes = mazes.map(m =>
            m.category === editingCategory ? { ...m, category: trimmed } : m
        )
        setMazes(updatedMazes)
        saveMazes(updatedMazes)

        setEditingCategory(null)
    }, [editingCategory, editingName, customCategories, setCustomCategories, mazes, setMazes])

    // リネームキャンセル
    const cancelRename = useCallback(() => {
        setEditingCategory(null)
        setEditingName("")
    }, [])

    return {
        showNewFolderDialog,
        newFolderName,
        setNewFolderName,
        openNewFolderDialog,
        closeNewFolderDialog,
        createFolder,
        deleteFolder,
        editingCategory,
        editingName,
        setEditingName,
        startRename,
        saveRename,
        cancelRename,
    }
}

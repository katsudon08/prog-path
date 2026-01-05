import { create } from "zustand"
import type { MazeData } from "@/src/domains/maze/maze-data/lib/types"
import { saveMazes } from "@shared/lib"

const STORAGE_KEY_CATEGORIES = "progpath_categories"

interface FolderState {
    // ダイアログ状態
    showCreateDialog: boolean
    newFolderName: string

    // 編集状態
    editingCategory: string | null
    editingName: string

    // アクション - ダイアログ
    openCreateDialog: () => void
    closeCreateDialog: () => void
    setNewFolderName: (name: string) => void

    // アクション - 編集
    startRename: (category: string) => void
    setEditingName: (name: string) => void
    cancelRename: () => void

    // アクション - CRUD（外部ストアを使用するため関数を受け取る）
    createFolder: (
        customCategories: string[],
        setCategories: (categories: string[]) => void,
        addToExpanded: (category: string) => void
    ) => void
    deleteFolder: (
        category: string,
        customCategories: string[],
        setCategories: (categories: string[]) => void,
        removeFromExpanded: (category: string) => void,
        mazes: MazeData[],
        setMazes: (mazes: MazeData[]) => void
    ) => void
    saveRename: (
        customCategories: string[],
        setCategories: (categories: string[]) => void,
        mazes: MazeData[],
        setMazes: (mazes: MazeData[]) => void
    ) => void
}

/**
 * フォルダ操作ストア
 * フォルダの作成・削除・リネームを管理
 */
export const useFolderStore = create<FolderState>((set, get) => ({
    // 初期状態
    showCreateDialog: false,
    newFolderName: "",
    editingCategory: null,
    editingName: "",

    // ダイアログを開く
    openCreateDialog: () => {
        set({ showCreateDialog: true, newFolderName: "" })
    },

    // ダイアログを閉じる
    closeCreateDialog: () => {
        set({ showCreateDialog: false, newFolderName: "" })
    },

    // フォルダ名を設定
    setNewFolderName: (name) => {
        set({ newFolderName: name })
    },

    // リネーム開始
    startRename: (category) => {
        set({ editingCategory: category, editingName: category })
    },

    // 編集名を設定
    setEditingName: (name) => {
        set({ editingName: name })
    },

    // リネームキャンセル
    cancelRename: () => {
        set({ editingCategory: null, editingName: "" })
    },

    // フォルダを作成
    createFolder: (customCategories, setCategories, addToExpanded) => {
        const { newFolderName, closeCreateDialog } = get()
        if (!newFolderName.trim()) return
        const trimmed = newFolderName.trim()
        if (customCategories.includes(trimmed)) return

        const updated = [...customCategories, trimmed]
        setCategories(updated)
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated))
        addToExpanded(trimmed)
        closeCreateDialog()
    },

    // フォルダを削除
    deleteFolder: (category, customCategories, setCategories, removeFromExpanded, mazes, setMazes) => {
        const updated = customCategories.filter((c) => c !== category)
        setCategories(updated)
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated))
        removeFromExpanded(category)

        // フォルダ内の迷路を未分類に移動
        const updatedMazes = mazes.map((m) =>
            m.category === category ? { ...m, category: undefined } : m
        )
        setMazes(updatedMazes)
        saveMazes(updatedMazes)
    },

    // リネーム保存
    saveRename: (customCategories, setCategories, mazes, setMazes) => {
        const { editingCategory, editingName } = get()
        if (!editingCategory || !editingName.trim()) return
        const trimmed = editingName.trim()
        if (trimmed === editingCategory) {
            set({ editingCategory: null })
            return
        }

        // カテゴリ名更新
        const updatedCategories = customCategories.map((c) =>
            c === editingCategory ? trimmed : c
        )
        setCategories(updatedCategories)
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updatedCategories))

        // 迷路のカテゴリ更新
        const updatedMazes = mazes.map((m) =>
            m.category === editingCategory ? { ...m, category: trimmed } : m
        )
        setMazes(updatedMazes)
        saveMazes(updatedMazes)

        set({ editingCategory: null })
    },
}))

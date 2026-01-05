import { create } from "zustand"
import type { MazeData } from "@/src/domains/maze/maze-data/lib/types"

const STORAGE_KEY_CATEGORIES = "progpath_categories"
const STORAGE_KEY_EXPANDED = "progpath_expanded"

interface CategoryState {
    // 状態
    customCategories: string[]
    expandedCategories: Set<string>

    // アクション
    initialize: () => void
    setCustomCategories: (categories: string[]) => void
    addCategory: (category: string) => void
    removeCategory: (category: string) => void
    renameCategory: (oldName: string, newName: string) => void
    toggleCategory: (category: string) => void
    addToExpanded: (category: string) => void
    removeFromExpanded: (category: string) => void

    // 計算値用ヘルパー
    getGroupedMazes: (mazes: MazeData[]) => Record<string, MazeData[]>
}

/**
 * カテゴリストア
 * フォルダのカテゴリと展開状態を管理
 */
export const useCategoryStore = create<CategoryState>((set, get) => ({
    // 初期状態
    customCategories: [],
    expandedCategories: new Set<string>(),

    // 初期化（クライアントサイドでのみ呼び出す）
    initialize: () => {
        const storedCategories = localStorage.getItem(STORAGE_KEY_CATEGORIES)
        const storedExpanded = localStorage.getItem(STORAGE_KEY_EXPANDED)

        set({
            customCategories: storedCategories ? JSON.parse(storedCategories) : [],
            expandedCategories: storedExpanded
                ? new Set(JSON.parse(storedExpanded))
                : new Set<string>(),
        })
    },

    // カテゴリ一覧を設定
    setCustomCategories: (categories) => {
        set({ customCategories: categories })
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories))
    },

    // カテゴリを追加
    addCategory: (category) => {
        const { customCategories } = get()
        if (customCategories.includes(category)) return
        const updated = [...customCategories, category]
        set({ customCategories: updated })
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated))
    },

    // カテゴリを削除
    removeCategory: (category) => {
        const { customCategories, expandedCategories } = get()
        const updated = customCategories.filter((c) => c !== category)
        const newExpanded = new Set(expandedCategories)
        newExpanded.delete(category)
        set({ customCategories: updated, expandedCategories: newExpanded })
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated))
        localStorage.setItem(STORAGE_KEY_EXPANDED, JSON.stringify([...newExpanded]))
    },

    // カテゴリをリネーム
    renameCategory: (oldName, newName) => {
        const { customCategories } = get()
        const updated = customCategories.map((c) => (c === oldName ? newName : c))
        set({ customCategories: updated })
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated))
    },

    // 展開/折りたたみ切替
    toggleCategory: (category) => {
        const { expandedCategories } = get()
        const newExpanded = new Set(expandedCategories)
        if (newExpanded.has(category)) {
            newExpanded.delete(category)
        } else {
            newExpanded.add(category)
        }
        set({ expandedCategories: newExpanded })
        localStorage.setItem(STORAGE_KEY_EXPANDED, JSON.stringify([...newExpanded]))
    },

    // 展開カテゴリに追加
    addToExpanded: (category) => {
        const { expandedCategories } = get()
        const newExpanded = new Set(expandedCategories)
        newExpanded.add(category)
        set({ expandedCategories: newExpanded })
        localStorage.setItem(STORAGE_KEY_EXPANDED, JSON.stringify([...newExpanded]))
    },

    // 展開カテゴリから削除
    removeFromExpanded: (category) => {
        const { expandedCategories } = get()
        const newExpanded = new Set(expandedCategories)
        newExpanded.delete(category)
        set({ expandedCategories: newExpanded })
        localStorage.setItem(STORAGE_KEY_EXPANDED, JSON.stringify([...newExpanded]))
    },

    // 迷路をカテゴリでグループ化
    getGroupedMazes: (mazes) => {
        const { customCategories } = get()
        const groups: Record<string, MazeData[]> = {}

        // カスタムカテゴリを初期化
        for (const category of customCategories) {
            groups[category] = []
        }

        // 迷路を振り分け
        for (const maze of mazes) {
            const category = maze.category || "未分類"
            if (!groups[category]) {
                groups[category] = []
            }
            groups[category].push(maze)
        }

        return groups
    },
}))

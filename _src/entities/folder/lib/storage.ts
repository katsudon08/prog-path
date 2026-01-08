import type { FolderSettings } from '../model/types'

const CATEGORIES_KEY = 'progpath_categories'
const EXPANDED_KEY = 'progpath_expanded_categories'

/**
 * LocalStorageからカスタムカテゴリを読み込む
 */
export function loadCategoriesFromStorage(): string[] {
    try {
        const data = localStorage.getItem(CATEGORIES_KEY)
        if (!data) {
            return []
        }
        return JSON.parse(data) as string[]
    } catch {
        console.error('Failed to load categories from storage')
        return []
    }
}

/**
 * LocalStorageにカスタムカテゴリを保存する
 */
export function saveCategoriesToStorage(categories: string[]): void {
    try {
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
    } catch {
        console.error('Failed to save categories to storage')
    }
}

/**
 * LocalStorageから展開されたカテゴリを読み込む
 */
export function loadExpandedCategoriesFromStorage(): Set<string> {
    try {
        const data = localStorage.getItem(EXPANDED_KEY)
        if (!data) {
            return new Set<string>()
        }
        const arr = JSON.parse(data) as string[]
        return new Set(arr)
    } catch {
        console.error('Failed to load expanded categories from storage')
        return new Set<string>()
    }
}

/**
 * LocalStorageに展開されたカテゴリを保存する
 */
export function saveExpandedCategoriesToStorage(categories: Set<string>): void {
    try {
        localStorage.setItem(EXPANDED_KEY, JSON.stringify([...categories]))
    } catch {
        console.error('Failed to save expanded categories to storage')
    }
}

/**
 * フォルダ設定をまとめて読み込む
 */
export function loadFolderSettings(): FolderSettings {
    return {
        customCategories: loadCategoriesFromStorage(),
        expandedCategories: [...loadExpandedCategoriesFromStorage()]
    }
}

/**
 * フォルダ設定をまとめて保存する
 */
export function saveFolderSettings(settings: FolderSettings): void {
    saveCategoriesToStorage(settings.customCategories)
    saveExpandedCategoriesToStorage(new Set(settings.expandedCategories))
}

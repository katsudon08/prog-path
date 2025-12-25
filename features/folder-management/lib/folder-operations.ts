import type { MazeData } from "@entities/maze"
import { saveMazes, saveCategories } from "@features/maze-storage"

/**
 * フォルダを作成
 */
export function createFolder(
    categories: string[],
    newFolderName: string
): { success: boolean; categories: string[]; error?: string } {
    const trimmed = newFolderName.trim()
    if (!trimmed) {
        return { success: false, categories, error: "フォルダ名を入力してください" }
    }
    if (categories.includes(trimmed)) {
        return { success: false, categories, error: "同名のフォルダが既に存在します" }
    }

    const updated = [...categories, trimmed]
    saveCategories(updated)
    return { success: true, categories: updated }
}

/**
 * フォルダを削除（中の迷路は「未分類」に移動）
 */
export function deleteFolder(
    categories: string[],
    mazes: MazeData[],
    category: string
): { categories: string[]; mazes: MazeData[] } {
    // 迷路を「未分類」に移動
    const updatedMazes = mazes.map(maze => {
        if (maze.category === category) {
            return { ...maze, category: "未分類" }
        }
        return maze
    })
    saveMazes(updatedMazes)

    // カテゴリから削除
    const updatedCategories = categories.filter(c => c !== category)
    saveCategories(updatedCategories)

    return { categories: updatedCategories, mazes: updatedMazes }
}

/**
 * フォルダをリネーム
 */
export function renameFolder(
    categories: string[],
    mazes: MazeData[],
    oldName: string,
    newName: string
): { success: boolean; categories: string[]; mazes: MazeData[]; error?: string } {
    const trimmed = newName.trim()

    if (!trimmed) {
        return { success: false, categories, mazes, error: "フォルダ名を入力してください" }
    }

    if (oldName === trimmed) {
        return { success: true, categories, mazes }
    }

    if (categories.includes(trimmed) || trimmed === "未分類") {
        return { success: false, categories, mazes, error: "その名前のフォルダは既に存在するか、予約されています" }
    }

    // カテゴリをリネーム
    const updatedCategories = categories.map(cat => cat === oldName ? trimmed : cat)
    saveCategories(updatedCategories)

    // 迷路のカテゴリを更新
    const updatedMazes = mazes.map(maze => {
        if (maze.category === oldName) {
            return { ...maze, category: trimmed }
        }
        return maze
    })
    saveMazes(updatedMazes)

    return { success: true, categories: updatedCategories, mazes: updatedMazes }
}

/**
 * カテゴリの開閉状態を切り替え
 */
export function toggleCategoryExpanded(
    expandedCategories: Set<string>,
    category: string
): Set<string> {
    const next = new Set(expandedCategories)
    if (next.has(category)) {
        next.delete(category)
    } else {
        next.add(category)
    }
    return next
}

/**
 * カテゴリを展開
 */
export function expandCategory(
    expandedCategories: Set<string>,
    category: string
): Set<string> {
    const next = new Set(expandedCategories)
    next.add(category)
    return next
}

/**
 * カテゴリを折りたたむ
 */
export function collapseCategory(
    expandedCategories: Set<string>,
    category: string
): Set<string> {
    const next = new Set(expandedCategories)
    next.delete(category)
    return next
}

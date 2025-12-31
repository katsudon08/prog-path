"use client"

import { useMazeContext } from "@domains/home/maze-list"
import { useCategoryState, useFolderOperations, useMazeDnd } from "@domains/home/hooks"

/**
 * サイドバーの状態を統合するフック
 * FSD: pages層 - features層のフックを統合
 */
export function useSidebarState() {
    const { mazes, setMazes } = useMazeContext()

    // カテゴリ管理
    const category = useCategoryState(mazes)

    // フォルダ操作
    const folder = useFolderOperations({
        customCategories: category.customCategories,
        setCustomCategories: category.setCustomCategories,
        mazes,
        setMazes,
        addToExpanded: category.addToExpanded,
        removeFromExpanded: category.removeFromExpanded,
    })

    // D&D操作
    const dnd = useMazeDnd({
        mazes,
        setMazes,
        addToExpanded: category.addToExpanded,
    })

    return {
        // カテゴリ
        groupedMazes: category.groupedMazes,
        customCategories: category.customCategories,
        expandedCategories: category.expandedCategories,
        toggleCategory: category.toggleCategory,
        // フォルダ
        showNewFolderDialog: folder.showNewFolderDialog,
        newFolderName: folder.newFolderName,
        setNewFolderName: folder.setNewFolderName,
        openNewFolderDialog: folder.openNewFolderDialog,
        closeNewFolderDialog: folder.closeNewFolderDialog,
        createFolder: folder.createFolder,
        deleteFolder: folder.deleteFolder,
        editingCategory: folder.editingCategory,
        editingName: folder.editingName,
        setEditingName: folder.setEditingName,
        startRename: folder.startRename,
        saveRename: folder.saveRename,
        cancelRename: folder.cancelRename,
        // D&D
        dragStart: dnd.dragStart,
        dragOver: dnd.dragOver,
        dragLeave: dnd.dragLeave,
        drop: dnd.drop,
    }
}

"use client"

import { useMazeContext, useCategoryState } from "@domains/home/maze-list"
import { useFolderOperations } from "@domains/home/folder-management"
import { useMazeDnd } from "@domains/home/maze-dnd"

/**
 * サイドバーの状態を統合するフック
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
        dragStart: (_e: React.DragEvent, mazeId: string) => dnd.dragStart(mazeId),
        dragOver: dnd.dragOver,
        dragLeave: (_e: React.DragEvent) => dnd.dragLeave(),
        drop: (_e: React.DragEvent, category: string) => dnd.drop(category),
    }
}

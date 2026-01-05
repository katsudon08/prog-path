"use client"

import { useMazeStore, useCategoryStore } from "@domains/home/maze-list/store"
import { useFolderStore, useDndStore } from "@domains/home/folder-list/store"
import { useMazeDeleteDialogStore } from "@domains/home/maze-delete-dialog/store"
import { useFolderDeleteDialogStore } from "@domains/home/folder-delete-dialog/store"

/**
 * 迷路リストのロジックフック
 */
export function useMazeList() {
    // 迷路ストア
    const mazes = useMazeStore((s) => s.mazes)
    const selectMaze = useMazeStore((s) => s.selectMaze)
    const selectedMaze = useMazeStore((s) => s.selectedMaze)
    const setMazes = useMazeStore((s) => s.setMazes)

    // カテゴリストア
    const customCategories = useCategoryStore((s) => s.customCategories)
    const expandedCategories = useCategoryStore((s) => s.expandedCategories)
    const toggleCategory = useCategoryStore((s) => s.toggleCategory)
    const addToExpanded = useCategoryStore((s) => s.addToExpanded)
    const setCustomCategories = useCategoryStore((s) => s.setCustomCategories)
    const getGroupedMazes = useCategoryStore((s) => s.getGroupedMazes)
    const groupedMazes = getGroupedMazes(mazes)

    // フォルダストア
    const folderStore = useFolderStore()

    // D&Dストア
    const dndStore = useDndStore()

    // ダイアログストア
    const mazeDeleteDialog = useMazeDeleteDialogStore()
    const folderDeleteDialog = useFolderDeleteDialogStore()

    return {
        // データ
        data: {
            groupedMazes,
            customCategories,
            selectedMazeId: selectedMaze?.id ?? null,
            expandedCategories,
        },
        // 迷路操作
        onSelectMaze: selectMaze,
        onDeleteMaze: mazeDeleteDialog.openDialog,
        // カテゴリ操作
        categoryHandlers: {
            onToggleCategory: toggleCategory,
            onDeleteFolder: folderDeleteDialog.openDialog,
        },
        // リネーム操作
        renameState: {
            editingCategory: folderStore.editingCategory,
            editingName: folderStore.editingName,
            onStartRename: folderStore.startRename,
            onSaveRename: () => folderStore.saveRename(
                customCategories,
                setCustomCategories,
                mazes,
                setMazes
            ),
            onCancelRename: folderStore.cancelRename,
            onSetEditingName: folderStore.setEditingName,
        },
        // D&D操作
        dndHandlers: {
            onDragStart: (_e: React.DragEvent, mazeId: string) => dndStore.dragStart(mazeId),
            onDragOver: dndStore.dragOver,
            onDragLeave: () => dndStore.dragLeave(),
            onDrop: (_e: React.DragEvent, category: string) => dndStore.drop(
                category,
                mazes,
                setMazes,
                addToExpanded
            ),
        },
    }
}

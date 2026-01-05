"use client";

import { useState, useEffect } from "react";
import { Folder } from "@domains/home/folder";
import type { MazeData } from "@/src/domains/maze/maze-data/lib/types";

/** フォルダリストのデータProps */
export interface FolderListDataProps {
    groupedMazes: Record<string, MazeData[]>;
    customCategories: string[];
    selectedMazeId: string | null;
    expandedCategories: Set<string>;
}

/** カテゴリ操作ハンドラー */
export interface CategoryHandlers {
    onToggleCategory: (category: string) => void;
    onDeleteFolder: (category: string) => void;
}

/** リネーム状態とハンドラー */
export interface RenameState {
    editingCategory: string | null;
    editingName: string;
    onStartRename: (category: string) => void;
    onSaveRename: () => void;
    onCancelRename: () => void;
    onSetEditingName: (name: string) => void;
}

/** D&D操作ハンドラー */
export interface DndHandlers {
    onDragStart: (e: React.DragEvent, mazeId: string) => void;
    onDragOver: (e: React.DragEvent, category: string) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, category: string) => void;
}

interface FolderListProps {
    data: FolderListDataProps;
    onSelectMaze: (maze: MazeData) => void;
    onDeleteMaze: (id: string) => void;
    categoryHandlers: CategoryHandlers;
    renameState: RenameState;
    dndHandlers: DndHandlers;
}

/**
 * フォルダリスト
 * folderを一覧表示するフォルダリスト
 */
export function FolderList({
    data,
    onSelectMaze,
    onDeleteMaze,
    categoryHandlers,
    renameState,
    dndHandlers,
}: FolderListProps) {
    const { groupedMazes, customCategories, selectedMazeId, expandedCategories } = data;
    const { onToggleCategory, onDeleteFolder } = categoryHandlers;
    const { editingCategory, editingName, onStartRename, onSaveRename, onCancelRename, onSetEditingName } = renameState;
    const { onDragStart, onDragOver, onDragLeave, onDrop } = dndHandlers;

    // クライアントサイドでマウント後にDnDを有効化（hydrationミスマッチ回避）
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="flex-1 overflow-y-auto bg-space-dark">
            <div>
                {Object.entries(groupedMazes)
                    .sort((a, b) => {
                        if (a[0] === "未分類") return 1;
                        if (b[0] === "未分類") return -1;
                        return a[0].localeCompare(b[0]);
                    })
                    .map(([category, categoryMazes]) => (
                        <Folder
                            key={category}
                            category={category}
                            mazes={categoryMazes}
                            isExpanded={expandedCategories.has(category)}
                            isCustomCategory={customCategories.includes(category)}
                            selectedMazeId={selectedMazeId}
                            onToggle={() => onToggleCategory(category)}
                            onDelete={() => onDeleteFolder(category)}
                            isEditing={editingCategory === category}
                            editingName={editingName}
                            onStartRename={() => onStartRename(category)}
                            onSetEditingName={onSetEditingName}
                            onSaveRename={onSaveRename}
                            onCancelRename={onCancelRename}
                            onSelectMaze={onSelectMaze}
                            onDeleteMaze={onDeleteMaze}
                            mounted={mounted}
                            onDragStart={onDragStart}
                            onDragOver={(e) => onDragOver(e, category)}
                            onDragLeave={onDragLeave}
                            onDrop={(e) => onDrop(e, category)}
                        />
                    ))}
            </div>
        </div>
    );
}

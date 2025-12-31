"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Folder, Trash2 } from "lucide-react";
import { Card, Input } from "@/src/shared/ui";
import { MazePreview, findStartPosition } from "@/src/entities/maze";
import type { MazeData } from "@/src/entities/maze";

/** 迷路リストのデータProps */
export interface MazeListDataProps {
    groupedMazes: Record<string, MazeData[]>;
    customCategories: string[];
    selectedMaze: MazeData | null;
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

interface MazeListProps {
    data: MazeListDataProps;
    onSelectMaze: (maze: MazeData) => void;
    onDeleteMaze: (id: string) => void;
    categoryHandlers: CategoryHandlers;
    renameState: RenameState;
    dndHandlers: DndHandlers;
}

/**
 * 左サイドバーの迷路リスト（フォルダ + 迷路カード）
 */
export function MazeList({
    data,
    onSelectMaze,
    onDeleteMaze,
    categoryHandlers,
    renameState,
    dndHandlers,
}: MazeListProps) {
    const { groupedMazes, customCategories, selectedMaze, expandedCategories } = data;
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
                        <div
                            key={category}
                            {...(mounted && {
                                onDragOver: (e: React.DragEvent) => onDragOver(e, category),
                                onDragLeave: onDragLeave,
                                onDrop: (e: React.DragEvent) => onDrop(e, category),
                            })}
                            className="transition-colors duration-200"
                        >
                            {/* Folder Header */}
                            <div
                                className="flex items-center gap-2 px-6 py-2 cursor-pointer bg-space-darker border-b border-neon-blue/20 hover:bg-space-dark/50"
                                onClick={() => onToggleCategory(category)}
                            >
                                <ChevronDown
                                    className={`h-4 w-4 text-neon-cyan transition-transform ${
                                        expandedCategories.has(category) ? "" : "-rotate-90"
                                    }`}
                                />
                                <Folder className="h-4 w-4 text-neon-green" />
                                {editingCategory === category ? (
                                    <Input
                                        value={editingName}
                                        onChange={(e) => onSetEditingName(e.target.value)}
                                        onBlur={onSaveRename}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") onSaveRename();
                                            if (e.key === "Escape") onCancelRename();
                                        }}
                                        className="h-6 py-0 px-1 text-sm bg-space-dark border-neon-blue/50"
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <span
                                        className="flex-1 text-sm font-medium text-neon-cyan"
                                        onDoubleClick={(e) => {
                                            e.stopPropagation();
                                            if (category !== "未分類") onStartRename(category);
                                        }}
                                    >
                                        {category}
                                    </span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                    {categoryMazes.length}
                                </span>
                                {category !== "未分類" && customCategories.includes(category) && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteFolder(category);
                                        }}
                                        className="p-1 hover:bg-red-500/20 rounded"
                                        title="フォルダを削除"
                                    >
                                        <Trash2 className="h-3 w-3 text-red-400 hover:text-red-300" />
                                    </button>
                                )}
                            </div>

                            {/* Maze Cards */}
                            {expandedCategories.has(category) && (
                                <div className="p-2 space-y-2">
                                    {categoryMazes.map((maze) => (
                                        <Card
                                            key={maze.id}
                                            className={`p-3 cursor-pointer border transition-all hover:border-neon-cyan/50 group ${
                                                selectedMaze?.id === maze.id
                                                    ? "border-neon-cyan bg-neon-cyan/10"
                                                    : "border-neon-blue/30"
                                            }`}
                                            onClick={() => onSelectMaze(maze)}
                                            {...(mounted && {
                                                draggable: true,
                                                onDragStart: (e: React.DragEvent) => onDragStart(e, maze.id),
                                            })}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 h-16 rounded bg-space-darker flex items-center justify-center overflow-hidden">
                                                    <MazePreview
                                                        grid={maze.layers[findStartPosition(maze)?.z ?? 0]}
                                                        cellSize={4}
                                                        showNavigation={false}
                                                        compact={true}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-neon-cyan truncate">
                                                        {maze.name}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {maze.layers[maze.currentLayer ?? 0].length}×
                                                        {maze.layers[maze.currentLayer ?? 0][0]?.length || 0}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteMaze(maze.id);
                                                    }}
                                                    className="p-2 hover:bg-red-500/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="迷路を削除"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import { ChevronDown, Folder as FolderIcon, Trash2 } from "lucide-react";
import { Input } from "@/src/shared/ui";
import { MazeCard } from "@domains/home/maze-data";
import type { MazeData } from "@/src/domains/maze/maze-data/lib/types";

interface FolderProps {
    category: string;
    mazes: MazeData[];
    isExpanded: boolean;
    isCustomCategory: boolean;
    selectedMazeId: string | null;
    // カテゴリ操作
    onToggle: () => void;
    onDelete: () => void;
    // リネーム
    isEditing: boolean;
    editingName: string;
    onStartRename: () => void;
    onSetEditingName: (name: string) => void;
    onSaveRename: () => void;
    onCancelRename: () => void;
    // 迷路操作
    onSelectMaze: (maze: MazeData) => void;
    onDeleteMaze: (id: string) => void;
    // D&D
    mounted: boolean;
    onDragStart: (e: React.DragEvent, mazeId: string) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
}

/**
 * フォルダコンポーネント
 * - maze-listを格納するフォルダ
 * - 折りたたみ/展開可能(デフォルトでは折りたたまれている状態)
 * - フォルダ名表示（未分類フォルダは必ず存在させ、どれにも分類しない迷路は未分類に格納）
 * - フォルダ名をダブルタップすることでフォルダ名を変更できる（未分類フォルダのみ名前の変更不可）
 * - フォルダ内の迷路数表示
 * - folder-delete-dialogを表示するアイコンボタン（未分類フォルダには削除ボタンが存在しない）
 */
export function Folder({
    category,
    mazes,
    isExpanded,
    isCustomCategory,
    selectedMazeId,
    onToggle,
    onDelete,
    isEditing,
    editingName,
    onStartRename,
    onSetEditingName,
    onSaveRename,
    onCancelRename,
    onSelectMaze,
    onDeleteMaze,
    mounted,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
}: FolderProps) {
    const isUncategorized = category === "未分類";

    return (
        <div
            {...(mounted && {
                onDragOver: onDragOver,
                onDragLeave: onDragLeave,
                onDrop: onDrop,
            })}
            className="transition-colors duration-200"
        >
            {/* Folder Header */}
            <div
                className="flex items-center gap-2 px-6 py-2 cursor-pointer bg-space-darker border-b border-neon-blue/20 hover:bg-space-dark/50"
                onClick={onToggle}
            >
                <ChevronDown
                    className={`h-4 w-4 text-neon-cyan transition-transform ${
                        isExpanded ? "" : "-rotate-90"
                    }`}
                />
                <FolderIcon className="h-4 w-4 text-neon-green" />
                {isEditing ? (
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
                            if (!isUncategorized) onStartRename();
                        }}
                    >
                        {category}
                    </span>
                )}
                <span className="text-xs text-muted-foreground">
                    {mazes.length}
                </span>
                {!isUncategorized && isCustomCategory && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="p-1 hover:bg-red-500/20 rounded"
                        title="フォルダを削除"
                    >
                        <Trash2 className="h-3 w-3 text-red-400 hover:text-red-300" />
                    </button>
                )}
            </div>

            {/* Maze Cards */}
            {isExpanded && (
                <div className="p-2 space-y-2">
                    {mazes.map((maze) => (
                        <MazeCard
                            key={maze.id}
                            maze={maze}
                            isSelected={selectedMazeId === maze.id}
                            onSelect={() => onSelectMaze(maze)}
                            onDelete={() => onDeleteMaze(maze.id)}
                            draggable={mounted}
                            onDragStart={(e) => onDragStart(e, maze.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

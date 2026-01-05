"use client";

import { Trash2 } from "lucide-react";
import { Card } from "@/src/shared/ui";
import { MazePreview } from "@/src/domains/maze/maze-preview/ui/MazePreview";
import { findStartPosition } from "@/src/domains/maze/maze-data/lib/find-start";
import type { MazeData } from "@/src/domains/maze/maze-data/lib/types";

interface MazeCardProps {
    maze: MazeData;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
}

/**
 * 迷路カード
 * - スタートタイルが存在する階層のmaze-previewを表示
 * - 迷路名表示
 * - 迷路のサイズ表示
 * - 選択されている場合は、そのmaze-dataの迷路をmain-contentで表示する
 * - ドラッグ＆ドロップでfolder間で移動可能
 */
export function MazeCard({
    maze,
    isSelected,
    onSelect,
    onDelete,
    draggable = false,
    onDragStart,
}: MazeCardProps) {
    return (
        <Card
            className={`p-3 cursor-pointer border transition-all hover:border-neon-cyan/50 group ${
                isSelected
                    ? "border-neon-cyan bg-neon-cyan/10"
                    : "border-neon-blue/30"
            }`}
            onClick={onSelect}
            draggable={draggable}
            onDragStart={onDragStart}
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
                        onDelete();
                    }}
                    className="p-2 hover:bg-red-500/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="迷路を削除"
                >
                    <Trash2 className="h-4 w-4 text-red-500" />
                </button>
            </div>
        </Card>
    );
}

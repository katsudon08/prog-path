"use client";

import { Play, Pencil, QrCode, Trash2 } from "lucide-react";
import { Button } from "@/src/shared/ui";
import type { MazeData } from "@/src/entities/maze";

/** 迷路アクションハンドラー */
export interface MazeActions {
    onShare: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onRunAR: () => void;
}

interface MazeDetailHeaderProps {
    maze: MazeData;
    actions: MazeActions;
}

/**
 * メインコンテンツのヘッダー（迷路情報 + アクションボタン）
 */
export function MazeDetailHeader({
    maze,
    actions,
}: MazeDetailHeaderProps) {
    const { onShare, onEdit, onDelete, onRunAR } = actions;

    return (
        <div className="p-6 border-b border-neon-blue/30">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neon-cyan">
                        {maze.name}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        レイヤー: {maze.layers.length} <br />
                        サイズ: {maze.layers[maze.currentLayer ?? 0].length}×
                        {maze.layers[maze.currentLayer ?? 0][0]?.length || 0}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={onEdit}
                        className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan/80"
                    >
                        <Pencil className="mr-2 h-4 w-4" />
                        編集
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onDelete}
                        className="border-red-500 text-red-500 hover:bg-red-500/80 hover:text-space-dark"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        削除
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onShare}
                        className="border-neon-purple text-neon-purple hover:bg-neon-purple/80"
                    >
                        <QrCode className="mr-2 h-4 w-4" />
                        QR
                    </Button>
                    <Button
                        onClick={onRunAR}
                        className="bg-neon-green text-space-dark hover:bg-neon-green/80"
                    >
                        <Play className="mr-2 h-4 w-4" />
                        AR
                    </Button>
                </div>
            </div>
        </div>
    );
}

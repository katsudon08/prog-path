"use client";

import { Play, Pencil, QrCode, Trash2 } from "lucide-react";
import { Button } from "@/src/shared/ui";
import type { MazeData } from "@/src/domains/maze/maze-data/lib/types";
import { useMainHeader } from "../hooks";

interface MainHeaderProps {
    maze: MazeData;
}

/**
 * メインコンテンツヘッダー
 * - 迷路名表示
 * - 迷路の階層表示
 * - 迷路のサイズ表示
 * - 迷路編集画面へ遷移するボタン
 * - 迷路を削除するためのmaze-delete-dialogを表示するボタン
 * - qr-shareを表示するボタン
 * - AR実行画面へ遷移するボタン
 */
export function MainHeader({ maze }: MainHeaderProps) {
    const { edit, openDeleteDialog, share, runAR } = useMainHeader(maze);

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
                        onClick={edit}
                        className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan/80"
                    >
                        <Pencil className="mr-2 h-4 w-4" />
                        編集
                    </Button>
                    <Button
                        variant="outline"
                        onClick={openDeleteDialog}
                        className="border-red-500 text-red-500 hover:bg-red-500/80 hover:text-space-dark"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        削除
                    </Button>
                    <Button
                        variant="outline"
                        onClick={share}
                        className="border-neon-purple text-neon-purple hover:bg-neon-purple/80"
                    >
                        <QrCode className="mr-2 h-4 w-4" />
                        QR
                    </Button>
                    <Button
                        onClick={runAR}
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

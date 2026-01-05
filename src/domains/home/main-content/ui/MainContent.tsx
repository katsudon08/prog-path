"use client";

import { Plus } from "lucide-react";
import { Button } from "@/src/shared/ui";
import { MazePreview } from "@/src/domains/maze/maze-preview/ui/MazePreview";
import type { MazeData } from "@/src/domains/maze/maze-data/lib/types";
import { useMainContent } from "../hooks";

interface MainContentProps {
    maze: MazeData | null;
}

/**
 * メインコンテンツ
 * - 2層以上の迷路の場合、階層を切り替えることができる
 * - その階層のmaze-previewを表示
 * - 迷路データがlocalstorageに一つも存在しない場合、新しく迷路を作成するように促す案内UIを表示
 */
export function MainContent({ maze }: MainContentProps) {
    const { createNew } = useMainContent();

    // 迷路未選択時の空状態表示
    if (!maze) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-neon-cyan/10 flex items-center justify-center">
                        <Plus className="w-12 h-12 text-neon-cyan" />
                    </div>
                    <h2 className="text-xl font-semibold text-neon-cyan mb-2">
                        迷路を選択してください
                    </h2>
                    <p className="text-muted-foreground mb-4">
                        または新しい迷路を作成しましょう
                    </p>
                    <Button
                        onClick={createNew}
                        className="bg-neon-cyan text-space-dark hover:bg-neon-cyan/80"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        新規作成
                    </Button>
                </div>
            </div>
        );
    }

    // 迷路プレビュー表示
    return (
        <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-hidden">
            <div className="relative flex items-center justify-center max-w-full max-h-full">
                <div className="absolute -inset-4 bg-gradient-to-r from-neon-cyan/20 via-neon-purple/20 to-neon-green/20 blur-xl"></div>
                <div className="relative bg-space-darker p-4 rounded-lg border border-neon-blue/50 max-w-full max-h-full overflow-hidden">
                    <MazePreview
                        layers={maze.layers}
                        layerIndex={maze.currentLayer ?? 0}
                        maxWidth={380}
                        maxHeight={200}
                    />
                </div>
            </div>
        </div>
    );
}

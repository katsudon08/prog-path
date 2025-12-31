"use client";

import type { MazeData } from "@/src/domains/maze/maze-data/lib/types";
import { MazePreview } from "@/src/domains/maze/maze-preview/ui/MazePreview";

interface MazeDetailPreviewProps {
    maze: MazeData;
}

/**
 * 選択された迷路のプレビュー表示
 */
export function MazeDetailPreview({ maze }: MazeDetailPreviewProps) {
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

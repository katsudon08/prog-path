"use client";

import { Plus } from "lucide-react";
import { Button } from "@/src/shared/ui";

interface MazeEmptyStateProps {
    onCreateNew: () => void;
}

/**
 * 迷路未選択時の空状態表示
 */
export function MazeEmptyState({ onCreateNew }: MazeEmptyStateProps) {
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
                    onClick={onCreateNew}
                    className="bg-neon-cyan text-space-dark hover:bg-neon-cyan/80"
                >
                    <Plus className="mr-2 h-5 w-5" />
                    新規作成
                </Button>
            </div>
        </div>
    );
}

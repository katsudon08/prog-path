"use client";

import { Plus, QrCode, FolderPlus } from "lucide-react";
import { Button } from "@/src/shared/ui";

interface MazeListHeaderProps {
    onCreateNew: () => void;
    onOpenImportDialog: () => void;
    onOpenNewFolderDialog: () => void;
}

/**
 * 迷路リストのヘッダーセクション（アクションボタン群）
 */
export function MazeListHeader({
    onCreateNew,
    onOpenImportDialog,
    onOpenNewFolderDialog,
}: MazeListHeaderProps) {
    return (
        <div className="sticky top-0 bg-space-dark border-b border-neon-blue/30">
            <div className="flex items-center justify-end gap-1 px-2 py-1.5">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onCreateNew}
                    className="h-7 w-7 text-neon-cyan hover:bg-neon-cyan/20"
                    title="新規迷路を作成"
                >
                    <Plus className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onOpenNewFolderDialog}
                    className="h-7 w-7 text-neon-green hover:bg-neon-green/20"
                    title="新規フォルダを作成"
                >
                    <FolderPlus className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onOpenImportDialog}
                    className="h-7 w-7 text-neon-purple hover:bg-neon-purple/20"
                    title="迷路を読み込む"
                >
                    <QrCode className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

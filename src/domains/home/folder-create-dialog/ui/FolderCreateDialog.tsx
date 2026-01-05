"use client";

import { FolderPlus } from "lucide-react";
import { Button, Input } from "@/src/shared/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/shared/ui";
import { useFolderCreateDialog } from "../hooks";

/**
 * フォルダ作成ダイアログ
 * フォルダ名を入力し、新しいfolderを作成する
 */
export function FolderCreateDialog() {
    const {
        open,
        folderName,
        closeDialog,
        setFolderName,
        createFolder,
    } = useFolderCreateDialog();

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && closeDialog()}>
            <DialogContent className="sm:max-w-md border-neon-green/30 bg-space-dark">
                <DialogHeader>
                    <DialogTitle className="text-neon-cyan">
                        新しいフォルダを作成
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 p-4">
                    <Input
                        placeholder="フォルダ名を入力"
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                        className="bg-space-darker border-neon-blue/50 text-white"
                    />
                    <Button
                        onClick={createFolder}
                        className="bg-neon-green text-space-dark hover:bg-neon-green/80"
                    >
                        <FolderPlus className="mr-2 h-4 w-4" />
                        作成
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

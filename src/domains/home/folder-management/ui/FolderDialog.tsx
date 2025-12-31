"use client";

import { FolderPlus } from "lucide-react";
import { Button, Input } from "@/src/shared/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/shared/ui";
import type { DialogProps } from "@/src/shared/types";

/** フォルダフォーム状態 */
export interface FolderFormState {
    folderName: string;
    onFolderNameChange: (name: string) => void;
    onSubmit: () => void;
}

interface FolderDialogProps extends DialogProps {
    form: FolderFormState;
    mode: "create" | "rename";
}

/**
 * フォルダ作成/リネームダイアログ
 */
export function FolderDialog({
    open,
    onOpenChange,
    form,
    mode,
}: FolderDialogProps) {
    const { folderName, onFolderNameChange, onSubmit } = form;
    const title = mode === "create" ? "新しいフォルダを作成" : "フォルダ名を変更";
    const buttonText = mode === "create" ? "作成" : "変更";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md border-neon-green/30 bg-space-dark">
                <DialogHeader>
                    <DialogTitle className="text-neon-cyan">
                        {title}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 p-4">
                    <Input
                        placeholder="フォルダ名を入力"
                        value={folderName}
                        onChange={(e) => onFolderNameChange(e.target.value)}
                        className="bg-space-darker border-neon-blue/50 text-white"
                    />
                    <Button
                        onClick={onSubmit}
                        className="bg-neon-green text-space-dark hover:bg-neon-green/80"
                    >
                        <FolderPlus className="mr-2 h-4 w-4" />
                        {buttonText}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

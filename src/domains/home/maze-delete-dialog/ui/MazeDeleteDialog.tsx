"use client";

import { Trash2 } from "lucide-react";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/src/shared/ui";

interface MazeDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mazeName?: string;
    onConfirm: () => void;
}

/**
 * 迷路削除確認ダイアログ
 * 対象の迷路を削除するかどうかを確認し、削除する場合は対象の迷路を削除する
 */
export function MazeDeleteDialog({
    open,
    onOpenChange,
    mazeName,
    onConfirm,
}: MazeDeleteDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md border-red-500/30 bg-space-dark">
                <DialogHeader>
                    <DialogTitle className="text-red-400 flex items-center gap-2">
                        <Trash2 className="h-5 w-5" />
                        迷路の削除
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground pt-2">
                        {mazeName ? (
                            <>
                                「<span className="text-neon-cyan font-medium">{mazeName}</span>」を削除してもよろしいですか？
                            </>
                        ) : (
                            "この迷路を削除してもよろしいですか？"
                        )}
                        <br />
                        この操作は取り消せません。
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:justify-end">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="hover:bg-neon-blue/10 text-muted-foreground hover:text-neon-blue"
                    >
                        キャンセル
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white"
                    >
                        削除する
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import { AlertTriangle } from "lucide-react";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/src/shared/ui";

interface ValidationAlertDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    errorMessage?: string;
}

export function ValidationAlertDialog({
    open,
    onOpenChange,
    errorMessage,
}: ValidationAlertDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md border-neon-yellow/30 bg-space-dark">
                <DialogHeader>
                    <DialogTitle className="text-neon-yellow flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        迷路の検証
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground pt-2 text-base">
                        {errorMessage || "迷路の設定に問題があります。"}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-end">
                    <Button
                        onClick={() => onOpenChange(false)}
                        className="bg-neon-yellow text-space-dark hover:bg-neon-yellow/80 w-full sm:w-auto"
                    >
                        確認
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

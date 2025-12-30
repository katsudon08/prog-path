"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/shared/ui";
import { QRCodeSVG } from "qrcode.react";

interface QRShareDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    qrData: string;
}

/**
 * QRコード共有ダイアログ
 * FSD: widgets層
 */
export function QRShareDialog({ open, onOpenChange, qrData }: QRShareDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md border-neon-purple/30 bg-space-dark">
                <DialogHeader>
                    <DialogTitle className="text-neon-cyan">
                        迷路を共有
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 p-4">
                    <div className="p-4 rounded-lg bg-white">
                        <QRCodeSVG value={qrData} size={200} />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                        このQRコードをスキャンすると迷路を読み込めます
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

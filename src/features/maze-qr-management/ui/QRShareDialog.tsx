"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/shared/ui"
import { QRCodeSVG } from "qrcode.react"
import { useQRShare } from "../model/useQRShare"

/**
 * QRコード共有ダイアログ
 * 迷路データをQRコードとして表示
 */
export function QRShareDialog() {
    const { isOpen, qrData, mazeName, close } = useQRShare()

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
            <DialogContent className="sm:max-w-md border-neon-purple/30 bg-space-dark">
                <DialogHeader>
                    <DialogTitle className="text-neon-cyan">
                        迷路を共有
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 p-4">
                    {qrData && (
                        <div className="p-4 rounded-lg bg-white">
                            <QRCodeSVG value={qrData} size={200} />
                        </div>
                    )}
                    <p className="text-sm text-muted-foreground text-center">
                        {mazeName && `「${mazeName}」の`}QRコードをスキャンすると迷路を読み込めます
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}

"use client";

import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/shared/ui";
import type { DialogProps, CameraState } from "@/src/shared/types";

interface QRImportDialogProps extends DialogProps {
    camera: CameraState;
}

/**
 * QRコードインポートダイアログ（カメラスキャナー）
 */
export function QRImportDialog({
    open,
    onOpenChange,
    camera,
}: QRImportDialogProps) {
    const { videoRef, canvasRef, isStreamReady, cameraError } = camera;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg border-neon-purple/30 bg-space-dark">
                <DialogHeader>
                    <DialogTitle className="text-neon-cyan">
                        迷路を読み込む
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 p-4">
                    {cameraError && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-md text-red-300 w-full">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                            <span className="text-sm">{cameraError}</span>
                        </div>
                    )}
                    <div className="relative w-full aspect-video bg-space-darker rounded-lg overflow-hidden flex items-center justify-center">
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            style={{ transform: "scaleX(-1)" }}
                            playsInline
                            muted
                        />
                        <canvas ref={canvasRef} className="hidden" />
                        {!isStreamReady && !cameraError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-space-darker/80">
                                <div className="text-center">
                                    <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                    <p className="text-sm text-muted-foreground">
                                        カメラを起動中...
                                    </p>
                                </div>
                            </div>
                        )}
                        {isStreamReady && (
                            <>
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-neon-green -translate-x-1 -translate-y-1"></div>
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-neon-green translate-x-1 -translate-y-1"></div>
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-neon-green -translate-x-1 translate-y-1"></div>
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-neon-green translate-x-1 translate-y-1"></div>
                                </div>
                            </>
                        )}
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                        迷路のQRコードをカメラに映すと自動的に読み込まれます
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

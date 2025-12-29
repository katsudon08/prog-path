import type { MazeData } from "@/src/entities/maze"
import { decodeMazeFromQR, isMazeQRCode } from "@/src/features/maze-serialization"
import { saveMazes } from "@/src/features/maze-storage"

/**
 * QRコードデータから迷路をインポート
 */
export function importMazeFromQRCode(
    qrData: string,
    existingMazes: MazeData[]
): { success: boolean; mazes: MazeData[]; maze?: MazeData; error?: string } {
    // 迷路QRコードのチェック
    if (!isMazeQRCode(qrData)) {
        return { success: false, mazes: existingMazes, error: "迷路のQRコードではありません" }
    }

    const decodedMaze = decodeMazeFromQR(qrData)
    if (!decodedMaze) {
        return { success: false, mazes: existingMazes, error: "迷路データのデコードに失敗しました" }
    }

    // 既存の迷路と重複チェック
    if (existingMazes.find(m => m.id === decodedMaze.id)) {
        return { success: false, mazes: existingMazes, error: "この迷路は既に読み込まれています" }
    }

    const updatedMazes = [...existingMazes, decodedMaze]
    saveMazes(updatedMazes)

    return { success: true, mazes: updatedMazes, maze: decodedMaze }
}

/**
 * QRスキャナーの設定
 */
export interface QRScannerConfig {
    scanInterval: number // ms
    inversionAttempts: "dontInvert" | "attemptBoth" | "invertFirst"
}

export const DEFAULT_SCANNER_CONFIG: QRScannerConfig = {
    scanInterval: 300,
    inversionAttempts: "dontInvert",
}

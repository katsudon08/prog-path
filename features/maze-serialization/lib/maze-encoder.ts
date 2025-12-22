import type { MazeData } from "@entities/maze"

/**
 * 迷路データをBase64文字列にエンコード
 */
export function encodeMazeToQR(maze: MazeData): string {
    try {
        const json = JSON.stringify(maze)
        const base64 = btoa(unescape(encodeURIComponent(json))) // UTF-8対応
        return `maze:${base64}`
    } catch (error) {
        console.error("Failed to encode maze:", error)
        throw new Error("迷路のエンコードに失敗しました")
    }
}

/**
 * QRコードの文字列から迷路データをデコード
 */
export function decodeMazeFromQR(qrData: string): MazeData | null {
    try {
        // "maze:"プレフィックスをチェック
        if (!qrData.startsWith("maze:")) {
            return null
        }

        const base64 = qrData.substring(5) // "maze:"を削除
        const json = decodeURIComponent(escape(atob(base64))) // UTF-8対応
        const maze: MazeData = JSON.parse(json)

        // 基本的なバリデーション
        if (!maze.id || !maze.name || !maze.layers || !maze.size) {
            console.error("Invalid maze data structure")
            return null
        }

        return maze
    } catch (error) {
        console.error("Failed to decode maze:", error)
        return null
    }
}

/**
 * QRコードデータが迷路データかどうかを判定
 */
export function isMazeQRCode(qrData: string): boolean {
    return qrData.startsWith("maze:")
}

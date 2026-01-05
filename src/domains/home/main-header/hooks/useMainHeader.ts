"use client"

import { useRouter } from "next/navigation"
import type { MazeData } from "@/src/domains/maze/maze-data/lib/types"
import { useMazeDeleteDialogStore } from "@domains/home/maze-delete-dialog/store"
import { useQRShareStore } from "@domains/home/qr-share/store"

/**
 * メインヘッダーのロジックフック
 * - 迷路編集画面へ遷移
 * - maze-delete-dialogを表示
 * - qr-shareを表示
 * - AR実行画面へ遷移
 */
export function useMainHeader(maze: MazeData) {
    const router = useRouter()
    const mazeDeleteDialog = useMazeDeleteDialogStore()
    const qrShareStore = useQRShareStore()

    // 迷路編集画面へ遷移
    const edit = () => router.push(`/editor?id=${maze.id}`)

    // maze-delete-dialogを表示
    const openDeleteDialog = () => mazeDeleteDialog.openDialog(maze.id)

    // qr-shareを表示
    const share = () => qrShareStore.openDialog(maze)

    // AR実行画面へ遷移
    const runAR = () => router.push(`/ar?id=${maze.id}`)

    return {
        edit,
        openDeleteDialog,
        share,
        runAR,
    }
}

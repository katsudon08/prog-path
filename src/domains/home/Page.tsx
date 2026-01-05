"use client"

import { useEffect } from "react"

// features.md に定義された機能ディレクトリからインポート
import { SideHeader } from "@domains/home/side-header"
import { MazeList } from "@domains/home/maze-list"
import { MazeDeleteDialog } from "@domains/home/maze-delete-dialog"
import { FolderDeleteDialog } from "@domains/home/folder-delete-dialog"
import { MainHeader } from "@domains/home/main-header"
import { MainContent } from "@domains/home/main-content"
import { QRShareDialog } from "@domains/home/qr-share"

// Zustand ストア
import { useMazeStore, useCategoryStore } from "@domains/home/maze-list/store"
import { useMazeDeleteDialogStore } from "@domains/home/maze-delete-dialog/store"
import { useFolderDeleteDialogStore } from "@domains/home/folder-delete-dialog/store"
import { useQRShareStore } from "@domains/home/qr-share/store"

/**
 * ホームドメインのページコンポーネント
 * App Routerのpage.tsxからexportされるエントリポイント
 */
export function HomePage() {
    // 初期化（クライアントサイドでのみ実行）
    const initializeMaze = useMazeStore((s) => s.initialize)
    const initializeCategory = useCategoryStore((s) => s.initialize)
    const isLoaded = useMazeStore((s) => s.isLoaded)

    useEffect(() => {
        initializeMaze()
        initializeCategory()
    }, [initializeMaze, initializeCategory])

    // 初期化完了まで待機
    if (!isLoaded) {
        return (
            <div className="fixed inset-x-0 top-16 bottom-0 bg-background h-[calc(100dvh-4rem)] flex items-center justify-center">
                <div className="text-neon-cyan">Loading...</div>
            </div>
        )
    }

    return <HomePageContent />
}

function HomePageContent() {
    // 迷路ストア
    const mazes = useMazeStore((s) => s.mazes)
    const selectedMaze = useMazeStore((s) => s.selectedMaze)
    const deleteMaze = useMazeStore((s) => s.deleteMaze)

    // ダイアログストア
    const mazeDeleteDialog = useMazeDeleteDialogStore()
    const folderDeleteDialog = useFolderDeleteDialogStore()
    const qrShareStore = useQRShareStore()

    // カテゴリストア（フォルダ削除用）
    const customCategories = useCategoryStore((s) => s.customCategories)
    const setCustomCategories = useCategoryStore((s) => s.setCustomCategories)
    const removeFromExpanded = useCategoryStore((s) => s.removeFromExpanded)
    const setMazes = useMazeStore((s) => s.setMazes)

    // フォルダ削除ハンドラー
    const handleDeleteFolder = (category: string) => {
        // カテゴリを削除
        const updatedCategories = customCategories.filter((c) => c !== category)
        setCustomCategories(updatedCategories)
        removeFromExpanded(category)

        // フォルダ内の迷路を未分類に移動
        const updatedMazes = mazes.map((m) =>
            m.category === category ? { ...m, category: undefined } : m
        )
        setMazes(updatedMazes)
    }

    return (
        <div className="fixed inset-x-0 top-16 bottom-0 bg-background h-[calc(100dvh-4rem)]">
            <div className="flex h-full">
                {/* Left Sidebar */}
                <div className="flex flex-col w-80 border-r border-neon-blue/30">
                    <SideHeader />
                    <MazeList />
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-space-dark/50">
                    {selectedMaze ? (
                        <div className="flex flex-col h-full">
                            <MainHeader maze={selectedMaze} />
                            <MainContent maze={selectedMaze} />
                        </div>
                    ) : (
                        <MainContent maze={null} />
                    )}
                </div>
            </div>

            {/* Dialogs */}
            <MazeDeleteDialog
                open={!!mazeDeleteDialog.mazeToDelete}
                onOpenChange={(open) => !open && mazeDeleteDialog.closeDialog()}
                mazeName={mazeDeleteDialog.mazeToDelete ? mazes.find(m => m.id === mazeDeleteDialog.mazeToDelete)?.name : undefined}
                onConfirm={() => mazeDeleteDialog.confirmDelete(deleteMaze)}
            />
            <FolderDeleteDialog
                open={!!folderDeleteDialog.folderToDelete}
                onOpenChange={(open) => !open && folderDeleteDialog.closeDialog()}
                folderName={folderDeleteDialog.folderToDelete ?? undefined}
                onConfirm={() => folderDeleteDialog.confirmDelete(handleDeleteFolder)}
            />
            <QRShareDialog
                open={qrShareStore.showDialog}
                onOpenChange={(open) => !open && qrShareStore.closeDialog()}
                qrData={qrShareStore.qrData}
            />
        </div>
    )
}

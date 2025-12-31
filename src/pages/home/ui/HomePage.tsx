"use client"

import { useRouter } from "next/navigation"
import { MazeList, MazeListHeader, MazeProvider, useMazeContext } from "@domains/home/maze-list"
import { MazeEmptyState } from "@domains/home/empty-state"
import { MazeDetailHeader, MazeDetailPreview } from "@domains/home/maze-preview"
import { QRShareDialog } from "@domains/home/qr-share"
import { QRImportDialog } from "@domains/home/qr-import"
import { FolderDialog } from "@domains/home/folder-management"
import { useSidebarState } from "../model/useSidebarState"
import { useDialogState } from "../model/useDialogState"

/**
 * ホームページ
 * FSD: pages層 - widgetsを配置しContextで状態共有
 */
export function HomePage() {
    return (
        <MazeProvider>
            <HomePageContent />
        </MazeProvider>
    )
}

function HomePageContent() {
    const router = useRouter()
    const { selectedMaze, selectMaze, deleteMaze } = useMazeContext()
    const sidebar = useSidebarState()
    const dialogs = useDialogState()

    const createNew = () => router.push("/editor")
    const editMaze = (id: string) => router.push(`/editor?id=${id}`)
    const runAR = (id: string) => router.push(`/ar?id=${id}`)

    return (
        <div className="fixed inset-x-0 top-16 bottom-0 bg-background h-[calc(100dvh-4rem)]">
            <div className="flex h-full">
                {/* Left Sidebar */}
                <div className="flex flex-col w-80 border-r border-neon-blue/30">
                    <MazeListHeader
                        onCreateNew={createNew}
                        onOpenImportDialog={dialogs.openImportDialog}
                        onOpenNewFolderDialog={sidebar.openNewFolderDialog}
                    />
                    <MazeList
                        data={{
                            groupedMazes: sidebar.groupedMazes,
                            customCategories: sidebar.customCategories,
                            selectedMaze,
                            expandedCategories: sidebar.expandedCategories,
                        }}
                        onSelectMaze={selectMaze}
                        categoryHandlers={{
                            onToggleCategory: sidebar.toggleCategory,
                            onDeleteFolder: sidebar.deleteFolder,
                        }}
                        renameState={{
                            editingCategory: sidebar.editingCategory,
                            editingName: sidebar.editingName,
                            onStartRename: sidebar.startRename,
                            onSaveRename: sidebar.saveRename,
                            onCancelRename: sidebar.cancelRename,
                            onSetEditingName: sidebar.setEditingName,
                        }}
                        dndHandlers={{
                            onDragStart: sidebar.dragStart,
                            onDragOver: sidebar.dragOver,
                            onDragLeave: sidebar.dragLeave,
                            onDrop: sidebar.drop,
                        }}
                    />
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-space-dark/50">
                    {selectedMaze ? (
                        <div className="flex flex-col h-full">
                            <MazeDetailHeader
                                maze={selectedMaze}
                                actions={{
                                    onShare: dialogs.shareMaze,
                                    onEdit: () => editMaze(selectedMaze.id),
                                    onDelete: () => deleteMaze(selectedMaze.id),
                                    onRunAR: () => runAR(selectedMaze.id),
                                }}
                            />
                            <MazeDetailPreview maze={selectedMaze} />
                        </div>
                    ) : (
                        <MazeEmptyState onCreateNew={createNew} />
                    )}
                </div>
            </div>

            {/* Dialogs */}
            <QRShareDialog
                open={dialogs.showQRDialog}
                onOpenChange={(open) => !open && dialogs.closeQRDialog()}
                qrData={dialogs.qrData}
            />
            <QRImportDialog
                open={dialogs.showImportDialog}
                onOpenChange={(open) => !open && dialogs.closeImportDialog()}
                camera={{
                    videoRef: dialogs.videoRef,
                    canvasRef: dialogs.canvasRef,
                    isStreamReady: dialogs.isStreamReady,
                    cameraError: dialogs.cameraError,
                }}
            />
            <FolderDialog
                open={sidebar.showNewFolderDialog}
                onOpenChange={(open) => !open && sidebar.closeNewFolderDialog()}
                form={{
                    folderName: sidebar.newFolderName,
                    onFolderNameChange: sidebar.setNewFolderName,
                    onSubmit: sidebar.createFolder,
                }}
                mode="create"
            />
        </div>
    )
}

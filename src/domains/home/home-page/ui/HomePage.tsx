"use client"

import { useRouter } from "next/navigation"
import { MazeList, MazeListHeader, MazeProvider, useMazeContext } from "@domains/home/maze-list"
import { MazeEmptyState } from "@domains/home/empty-state"
import { MazeDetailHeader, MazeDetailPreview } from "@domains/home/maze-preview"
import { QRShareDialog } from "@domains/home/qr-share"
import { QRImportDialog } from "@domains/home/qr-import"
import { FolderDialog } from "@domains/home/folder-management"
import { MazeDeleteDialog } from "@domains/home/maze-list/ui/MazeDeleteDialog"
import { useSidebarState, useDialogState } from "../hooks"

/**
 * ホームページコンポーネント
 * Screaming Architecture: domains/home配下のPages層
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
    const { mazes, selectedMaze, selectMaze, deleteMaze } = useMazeContext()
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
                        onDeleteMaze={dialogs.openDeleteDialog}
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
                                    onShare: () => dialogs.shareMaze(selectedMaze),
                                    onEdit: () => editMaze(selectedMaze.id),
                                    onDelete: () => dialogs.openDeleteDialog(selectedMaze.id),
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
            <MazeDeleteDialog
                open={!!dialogs.mazeToDelete}
                onOpenChange={(open) => !open && dialogs.closeDeleteDialog()}
                mazeName={dialogs.mazeToDelete ? mazes.find(m => m.id === dialogs.mazeToDelete)?.name : undefined}
                onConfirm={() => {
                    if (dialogs.mazeToDelete) {
                        deleteMaze(dialogs.mazeToDelete);
                    }
                }}
            />
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
                    startCamera: dialogs.startCamera,
                    stopCamera: dialogs.stopCamera,
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

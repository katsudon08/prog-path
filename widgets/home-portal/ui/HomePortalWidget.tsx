"use client";

import { Button } from "@shared/ui";
import { Card } from "@shared/ui";
import { Plus, Play, ChevronRight, QrCode, Upload, X, AlertTriangle, ChevronDown, FolderPlus, Folder, Trash2 } from "lucide-react";
import { Input } from "@shared/ui";
import { MazePreview } from "@entities/maze";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@shared/ui";
import { QRCodeSVG } from "qrcode.react";
import { useHomePortalState } from "@features/home-portal-state";

/**
 * ホームポータルウィジェット
 * FSD: widgets層 - 純粋な合成層（UIのみ）
 */
export function HomePortalWidget() {
    const {
        mazes,
        selectedMaze,
        groupedMazes,
        customCategories,
        expandedCategories,
        editingCategory,
        editingName,
        newFolderName,
        showNewFolderDialog,
        showQRDialog,
        qrData,
        showImportDialog,
        videoRef,
        canvasRef,
        isStreamReady,
        cameraError,
        handlers,
    } = useHomePortalState();

    return (
        <div className="fixed inset-0 top-16 bg-background">
            <div className="flex h-full">
                {/* Left Sidebar - Maze List */}
                <div className="flex flex-col w-80 border-r border-neon-blue/30">
                    {/* Fixed Header */}
                    <div className="sticky top-0 bg-space-dark">
                        <div className="p-6 border-b border-neon-blue/30">
                            <h2 className="mb-4 text-2xl font-bold text-neon-cyan">
                                迷路一覧
                            </h2>
                            <Button
                                onClick={handlers.createNew}
                                className="w-full bg-neon-cyan text-space-dark hover:bg-neon-cyan/80"
                            >
                                <Plus className="mr-2 h-5 w-5" />
                                新規作成
                            </Button>
                            <Button
                                onClick={handlers.openImportDialog}
                                className="w-full mt-2 border border-neon-purple text-neon-purple bg-neon-purple/10 hover:bg-neon-purple/30"
                            >
                                <Upload className="mr-2 h-5 w-5" />
                                迷路を読み込む
                            </Button>
                            <Button
                                onClick={handlers.openNewFolderDialog}
                                variant="outline"
                                className="w-full mt-2 border-neon-green text-neon-green hover:text-neon-green bg-neon-green/10 hover:bg-neon-green/30"
                            >
                                <FolderPlus className="mr-2 h-5 w-5" />
                                フォルダ作成
                            </Button>
                        </div>
                    </div>

                    {/* Scrollable List */}
                    <div className="flex-1 overflow-y-auto bg-space-dark">
                        <div>
                            {Object.entries(groupedMazes).sort((a, b) => {
                                if (a[0] === "未分類") return 1;
                                if (b[0] === "未分類") return -1;
                                return a[0].localeCompare(b[0]);
                            }).map(([category, categoryMazes]) => (
                                <div
                                    key={category}
                                    onDragOver={handlers.dragOver}
                                    onDragLeave={handlers.dragLeave}
                                    onDrop={(e) => handlers.drop(e, category)}
                                    className="transition-colors duration-200"
                                >
                                    <div
                                        className="flex items-center gap-2 px-6 py-2 cursor-pointer bg-space-darker border-b border-neon-blue/20 hover:bg-space-dark/50"
                                        onClick={() => handlers.toggleCategory(category)}
                                    >
                                        <ChevronDown
                                            className={`h-4 w-4 text-neon-cyan transition-transform ${
                                                expandedCategories.has(category) ? "" : "-rotate-90"
                                            }`}
                                        />
                                        <Folder className="h-4 w-4 text-neon-green" />
                                        {editingCategory === category ? (
                                            <Input
                                                value={editingName}
                                                onChange={(e) => handlers.setEditingName(e.target.value)}
                                                onBlur={handlers.saveRename}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handlers.saveRename();
                                                    if (e.key === "Escape") handlers.cancelRename();
                                                }}
                                                className="h-6 py-0 px-1 text-sm bg-space-dark border-neon-blue/50"
                                                autoFocus
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            <span
                                                className="flex-1 text-sm font-medium text-neon-cyan"
                                                onDoubleClick={(e) => {
                                                    e.stopPropagation();
                                                    if (category !== "未分類") handlers.startRename(category);
                                                }}
                                            >
                                                {category}
                                            </span>
                                        )}
                                        <span className="text-xs text-muted-foreground">
                                            {categoryMazes.length}
                                        </span>
                                        {category !== "未分類" && customCategories.includes(category) && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlers.deleteFolder(category);
                                                }}
                                                className="p-1 hover:bg-red-500/20 rounded"
                                                title="フォルダを削除"
                                            >
                                                <Trash2 className="h-3 w-3 text-red-400 hover:text-red-300" />
                                            </button>
                                        )}
                                    </div>
                                    {expandedCategories.has(category) && (
                                        <div className="p-2 space-y-2">
                                            {categoryMazes.map((maze) => (
                                                <Card
                                                    key={maze.id}
                                                    className={`p-3 cursor-pointer border transition-all hover:border-neon-cyan/50 ${
                                                        selectedMaze?.id === maze.id
                                                            ? "border-neon-cyan bg-neon-cyan/10"
                                                            : "border-neon-blue/30"
                                                    }`}
                                                    onClick={() => handlers.selectMaze(maze)}
                                                    draggable
                                                    onDragStart={(e) => handlers.dragStart(e, maze.id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-16 h-16 rounded bg-space-darker flex items-center justify-center overflow-hidden">
                                                            <MazePreview
                                                                grid={maze.layers[maze.currentLayer ?? 0]}
                                                                cellSize={4}
                                                                showNavigation={false}
                                                                compact={true}
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-medium text-neon-cyan truncate">
                                                                {maze.name}
                                                            </h4>
                                                            <p className="text-xs text-muted-foreground truncate">
                                                                {maze.layers[maze.currentLayer ?? 0].length}×
                                                                {maze.layers[maze.currentLayer ?? 0][0]?.length || 0}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-space-dark/50">
                    {selectedMaze ? (
                        <div className="flex flex-col h-full">
                            <div className="p-6 border-b border-neon-blue/30">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h1 className="text-3xl font-bold text-neon-cyan">
                                            {selectedMaze.name}
                                        </h1>
                                        <p className="text-muted-foreground mt-1">
                                            サイズ: {selectedMaze.layers[selectedMaze.currentLayer ?? 0].length}×
                                            {selectedMaze.layers[selectedMaze.currentLayer ?? 0][0]?.length || 0} <br/>
                                            レイヤー: {selectedMaze.layers.length}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => handlers.shareMaze(selectedMaze)}
                                            className="border-neon-purple text-neon-purple hover:bg-neon-purple/20"
                                        >
                                            <QrCode className="mr-2 h-4 w-4" />
                                            共有
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => handlers.editMaze(selectedMaze.id)}
                                            className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20"
                                        >
                                            <ChevronRight className="mr-2 h-4 w-4" />
                                            編集
                                        </Button>
                                        <Button
                                            onClick={() => handlers.runAR(selectedMaze.id)}
                                            className="bg-neon-green text-space-dark hover:bg-neon-green/80"
                                        >
                                            <Play className="mr-2 h-4 w-4" />
                                            AR実行
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-hidden">
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <div className="absolute -inset-4 bg-gradient-to-r from-neon-cyan/20 via-neon-purple/20 to-neon-green/20 blur-xl"></div>
                                    <div 
                                        className="relative bg-space-darker p-4 rounded-lg border border-neon-blue/50 overflow-hidden"
                                        style={{ 
                                            maxWidth: 'min(450px, calc(100vw - 480px))', 
                                            maxHeight: 'min(300px, calc(100vh - 350px))',
                                        }}
                                    >
                                        <MazePreview
                                            layers={selectedMaze.layers}
                                            layerIndex={selectedMaze.currentLayer ?? 0}
                                            maxWidth={400}
                                            maxHeight={250}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-neon-cyan/10 flex items-center justify-center">
                                    <Plus className="w-12 h-12 text-neon-cyan" />
                                </div>
                                <h2 className="text-xl font-semibold text-neon-cyan mb-2">
                                    迷路を選択してください
                                </h2>
                                <p className="text-muted-foreground mb-4">
                                    または新しい迷路を作成しましょう
                                </p>
                                <Button
                                    onClick={handlers.createNew}
                                    className="bg-neon-cyan text-space-dark hover:bg-neon-cyan/80"
                                >
                                    <Plus className="mr-2 h-5 w-5" />
                                    新規作成
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* QR Dialog */}
            <Dialog open={showQRDialog} onOpenChange={handlers.closeQRDialog}>
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

            {/* Import Dialog */}
            <Dialog open={showImportDialog} onOpenChange={handlers.closeImportDialog}>
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

            {/* New Folder Dialog */}
            <Dialog open={showNewFolderDialog} onOpenChange={handlers.closeNewFolderDialog}>
                <DialogContent className="sm:max-w-md border-neon-green/30 bg-space-dark">
                    <DialogHeader>
                        <DialogTitle className="text-neon-cyan">
                            新しいフォルダを作成
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 p-4">
                        <Input
                            placeholder="フォルダ名を入力"
                            value={newFolderName}
                            onChange={(e) => handlers.setNewFolderName(e.target.value)}
                            className="bg-space-darker border-neon-blue/50 text-white"
                        />
                        <Button
                            onClick={handlers.createFolder}
                            className="bg-neon-green text-space-dark hover:bg-neon-green/80"
                        >
                            <FolderPlus className="mr-2 h-4 w-4" />
                            作成
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
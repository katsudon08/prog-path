"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@shared/ui"
import { Card } from "@shared/ui"
import { Input } from "@shared/ui"
import { Label } from "@shared/ui"
import { Save, ArrowLeft } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import type { TileType } from "@entities/maze"
import { getInitialMazes } from "@entities/maze"
import { loadMazes } from "@features/maze-storage"

// Features
import { TilePalette } from "@features/tile-palette"
import { GridEditor, useMazeGridEditor } from "@features/maze-grid-editor"
import { LayerNavigator, useLayerManagement } from "@features/layer-management"
import { useMazePersistence } from "@features/maze-persistence"

/**
 * 迷路エディタWidget
 * FSD合成レイヤー - 全機能をまとめて表示
 */
export function MazeEditorWidget() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const mazeId = searchParams.get("id")

    // States
    const [mazeName, setMazeName] = useState("新しい迷路")
    const [gridSize, setGridSize] = useState(5)
    const [layers, setLayers] = useState<TileType[][][]>([[]])
    const [currentLayer, setCurrentLayer] = useState(0)
    const [selectedTile, setSelectedTile] = useState<TileType>("floor")

    // Custom hooks
    const { initializeGrid, handleTileClick } = useMazeGridEditor({
        layers,
        setLayers,
        currentLayer,
        selectedTile,
    })

    const layerManagement = useLayerManagement({
        layers,
        setLayers,
        currentLayer,
        setCurrentLayer,
        gridSize,
    })

    const { handleSave } = useMazePersistence({
        mazeId,
        mazeName,
        gridSize,
        layers,
        currentLayer,
        onSaveSuccess: () => router.push("/"),
    })

    // 初期化（mazeIdのみに依存）
    useEffect(() => {
        let mazes = loadMazes()

        if (mazes.length === 0) {
            const initialMazes = getInitialMazes()
            localStorage.setItem("progpath_mazes", JSON.stringify(initialMazes))
            mazes = initialMazes
        }

        if (mazeId) {
            const maze = mazes.find((m) => m.id === mazeId)
            if (maze) {
                setMazeName(maze.name)
                setGridSize(maze.size)
                setLayers(maze.layers)
                setCurrentLayer(maze.currentLayer || 0)
                return
            }
        }

        // 新規迷路 - 初期サイズ5で初期化
        setLayers(initializeGrid(5))
    }, [mazeId, initializeGrid])

    // サイズ変更
    const handleSizeChange = useCallback((newSize: number) => {
        if (newSize < 5 || newSize > 10) return
        setGridSize(newSize)
        setLayers(initializeGrid(newSize))
    }, [initializeGrid])

    return (
        <div className="h-[100dvh] bg-background pt-16 flex flex-col overflow-hidden">
            <div className="container mx-auto px-4 py-3 flex-1 flex flex-col min-h-0">
                {/* Header - コンパクト化 */}
                <div className="flex items-center justify-between mb-3">
                    <Button
                        onClick={() => router.push("/")}
                        variant="outline"
                        size="sm"
                        className="border-neon-blue text-neon-blue"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        戻る
                    </Button>
                    
                    {/* 迷路名入力 - ヘッダーに統合 */}
                    <div className="flex items-center gap-2">
                        <Label htmlFor="maze-name" className="text-neon-cyan text-sm">
                            迷路名:
                        </Label>
                        <Input
                            id="maze-name"
                            value={mazeName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setMazeName(e.target.value)
                            }
                            className="w-48 h-8 border-neon-blue/30 bg-space-blue/20 text-foreground text-sm"
                        />
                    </div>
                    
                    <div className="flex gap-2">
                        <Button
                            onClick={handleSave}
                            size="sm"
                            className="bg-neon-cyan text-space-dark hover:bg-neon-cyan/80"
                        >
                            <Save className="mr-1 h-4 w-4" />
                            保存
                        </Button>
                    </div>
                </div>

                {/* Main Content - 2カラムレイアウト */}
                <div className="flex-1 grid gap-4 lg:grid-cols-[1fr_240px] min-h-0">
                    {/* Main Editor Area */}
                    <Card className="border-neon-blue/30 bg-space-dark/50 p-4 flex flex-col min-h-0">
                        {/* Grid Editor with Controls */}
                        <div className="flex-1 flex flex-col items-center justify-center min-h-0 gap-2">
                            {/* 階層コントロール - 迷路の上 */}
                            <LayerNavigator
                                currentLayer={currentLayer}
                                totalLayers={layers.length}
                                onGoToPrev={layerManagement.goToPrevLayer}
                                onGoToNext={layerManagement.goToNextLayer}
                                onAddLayer={layerManagement.handleAddLayer}
                                onRemoveLayer={layerManagement.handleRemoveLayer}
                                canGoPrev={layerManagement.canGoPrev}
                                canGoNext={layerManagement.canGoNext}
                                canAddLayer={layerManagement.canAddLayer}
                                canRemoveLayer={layerManagement.canRemoveLayer}
                            />

                            {/* サイズ表示 */}
                            <Label className="text-neon-cyan text-sm">
                                サイズ: {gridSize}×{gridSize}
                            </Label>

                            {/* 迷路グリッドとサイズボタン - 横並び */}
                            <div className="flex items-center gap-6">
                                {/* 左側: サイズ縮小ボタン */}
                                <Button
                                    onClick={() => handleSizeChange(gridSize - 1)}
                                    variant="outline"
                                    size="sm"
                                    className="border-neon-blue text-neon-blue h-10 w-10 p-0"
                                    disabled={gridSize <= 5}
                                >
                                    -
                                </Button>

                                {/* 迷路グリッド */}
                                <GridEditor
                                    grid={layers[currentLayer]}
                                    onTileClick={handleTileClick}
                                    maxWidth={500}
                                    maxHeight={320}
                                />

                                {/* 右側: サイズ拡大ボタン */}
                                <Button
                                    onClick={() => handleSizeChange(gridSize + 1)}
                                    variant="outline"
                                    size="sm"
                                    className="border-neon-blue text-neon-blue h-10 w-10 p-0"
                                    disabled={gridSize >= 10}
                                >
                                    +
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Tile Palette - コンパクト化 */}
                    <Card className="border-neon-blue/30 bg-space-dark/50 p-3 flex flex-col min-h-0">
                        <h3 className="mb-2 text-sm font-bold text-neon-cyan">
                            タイルパレット
                        </h3>
                        <div className="flex-1">
                            <TilePalette
                                selectedTile={selectedTile}
                                onSelectTile={setSelectedTile}
                            />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}


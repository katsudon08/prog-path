"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, ArrowLeft, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type { MazeData, TileType } from "@/lib/types";
import { getInitialMazes } from "@/lib/initial-mazes"; // --- 修正：インポートを追加 ---

const TILE_TYPES: { type: TileType; label: string; color: string }[] = [
    { type: "floor", label: "床", color: "bg-space-blue/30" },
    { type: "wall", label: "壁", color: "bg-neon-blue/50" },
    {
        type: "hole",
        label: "穴",
        color: "bg-neon-purple border border-purple-900",
    },
    { type: "start", label: "スタート", color: "bg-neon-green" },
    { type: "goal", label: "ゴール", color: "bg-neon-red" },
];

export function MazeEditor() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mazeId = searchParams.get("id");

    const [mazeName, setMazeName] = useState("新しい迷路");
    const [gridSize, setGridSize] = useState(5);
    const [grid, setGrid] = useState<TileType[][]>([]);
    const [selectedTile, setSelectedTile] = useState<TileType>("floor");
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        // --- 修正箇所：初回ロード時にlocalStorageを初期化 ---
        const stored = localStorage.getItem("progpath_mazes");
        if (!stored) {
            const initialMazes = getInitialMazes();
            localStorage.setItem("progpath_mazes", JSON.stringify(initialMazes));
        }
        // --- 修正終了 ---

        if (mazeId) {
            // Load existing maze
            // (初期化された可能性のある)localStorageを読み込む
            const mazesList = localStorage.getItem("progpath_mazes");
            if (mazesList) {
                const mazes: MazeData[] = JSON.parse(mazesList);
                const maze = mazes.find((m) => m.id === mazeId);
                if (maze) {
                    setMazeName(maze.name);
                    setGridSize(maze.size);
                    setGrid(maze.grid);
                    return;
                }
            }
        }
        // Create new maze
        initializeGrid(gridSize);
    }, [mazeId]);

    const initializeGrid = (size: number) => {
        const newGrid: TileType[][] = Array(size)
            .fill(null)
            .map(() => Array(size).fill("floor"));
        // Set default start and goal
        newGrid[0][0] = "start";
        newGrid[size - 1][size - 1] = "goal";
        setGrid(newGrid);
    };

    const handleTileClick = (row: number, col: number) => {
        const newGrid = [...grid];
        newGrid[row][col] = selectedTile;
        setGrid(newGrid);
    };

    const handleTileMouseEnter = (row: number, col: number) => {
        if (isDrawing) {
            handleTileClick(row, col);
        }
    };

    const handleSave = () => {
        // --- 修正箇所：スタートとゴールの数をチェック ---
        const flatGrid = grid.flat();
        const startCount = flatGrid.filter((tile) => tile === "start").length;
        const goalCount = flatGrid.filter((tile) => tile === "goal").length;

        if (startCount !== 1) {
            alert(
                startCount === 0
                    ? "スタートタイルを1つ配置してください。"
                    : "スタートタイルは1つだけ配置してください。"
            );
            return; // 保存処理を中断
        }

        if (goalCount !== 1) {
            alert(
                goalCount === 0
                    ? "ゴールタイルを1つ配置してください。"
                    : "ゴールタイルは1つだけ配置してください。"
            );
            return; // 保存処理を中断
        }
        // --- 修正終了 ---

        const stored = localStorage.getItem("progpath_mazes");
        const mazes: MazeData[] = stored ? JSON.parse(stored) : [];

        if (mazeId) {
            // Update existing maze
            const index = mazes.findIndex((m) => m.id === mazeId);
            if (index !== -1) {
                mazes[index] = {
                    id: mazeId,
                    name: mazeName,
                    size: gridSize,
                    grid,
                };
            }
        } else {
            // Create new maze
            const newMaze: MazeData = {
                id: `maze_${Date.now()}`,
                name: mazeName,
                size: gridSize,
                grid,
            };
            mazes.push(newMaze);
        }

        localStorage.setItem("progpath_mazes", JSON.stringify(mazes));
        router.push("/");
    };

    const handleDelete = () => {
        if (mazeId && confirm("この迷路を削除しますか？")) {
            const stored = localStorage.getItem("progpath_mazes");
            if (stored) {
                const mazes: MazeData[] = JSON.parse(stored);
                const filtered = mazes.filter((m) => m.id !== mazeId);
                localStorage.setItem(
                    "progpath_mazes",
                    JSON.stringify(filtered)
                );
            }
            router.push("/");
        }
    };

    const handleSizeChange = (newSize: number) => {
        if (newSize < 5 || newSize > 10) return;
        setGridSize(newSize);
        initializeGrid(newSize);
    };

    const getTileColor = (tile: TileType) => {
        const tileType = TILE_TYPES.find((t) => t.type === tile);
        return tileType?.color || "bg-space-blue/30";
    };

    return (
        <div className="min-h-screen bg-background pt-16">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <Button
                        onClick={() => router.push("/")}
                        variant="outline"
                        className="border-neon-blue text-neon-blue"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        戻る
                    </Button>
                    <div className="flex gap-2">
                        {mazeId && (
                            <Button
                                onClick={handleDelete}
                                variant="outline"
                                className="border-neon-red text-neon-red bg-transparent"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                削除
                            </Button>
                        )}
                        <Button
                            onClick={handleSave}
                            className="bg-neon-cyan text-space-dark hover:bg-neon-cyan/90"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            保存
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
                    {/* Main Editor Area */}
                    <Card className="border-neon-blue/30 bg-space-dark/50 p-6">
                        <div className="mb-6">
                            <Label
                                htmlFor="maze-name"
                                className="text-neon-cyan"
                            >
                                迷路名
                            </Label>
                            <Input
                                id="maze-name"
                                value={mazeName}
                                onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>
                                ) => setMazeName(e.target.value)}
                                className="mt-2 border-neon-blue/30 bg-space-blue/20 text-foreground"
                            />
                        </div>

                        <div className="mb-6">
                            <Label className="text-neon-cyan">
                                グリッドサイズ: {gridSize}x{gridSize}
                            </Label>
                            <div className="mt-2 flex items-center gap-4">
                                <Button
                                    onClick={() =>
                                        handleSizeChange(gridSize - 1)
                                    }
                                    variant="outline"
                                    size="sm"
                                    className="border-neon-blue text-neon-blue"
                                    disabled={gridSize <= 5}
                                >
                                    -
                                </Button>
                                <span className="text-foreground">
                                    {gridSize}
                                </span>
                                <Button
                                    onClick={() =>
                                        handleSizeChange(gridSize + 1)
                                    }
                                    variant="outline"
                                    size="sm"
                                    className="border-neon-blue text-neon-blue"
                                    disabled={gridSize >= 10}
                                >
                                    +
                                </Button>
                            </div>
                        </div>

                        {/* Grid Editor */}
                        <div className="flex justify-center">
                            <div
                                className="inline-flex flex-col gap-1 rounded-lg border-2 border-neon-cyan/30 bg-space-dark p-4"
                                onMouseLeave={() => setIsDrawing(false)}
                            >
                                {grid.map((row, rowIndex) => (
                                    <div key={rowIndex} className="flex gap-1">
                                        {row.map((tile, colIndex) => (
                                            <button
                                                key={`${rowIndex}-${colIndex}`}
                                                className={`h-12 w-12 rounded border-2 border-neon-blue/20 transition-all hover:border-neon-cyan hover:scale-105 ${getTileColor(
                                                    tile
                                                )}`}
                                                onMouseDown={() => {
                                                    setIsDrawing(true);
                                                    handleTileClick(
                                                        rowIndex,
                                                        colIndex
                                                    );
                                                }}
                                                onMouseUp={() =>
                                                    setIsDrawing(false)
                                                }
                                                onMouseEnter={() =>
                                                    handleTileMouseEnter(
                                                        rowIndex,
                                                        colIndex
                                                    )
                                                }
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Tile Palette */}
                    <Card className="border-neon-blue/30 bg-space-dark/50 p-6">
                        <h3 className="mb-4 text-lg font-bold text-neon-cyan">
                            タイルパレット
                        </h3>
                        <div className="space-y-2">
                            {TILE_TYPES.map((tileType) => (
                                <button
                                    key={tileType.type}
                                    onClick={() =>
                                        setSelectedTile(tileType.type)
                                    }
                                    className={`flex w-full items-center gap-3 rounded-lg border-2 p-3 transition-all hover:scale-105 ${
                                        selectedTile === tileType.type
                                            ? "border-neon-cyan bg-neon-cyan/10"
                                            : "border-neon-blue/30 bg-space-blue/20"
                                    }`}
                                >
                                    <div
                                        className={`h-8 w-8 rounded ${tileType.color}`}
                                    />
                                    <span className="text-foreground">
                                        {tileType.label}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-6 rounded-lg border border-neon-blue/30 bg-space-blue/20 p-4">
                            <h4 className="mb-2 text-sm font-semibold text-neon-cyan">
                                使い方
                            </h4>
                            <ul className="space-y-1 text-xs text-muted-foreground">
                                <li>• タイルをクリックして配置</li>
                                <li>• ドラッグで連続配置</li>
                                <li>• スタートとゴールは必須</li>
                            </ul>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
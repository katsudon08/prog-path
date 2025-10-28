"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Play, ChevronRight } from "lucide-react";
import { MazePreview } from "@/components/maze-preview";
import { useRouter } from "next/navigation";
import type { MazeData } from "@/lib/types";
import { getInitialMazes } from "@/lib/initial-mazes";

export function HomeScreen() {
    const [mazes, setMazes] = useState<MazeData[]>([]);
    const [selectedMaze, setSelectedMaze] = useState<MazeData | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Load mazes from localStorage or use initial mazes
        const stored = localStorage.getItem("progpath_mazes");
        if (stored) {
            const loadedMazes = JSON.parse(stored);
            setMazes(loadedMazes);
            if (loadedMazes.length > 0) {
                setSelectedMaze(loadedMazes[0]);
            }
        } else {
            const initialMazes = getInitialMazes();
            setMazes(initialMazes);
            localStorage.setItem(
                "progpath_mazes",
                JSON.stringify(initialMazes)
            );
            if (initialMazes.length > 0) {
                setSelectedMaze(initialMazes[0]);
            }
        }
    }, []);

    const handleCreateNew = () => {
        router.push("/editor");
    };

    const handleEditMaze = (id: string) => {
        router.push(`/editor?id=${id}`);
    };

    const handleRunAR = (id: string) => {
        router.push(`/ar?id=${id}`);
    };

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
                                onClick={handleCreateNew}
                                className="w-full bg-neon-cyan text-space-dark hover:bg-neon-cyan/90"
                            >
                                <Plus className="mr-2 h-5 w-5" />
                                新規作成
                            </Button>
                        </div>
                    </div>

                    {/* Scrollable List */}
                    <div className="flex-1 overflow-y-auto bg-space-dark">
                        <div>
                            {mazes.map((maze) => (
                                <button
                                    key={maze.id}
                                    onClick={() => setSelectedMaze(maze)}
                                    className={`w-full border-b border-neon-blue/20 p-4 text-left transition-all hover:bg-neon-blue/10 ${
                                        selectedMaze?.id === maze.id
                                            ? "bg-neon-blue/20 border-l-4 border-l-neon-cyan"
                                            : ""
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-neon-cyan">
                                            {maze.name}
                                        </span>
                                        <ChevronRight className="h-5 w-5 text-neon-blue" />
                                    </div>
                                    <div className="mt-1 text-sm text-muted-foreground">
                                        {maze.grid.length}×
                                        {maze.grid[0]?.length || 0} グリッド
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side - Maze Details */}
                <div className="flex-1 overflow-y-auto">
                    <div className="min-h-screen bg-background">
                        {selectedMaze ? (
                            <div className="container mx-auto px-8 py-4">
                                <h2 className="mb-6 text-3xl font-bold text-neon-cyan">
                                    {selectedMaze.name}
                                </h2>

                                {/* Maze Preview */}
                                <Card className="mb-6 border-neon-blue/30 bg-space-dark/50 backdrop-blur-sm p-8">
                                    <h3 className="mb-4 text-xl font-semibold text-neon-blue">
                                        迷路プレビュー
                                    </h3>
                                    <div className="flex justify-center">
                                        <div className="max-w-2xl">
                                            <MazePreview
                                                grid={selectedMaze.grid}
                                            />
                                        </div>
                                    </div>
                                </Card>

                                {/* Maze Info */}
                                <Card className="mb-6 border-neon-blue/30 bg-space-dark/50 backdrop-blur-sm p-6">
                                    <h3 className="mb-4 text-xl font-semibold text-neon-blue">
                                        迷路情報
                                    </h3>
                                    <div className="space-y-2 text-muted-foreground">
                                        <div className="flex justify-between">
                                            <span>グリッドサイズ:</span>
                                            <span className="text-neon-cyan">
                                                {selectedMaze.grid.length} ×{" "}
                                                {selectedMaze.grid[0]?.length ||
                                                    0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>迷路ID:</span>
                                            <span className="font-mono text-sm text-neon-cyan">
                                                {selectedMaze.id}
                                            </span>
                                        </div>
                                    </div>
                                </Card>

                                {/* Action Buttons */}
                                <div className="flex gap-4">
                                    <Button
                                        onClick={() =>
                                            handleEditMaze(selectedMaze.id)
                                        }
                                        variant="outline"
                                        size="lg"
                                        className="flex-1 border-neon-blue text-neon-blue hover:bg-neon-blue/10"
                                    >
                                        編集
                                    </Button>
                                    <Button
                                        onClick={() =>
                                            handleRunAR(selectedMaze.id)
                                        }
                                        size="lg"
                                        className="flex-1 bg-neon-green text-space-dark hover:bg-neon-green/90"
                                    >
                                        <Play className="mr-2 h-5 w-5" />
                                        AR実行
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <p className="text-muted-foreground">
                                    迷路を選択してください
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

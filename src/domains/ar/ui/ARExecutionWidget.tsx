"use client";

import React, { useEffect, useCallback, useRef } from "react";
import { Button, Card, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/src/shared/ui";
import { ArrowLeft, Play, RotateCcw, Trophy, AlertTriangle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type { MazeData } from "@/src/entities/maze";
import type { Command } from "@/src/entities/robot";

// Features from domains/ar
import { CommandStack, useCommandBuilder } from "@domains/ar/command-builder";
import { useMazeRunner } from "@domains/ar/maze-runner";

// Widgets from domains/ar
import { MazeView3DWidget } from "@domains/ar/maze-view-3d";
import { MinimapViewWidget } from "@domains/ar/minimap";

/**
 * ARExecutionWidget
 * 作成したfeaturesとwidgetsを統合したAR実行画面ウィジェット
 */
export function ARExecutionWidget() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mazeId = searchParams.get("id");
    const importMode = searchParams.get("import") === "true";

    // --- Maze Runner (実行ロジックをフックに委譲) ---
    const runner = useMazeRunner();

    // --- Command Builder ---
    const commandBuilder = useCommandBuilder();

    // --- QR Detection State ---
    const [detectedCommandName, setDetectedCommandName] = React.useState<string | null>(null);
    const lastAddedCommandRef = useRef<{ type: string; time: number } | null>(null);

    // --- Load Maze ---
    useEffect(() => {
        if (!mazeId && !importMode) return;

        const stored = localStorage.getItem("progpath_mazes");
        if (!stored) return;

        const mazes: MazeData[] = JSON.parse(stored);
        let targetMaze: MazeData | undefined;

        if (mazeId) {
            targetMaze = mazes.find((m) => m.id === mazeId);
        } else if (importMode && mazes.length > 0) {
            targetMaze = mazes[0];
        }

        if (targetMaze) {
            runner.setMaze(targetMaze);
        }
    }, [mazeId, importMode, runner.setMaze]);

    // --- QR Command Detection Handler ---
    const handleMarkerDetected = useCallback((detectedCommand: Command) => {
        // 実行中またはループ回数入力中はQR読み込みを無視
        if (runner.isExecuting || commandBuilder.loopPopupOpen) return;

        const now = Date.now();
        const lastAdded = lastAddedCommandRef.current;
        if (lastAdded && lastAdded.type === detectedCommand.type && (now - lastAdded.time) < 2000) {
            return;
        }

        lastAddedCommandRef.current = { type: detectedCommand.type, time: now };

        const currentlyBuildingLoop = commandBuilder.isBuildingLoopRef.current;
        const commandDisplayName = currentlyBuildingLoop
            ? detectedCommand.type === "loop" ? "End Loop" : detectedCommand.type
            : detectedCommand.type;

        setDetectedCommandName(commandDisplayName);
        setTimeout(() => setDetectedCommandName(null), 2000);

        if (detectedCommand.type === "loop") {
            if (currentlyBuildingLoop) {
                commandBuilder.endLoopBuilding();
            } else {
                commandBuilder.startLoopBuilding(detectedCommand);
            }
        } else {
            if (currentlyBuildingLoop) {
                commandBuilder.addChildToLoop(detectedCommand);
            } else {
                commandBuilder.addCommand(detectedCommand);
            }
        }
    }, [runner.isExecuting, commandBuilder]);

    // --- Control Handlers ---
    const handleExecute = () => {
        runner.toggleExecution(commandBuilder.commands);
    };

    const handleReset = () => {
        runner.reset();
    };

    const handleRemoveCommand = (index: number) => {
        if (commandBuilder.isBuildingLoop && commandBuilder.buildingLoopIndex === index) {
            commandBuilder.endLoopBuilding();
        }
        commandBuilder.removeCommand(index);
        setDetectedCommandName("Command Deleted");
        setTimeout(() => setDetectedCommandName(null), 1000);
    };

    const handleRemoveChildCommand = (parentIndex: number, childIndex: number) => {
        commandBuilder.removeChildCommand(parentIndex, childIndex);
        setDetectedCommandName("Command Deleted");
        setTimeout(() => setDetectedCommandName(null), 1000);
    };

    const handleLoopCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "" || /^[0-9]+$/.test(value)) {
            if (value.length > 3) return;
            commandBuilder.setLoopInputString(value);
        }
    };

    // --- Auto-hide success/failure messages ---
    useEffect(() => {
        if (runner.gameStatus === "success" || runner.gameStatus === "failed") {
            const timer = setTimeout(() => {
                if (runner.gameStatus === "success") runner.closeSuccessDialog();
                else runner.closeFailedDialog();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [runner.gameStatus, runner.closeSuccessDialog, runner.closeFailedDialog]);

    // --- Loading State ---
    if (!runner.maze) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background pt-16">
                <Card className="border-neon-blue/30 bg-space-dark/50 p-8">
                    <p className="text-neon-cyan">迷路を読み込んでいます...</p>
                </Card>
            </div>
        );
    }

    // --- Render ---
    return (
        <div className="h-screen bg-background pt-16 flex flex-col overflow-hidden">
            <div className="container mx-auto px-4 py-4 flex flex-col flex-1 min-h-0">
                {/* Header Section */}
                <div className="mb-6 flex items-center justify-between">
                    <Button onClick={() => router.push("/")} variant="outline" className="border-neon-blue text-neon-blue">
                        <ArrowLeft className="mr-2 h-4 w-4" /> 戻る
                    </Button>
                    <h2 className="text-2xl font-bold text-neon-cyan">{runner.maze.name}</h2>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleReset}
                            variant="outline"
                            className="border-neon-blue text-neon-blue bg-transparent"
                            disabled={runner.isExecuting}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" /> リセット
                        </Button>
                        <Button
                            onClick={handleExecute}
                            className={runner.isExecuting
                                ? "bg-neon-green/50 text-space-dark/50 cursor-not-allowed"
                                : "bg-neon-green text-space-dark hover:bg-neon-green/90"
                            }
                            disabled={commandBuilder.commands.length === 0 || runner.isExecuting}
                        >
                            <Play className="mr-2 h-4 w-4" />実行
                        </Button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-4 lg:grid-cols-[1fr_320px] flex-1 min-h-0">
                    {/* Left Panel: 3D Maze View */}
                    <Card className="relative border-neon-blue/30 bg-space-dark/50 p-4 flex flex-col min-h-0 overflow-hidden">
                        <MazeView3DWidget
                            maze={runner.maze}
                            robotState={runner.robotState}
                            onMarkerDetected={handleMarkerDetected}
                            detectedCommandName={detectedCommandName}
                            currentCommandIndex={runner.currentCommandIndex}
                            flattenedCommands={runner.flattenedCommands}
                        >
                            {/* Move Count Display - Top Left */}
                            <div className="absolute top-2 left-2 z-20">
                                <div className="rounded-lg border border-neon-blue/50 bg-space-dark/80 backdrop-blur-sm px-3 py-1.5 shadow-lg">
                                    <p className="text-sm text-muted-foreground">
                                        移動回数: <span className="font-bold text-neon-cyan">{runner.moveCount}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Minimap View */}
                            <div className="absolute top-2 right-2 w-44 h-44 border-2 border-neon-cyan/50 rounded-lg overflow-hidden bg-space-dark/80 backdrop-blur-sm shadow-lg shadow-neon-cyan/30 z-20">
                                <MinimapViewWidget
                                    maze={runner.maze}
                                    robotState={runner.robotState}
                                    isResetting={runner.currentCommandIndex === -1}
                                />
                            </div>
                        </MazeView3DWidget>

                        {/* Success Message Overlay */}
                        {runner.gameStatus === "success" && (
                            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                <div className="max-w-2xl w-full mx-4 animate-bounce-in rounded-lg border-2 border-neon-green bg-neon-green/10 px-8 py-6 text-center shadow-lg shadow-neon-green/20 backdrop-blur-md pointer-events-auto">
                                    <Trophy className="mx-auto mb-3 h-12 w-12 text-neon-green" />
                                    <p className="text-2xl font-bold text-neon-green">ゴール達成！</p>
                                    <p className="text-base text-neon-green/80">{runner.moveCount}回の移動でクリア</p>
                                </div>
                            </div>
                        )}

                        {/* Failure Message Overlay */}
                        {runner.gameStatus === "failed" && (
                            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                <div className="max-w-2xl w-full mx-4 animate-shake rounded-lg border-2 border-neon-red bg-neon-red/10 px-8 py-6 text-center shadow-lg shadow-neon-red/20 backdrop-blur-md pointer-events-auto">
                                    <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-neon-red" />
                                    <p className="text-2xl font-bold text-neon-red">失敗！</p>
                                    <p className="text-base text-neon-red/80">{runner.errorMessage}</p>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Right Panel: Command Stack */}
                    <div className="flex flex-col min-h-0">
                        <CommandStack
                            commands={commandBuilder.commands}
                            currentIndex={runner.currentCommandIndex}
                            onRemove={handleRemoveCommand}
                            onRemoveChild={handleRemoveChildCommand}
                            onUpdateCommand={commandBuilder.updateCommand}
                            insertionPoint={commandBuilder.insertionPoint}
                            onSetInsertionPoint={commandBuilder.setInsertionPoint}
                            disabled={runner.isExecuting}
                        />
                    </div>
                </div>

                {/* Loop Count Input Dialog */}
                <Dialog open={commandBuilder.loopPopupOpen} onOpenChange={commandBuilder.closeLoopPopup}>
                    <DialogContent className="border-neon-blue/50 bg-space-dark/90 text-foreground backdrop-blur-sm sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-neon-cyan">ループ回数を入力</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <Input
                                type="number"
                                value={commandBuilder.loopInputString}
                                onChange={handleLoopCountChange}
                                className="border-neon-blue/30 bg-space-blue/20 text-foreground"
                                min="1"
                                max="10"
                                autoFocus
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                onClick={commandBuilder.confirmLoopBuilding}
                                className="bg-neon-cyan text-space-dark hover:bg-neon-cyan/90"
                            >
                                決定
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

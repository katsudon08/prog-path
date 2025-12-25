"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@shared/ui";
import { Card } from "@shared/ui";
import { Input } from "@shared/ui";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@shared/ui";
import {
    ArrowLeft,
    Play,
    Pause,
    RotateCcw,
    Trophy,
    AlertTriangle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type { MazeData } from "@entities/maze";
import type { Command, DirectionVector } from "@entities/robot";
import { findStartPosition } from "@entities/maze";
import { flattenCommands, executeCommand } from "@entities/robot";

// Features
import { CommandStack, useCommandBuilder } from "@features/command-builder";
import { isCommandQRCode, qrCodeToCommand } from "@features/qr-command-scanner";

// Widgets
import { MazeView3DWidget } from "@widgets/maze-view-3d";
import { MinimapViewWidget } from "@widgets/minimap-view";



/**
 * ARExecutionWidget
 * 作成したfeaturesとwidgetsを統合したAR実行画面ウィジェット
 */
export function ARExecutionWidget() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mazeId = searchParams.get("id");
    const importMode = searchParams.get("import") === "true";

    // --- Maze State ---
    const [maze, setMaze] = useState<MazeData | null>(null);
    const [originalMaze, setOriginalMaze] = useState<MazeData | null>(null);

    // --- Robot State ---
    const [robotState, setRobotState] = useState({
        x: 0,
        y: 0,
        z: 0,
        direction: [0, 1] as DirectionVector,
    });
    const [initialRobotState, setInitialRobotState] = useState({
        x: 0,
        y: 0,
        z: 0,
        direction: [0, 1] as DirectionVector,
    });

    // --- Execution State ---
    const [isExecuting, setIsExecuting] = useState(false);
    const [currentCommandIndex, setCurrentCommandIndex] = useState(-1);
    const [flattenedCommands, setFlattenedCommands] = useState<Command[]>([]);
    const [gameStatus, setGameStatus] = useState<"idle" | "running" | "success" | "failed">("idle");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [moveCount, setMoveCount] = useState(0);

    // --- Command Builder (from feature) ---
    const commandBuilder = useCommandBuilder();

    // --- QR Detection State ---
    const [detectedCommandName, setDetectedCommandName] = useState<string | null>(null);
    const lastAddedCommandRef = useRef<{ type: string; time: number } | null>(null);

    // --- Refs ---
    const mazeRef = useRef<MazeData | null>(null);
    const robotStateRef = useRef(robotState);
    const isExecutingRef = useRef(isExecuting);
    const timerIdRef = useRef<number | null>(null);
    const executionErrorRef = useRef<string | null>(null);
    const isTeleportingRef = useRef(false);

    // Sync state to refs
    useEffect(() => { mazeRef.current = maze; }, [maze]);
    useEffect(() => { robotStateRef.current = robotState; }, [robotState]);
    useEffect(() => { isExecutingRef.current = isExecuting; }, [isExecuting]);

    // --- Load Maze ---
    useEffect(() => {
        if (!mazeId && !importMode) return;

        const stored = localStorage.getItem("progpath_mazes");
        if (!stored) return;

        const parsed = JSON.parse(stored);
        const mazes: MazeData[] = parsed as MazeData[];

        let targetMaze: MazeData | undefined;
        if (mazeId) {
            targetMaze = mazes.find((m) => m.id === mazeId);
        } else if (importMode && mazes.length > 0) {
            targetMaze = mazes[0];
        }

        if (targetMaze) {
            setMaze(targetMaze);
            setOriginalMaze(targetMaze);

            const startPos = findStartPosition(targetMaze);
            if (startPos) {
                const startState = {
                    x: startPos.x,
                    y: startPos.y,
                    z: startPos.z,
                    direction: startPos.direction,
                };
                setRobotState(startState);
                setInitialRobotState(startState);
            }
        }
    }, [mazeId, importMode]);

    // --- Flatten Commands ---
    useEffect(() => {
        setFlattenedCommands(flattenCommands(commandBuilder.commands));
    }, [commandBuilder.commands]);

    // --- Command Execution ---
    useEffect(() => {
        if (
            !isExecuting ||
            currentCommandIndex < 0 ||
            currentCommandIndex >= flattenedCommands.length ||
            !mazeRef.current
        ) {
            if (isExecuting && currentCommandIndex >= flattenedCommands.length) {
                setIsExecuting(false);
                setCurrentCommandIndex(-1);

                if (executionErrorRef.current) {
                    setGameStatus("failed");
                    setErrorMessage(executionErrorRef.current);
                    executionErrorRef.current = null;
                    return;
                }

                const currentZ = robotState.z;
                if (
                    mazeRef.current &&
                    currentZ >= 0 &&
                    currentZ < mazeRef.current.layers.length &&
                    mazeRef.current.layers[currentZ][robotState.y][robotState.x] !== "goal"
                ) {
                    setGameStatus("failed");
                    setErrorMessage("ゴールに到達できませんでした");
                }
            }
            return;
        }

        if (isExecuting && currentCommandIndex === 0) {
            executionErrorRef.current = null;
        }

        const runCommand = async () => {
            await new Promise<void>((resolve) => {
                const id = window.setTimeout(() => resolve(), 500);
                timerIdRef.current = id;
            });
            timerIdRef.current = null;

            if (executionErrorRef.current) {
                setGameStatus("failed");
                setErrorMessage(executionErrorRef.current);
                setIsExecuting(false);
                executionErrorRef.current = null;
                setCurrentCommandIndex(-1);
                return;
            }

            if (!isExecutingRef.current) return;

            const command = flattenedCommands[currentCommandIndex];
            const currentMaze = mazeRef.current;
            if (!currentMaze) return;

            const currentRobotState = robotStateRef.current;
            const result = executeCommand(currentRobotState, currentMaze, command);

            if (result.error) {
                executionErrorRef.current = result.error;
            }

            if (executionErrorRef.current && !result.shouldIncrementMoveCount) {
                setGameStatus("failed");
                setErrorMessage(executionErrorRef.current);
                setIsExecuting(false);
                setCurrentCommandIndex(-1);
                executionErrorRef.current = null;
                return;
            }

            setRobotState(result.newState);
            robotStateRef.current = result.newState;

            if (result.shouldIncrementMoveCount) {
                setMoveCount((prev) => prev + 1);
            }

            let animationDuration = 500;
            if (result.isTeleporting) {
                animationDuration = 1100;
                isTeleportingRef.current = true;
            } else if (command.type === "turnRight" || command.type === "turnLeft") {
                animationDuration = 300;
            }

            await new Promise<void>((resolve) => {
                const id = window.setTimeout(() => resolve(), animationDuration);
                timerIdRef.current = id;
            });
            timerIdRef.current = null;
            isTeleportingRef.current = false;

            if (result.newMaze) {
                setMaze(result.newMaze);
            }

            if (result.isGoalReached) {
                setGameStatus("success");
                setIsExecuting(false);
                setCurrentCommandIndex(-1);
                return;
            }

            if (executionErrorRef.current) {
                setGameStatus("failed");
                setErrorMessage(executionErrorRef.current);
                setIsExecuting(false);
                setCurrentCommandIndex(-1);
                executionErrorRef.current = null;
                return;
            }

            setCurrentCommandIndex((prev) => prev + 1);
        };

        runCommand();

        return () => {
            if (timerIdRef.current) {
                clearTimeout(timerIdRef.current);
                timerIdRef.current = null;
            }
        };
    }, [isExecuting, currentCommandIndex, flattenedCommands]);

    // --- QR Command Detection Handler ---
    const handleMarkerDetected = useCallback((detectedCommand: Command) => {
        if (isExecutingRef.current) return;

        const now = Date.now();
        const lastAdded = lastAddedCommandRef.current;
        if (lastAdded && lastAdded.type === detectedCommand.type && (now - lastAdded.time) < 2000) {
            return;
        }

        lastAddedCommandRef.current = { type: detectedCommand.type, time: now };

        // Refから現在のisBuildingLoop状態を取得
        const currentlyBuildingLoop = commandBuilder.isBuildingLoopRef.current;

        const commandDisplayName = currentlyBuildingLoop
            ? detectedCommand.type === "loop"
                ? "End Loop"
                : detectedCommand.type
            : detectedCommand.type;

        setDetectedCommandName(commandDisplayName);
        setTimeout(() => setDetectedCommandName(null), 1500);

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
    }, [commandBuilder.endLoopBuilding, commandBuilder.startLoopBuilding, commandBuilder.addChildToLoop, commandBuilder.addCommand, commandBuilder.isBuildingLoopRef]);

    // --- Control Handlers ---
    const handleReset = () => {
        setIsExecuting(false);
        setCurrentCommandIndex(-1);
        setGameStatus("idle");
        setRobotState(initialRobotState);
        setErrorMessage("");
        setMoveCount(0);
        executionErrorRef.current = null;

        if (originalMaze) {
            setMaze(originalMaze);
        }
    };

    const handleExecute = () => {
        if (isExecuting) {
            setIsExecuting(false);
            setCurrentCommandIndex(-1);
        } else {
            setGameStatus("running");
            setCurrentCommandIndex(0);
            setRobotState(initialRobotState);
            setErrorMessage("");
            setMoveCount(0);
            executionErrorRef.current = null;

            if (originalMaze) {
                setMaze(originalMaze);
            }

            setIsExecuting(true);
        }
    };

    const handleRemoveCommand = (index: number) => {
        if (commandBuilder.isBuildingLoop) {
            if (commandBuilder.buildingLoopIndex === index) {
                commandBuilder.endLoopBuilding();
            }
        }
        commandBuilder.removeCommand(index);
        setDetectedCommandName("Command Deleted");
        setTimeout(() => setDetectedCommandName(null), 1500);
    };

    const handleRemoveChildCommand = (parentIndex: number, childIndex: number) => {
        commandBuilder.removeChildCommand(parentIndex, childIndex);
        setDetectedCommandName("Command Deleted");
        setTimeout(() => setDetectedCommandName(null), 1500);
    };

    const handleUpdateCommand = (index: number, command: Command) => {
        commandBuilder.updateCommand(index, command);
    };

    const handleLoopCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "" || /^[0-9]+$/.test(value)) {
            if (value.length > 3) return;
            commandBuilder.setLoopInputString(value);
        }
    };

    const handleLoopConfirm = () => {
        commandBuilder.confirmLoopBuilding();
    };

    // Auto-hide success/failure messages
    useEffect(() => {
        if (gameStatus === "success" || gameStatus === "failed") {
            const timer = setTimeout(() => {
                setGameStatus("idle");
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [gameStatus]);

    // --- Loading State ---
    if (!maze) {
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
        <div className="min-h-screen bg-background pt-16">
            <div className="container mx-auto px-4 py-8">
                {/* Header Section */}
                <div className="mb-6 flex items-center justify-between">
                    <Button
                        onClick={() => router.push("/")}
                        variant="outline"
                        className="border-neon-blue text-neon-blue"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> 戻る
                    </Button>
                    <h2 className="text-2xl font-bold text-neon-cyan">
                        {maze.name}
                    </h2>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleReset}
                            variant="outline"
                            className="border-neon-blue text-neon-blue bg-transparent"
                            disabled={isExecuting}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" /> リセット
                        </Button>
                        <Button
                            onClick={handleExecute}
                            className={
                                isExecuting
                                    ? "bg-neon-red text-space-dark hover:bg-neon-red/90"
                                    : "bg-neon-green text-space-dark hover:bg-neon-green/90"
                            }
                            disabled={commandBuilder.commands.length === 0}
                        >
                            {isExecuting ? (
                                <>
                                    <Pause className="mr-2 h-4 w-4" />
                                    一時停止
                                </>
                            ) : (
                                <>
                                    <Play className="mr-2 h-4 w-4" />
                                    実行
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
                    {/* Left Panel: 3D Maze View and Status */}
                    <Card className="relative border-neon-blue/30 bg-space-dark/50 p-6">
                        <MazeView3DWidget
                            maze={maze}
                            robotState={robotState}
                            onMarkerDetected={handleMarkerDetected}
                            detectedCommandName={detectedCommandName}
                            currentCommandIndex={currentCommandIndex}
                            flattenedCommands={flattenedCommands}
                        />

                        {/* Minimap View */}
                        <div className="absolute top-10 right-10 w-48 h-48 border-2 border-neon-cyan/50 rounded-lg overflow-hidden bg-space-dark/80 backdrop-blur-sm shadow-lg shadow-neon-cyan/30 z-20">
                            <MinimapViewWidget
                                maze={maze}
                                robotState={robotState}
                            />
                        </div>

                        {/* Success Message Overlay */}
                        {gameStatus === "success" && (
                            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                <div className="max-w-2xl w-full mx-4 animate-bounce-in rounded-lg border-2 border-neon-green bg-neon-green/10 px-8 py-6 text-center shadow-lg shadow-neon-green/20 backdrop-blur-md pointer-events-auto">
                                    <Trophy className="mx-auto mb-3 h-12 w-12 text-neon-green" />
                                    <p className="text-2xl font-bold text-neon-green">
                                        ゴール達成！
                                    </p>
                                    <p className="text-base text-neon-green/80">
                                        {moveCount}回の移動でクリア
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Failure Message Overlay */}
                        {gameStatus === "failed" && (
                            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                <div className="max-w-2xl w-full mx-4 animate-shake rounded-lg border-2 border-neon-red bg-neon-red/10 px-8 py-6 text-center shadow-lg shadow-neon-red/20 backdrop-blur-md pointer-events-auto">
                                    <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-neon-red" />
                                    <p className="text-2xl font-bold text-neon-red">
                                        失敗！
                                    </p>
                                    <p className="text-base text-neon-red/80">
                                        {errorMessage}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Status Display Area */}
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-center">
                                <div className="rounded-lg border border-neon-blue/30 bg-space-blue/20 px-4 py-2">
                                    <p className="text-sm text-muted-foreground">
                                        移動回数:{" "}
                                        <span className="font-bold text-neon-cyan">
                                            {moveCount}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Right Panel: Command Stack */}
                    <div className="space-y-4">
                        <CommandStack
                            commands={commandBuilder.commands}
                            currentIndex={currentCommandIndex}
                            onRemove={handleRemoveCommand}
                            onRemoveChild={handleRemoveChildCommand}
                            onUpdateCommand={handleUpdateCommand}
                            insertionPoint={commandBuilder.insertionPoint}
                            onSetInsertionPoint={commandBuilder.setInsertionPoint}
                            disabled={isExecuting}
                        />
                    </div>
                </div>

                {/* Loop Count Input Dialog */}
                <Dialog open={commandBuilder.loopPopupOpen} onOpenChange={commandBuilder.closeLoopPopup}>
                    <DialogContent className="border-neon-blue/50 bg-space-dark/90 text-foreground backdrop-blur-sm sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-neon-cyan">
                                ループ回数を入力
                            </DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <Input
                                id="loopCountInput"
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
                                onClick={handleLoopConfirm}
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

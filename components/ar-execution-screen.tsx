"use client";

import React, { useState, useEffect } from "react"; // Reactをインポート
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input"; // Inputをインポート
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"; // Dialog関連をインポート
import {
    ArrowLeft,
    Play,
    Pause,
    RotateCcw,
    Trophy,
    AlertTriangle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
// RobotState と DirectionVector を lib/types からインポート
import type { MazeData, Command, CommandType, RobotState, DirectionVector } from "@/lib/types";
import { CommandStack } from "@/components/command-stack";
import { MazeView3D } from "@/components/maze-view-3d";

// flattenCommands 関数は変更なし
function flattenCommands(commands: Command[]): Command[] {
    const flattened: Command[] = [];

    for (const command of commands) {
        if (command.type === "loop" && command.children && command.loopCount) {
            for (let i = 0; i < command.loopCount; i++) {
                flattened.push(...flattenCommands(command.children));
            }
        } else { // ifHole もそのまま含める
            flattened.push(command);
        }
    }
    return flattened;
}

export function ARExecutionScreen() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mazeId = searchParams.get("id");

    const [maze, setMaze] = useState<MazeData | null>(null);
    const [commands, setCommands] = useState<Command[]>([]);
    const [robotState, setRobotState] = useState<RobotState>({
        x: 0, y: 0, direction: [1, 0],
    });
    const [initialRobotState, setInitialRobotState] = useState<RobotState>({
        x: 0, y: 0, direction: [1, 0],
    });
    const [isExecuting, setIsExecuting] = useState(false);
    const [currentCommandIndex, setCurrentCommandIndex] = useState(-1);
    const [gameStatus, setGameStatus] = useState<"idle" | "running" | "success" | "failed">("idle");
    const [flattenedCommands, setFlattenedCommands] = useState<Command[]>([]);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [moveCount, setMoveCount] = useState(0);

    // --- State for marker detection and loop popup ---
    const [detectedCommandName, setDetectedCommandName] = useState<string | null>(null); // To display detected command name
    const [loopPopupOpen, setLoopPopupOpen] = useState(false); // To control loop count popup visibility
    const [tempLoopCommand, setTempLoopCommand] = useState<Command | null>(null); // To temporarily store loop command data
    // --- End of new state ---

    // Effect to load maze data (no changes)
    useEffect(() => {
        if (mazeId) {
            const stored = localStorage.getItem("progpath_mazes");
            if (stored) {
                const mazes: MazeData[] = JSON.parse(stored);
                const foundMaze = mazes.find((m) => m.id === mazeId);
                if (foundMaze) {
                    setMaze(foundMaze);
                    for (let y = 0; y < foundMaze.grid.length; y++) {
                        for (let x = 0; x < foundMaze.grid[y].length; x++) {
                            if (foundMaze.grid[y][x] === "start") {
                                const startState = {
                                    x, y, direction: [1, 0] as DirectionVector,
                                };
                                setRobotState(startState);
                                setInitialRobotState(startState);
                                return;
                            }
                        }
                    }
                }
            }
        }
    }, [mazeId]);

    // Effect to update flattened commands (no changes)
    useEffect(() => {
        setFlattenedCommands(flattenCommands(commands));
    }, [commands]);

    // Effect for command execution (ifHole logic will be updated in Step 6)
    useEffect(() => {
        if (!isExecuting || currentCommandIndex < 0 || currentCommandIndex >= flattenedCommands.length || !maze) {
            if (isExecuting && currentCommandIndex >= flattenedCommands.length) {
                setIsExecuting(false);
                setCurrentCommandIndex(-1);
                if (maze?.grid[robotState.y][robotState.x] !== "goal") {
                    setGameStatus("failed");
                    setErrorMessage("ゴールに到達できませんでした");
                }
            }
            return;
        }

        const executeCommand = async () => {
            await new Promise((resolve) => setTimeout(resolve, 500)); // Delay between commands
            const command = flattenedCommands[currentCommandIndex];

             // Temporary skip for ifHole (to be implemented in Step 6)
             if (command.type === "ifHole") {
                 setCurrentCommandIndex((prev) => prev + 1);
                 return;
             }

            // Update robot state based on command
            setRobotState((prevState) => {
                let newState = { ...prevState };
                if (command.type === "forward") {
                    const newX = prevState.x + prevState.direction[0];
                    const newY = prevState.y + prevState.direction[1];
                    // Check boundaries and obstacles
                    if (newX >= 0 && newX < maze.size && newY >= 0 && newY < maze.size) {
                        const targetTile = maze.grid[newY][newX];
                        if (targetTile !== "wall") {
                            newState = { ...prevState, x: newX, y: newY };
                            setMoveCount((prev) => prev + 1);
                            // Check for hole or goal
                            if (targetTile === "hole") { setGameStatus("failed"); setErrorMessage("穴に落ちてしまいました！"); setIsExecuting(false); }
                            else if (targetTile === "goal") { setGameStatus("success"); setIsExecuting(false); }
                        } else { /* Hit wall */ setGameStatus("failed"); setErrorMessage("壁にぶつかりました！"); setIsExecuting(false); }
                    } else { /* Out of bounds */ setGameStatus("failed"); setErrorMessage("迷路の外に出てしまいました！"); setIsExecuting(false); }
                } else if (command.type === "turnRight") {
                    // Rotate direction vector clockwise
                    const newDirection: DirectionVector = [prevState.direction[1], -prevState.direction[0]];
                    newState = { ...prevState, direction: newDirection };
                } else if (command.type === "turnLeft") {
                    // Rotate direction vector counter-clockwise
                    const newDirection: DirectionVector = [-prevState.direction[1], prevState.direction[0]];
                    newState = { ...prevState, direction: newDirection };
                }
                return newState;
            });
            // Move to the next command
            setCurrentCommandIndex((prev) => prev + 1);
        };
        executeCommand();
    }, [isExecuting, currentCommandIndex, flattenedCommands, maze, robotState]);

    // --- New/Modified Functions for Step 5 ---

    // Function to add a command to the stack (accepts Command object)
    const handleAddCommand = (newCommand: Command) => {
        setCommands((prevCommands) => [...prevCommands, newCommand]);
    };

    // Callback function called by MazeView3D when a marker is detected
    const handleMarkerDetected = (detectedCommand: Command) => {
        if (isExecuting) return; // Ignore markers while executing

        // Display the detected command name temporarily
        setDetectedCommandName(detectedCommand.type);
        setTimeout(() => setDetectedCommandName(null), 1500); // Display for 1.5 seconds

        if (detectedCommand.type === "loop") {
            // If loop command detected, prepare and open the popup
            setTempLoopCommand({ ...detectedCommand, loopCount: detectedCommand.loopCount || 2, children: [] }); // Initialize children
            setLoopPopupOpen(true);
        } else {
            // For other commands, add directly to the stack
            handleAddCommand(detectedCommand);
        }
    };

    // Function called when the 'Confirm' button in the loop popup is clicked
    const handleLoopConfirm = () => {
        if (tempLoopCommand) {
            handleAddCommand(tempLoopCommand); // Add the configured loop command
        }
        setLoopPopupOpen(false); // Close the popup
        setTempLoopCommand(null); // Clear temporary data
    };

    // Function to handle changes in the loop count input field
    const handleLoopCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (tempLoopCommand) {
            // Parse input, ensure it's between 1 and 10
            const count = Math.max(1, Math.min(10, Number.parseInt(e.target.value) || 1));
            // Update the loopCount in the temporary loop command state
            setTempLoopCommand({ ...tempLoopCommand, loopCount: count });
        }
    };
    // --- End of New/Modified Functions ---

    // Function to remove a command (no changes)
    const handleRemoveCommand = (index: number) => {
        setCommands(commands.filter((_, i) => i !== index));
    };

    // Function to update a command (e.g., nested commands in loop/if) (no changes)
    const handleUpdateCommand = (index: number, updatedCommand: Command) => {
        const newCommands = [...commands];
        newCommands[index] = updatedCommand;
        setCommands(newCommands);
    };

    // Function to reset the execution state (no changes)
    const handleReset = () => {
        setIsExecuting(false);
        setCurrentCommandIndex(-1);
        setGameStatus("idle");
        setRobotState(initialRobotState);
        setErrorMessage("");
        setMoveCount(0);
         // Restore original maze grid if it was modified by ifHole
         if (mazeId) {
             const stored = localStorage.getItem("progpath_mazes");
             if (stored) {
                 const mazes: MazeData[] = JSON.parse(stored);
                 const foundMaze = mazes.find((m) => m.id === mazeId);
                 if (foundMaze) { setMaze(foundMaze); }
             }
         }
    };

    // Function to start/pause execution (no changes)
    const handleExecute = () => {
        if (isExecuting) {
            setIsExecuting(false); // Pause execution
        } else {
            // Reset state before starting execution
            setGameStatus("running");
            setCurrentCommandIndex(0);
            setRobotState(initialRobotState); // Start from initial position
            setErrorMessage("");
            setMoveCount(0);
             // Ensure the maze grid is reset to its original state
             if (mazeId) {
                 const stored = localStorage.getItem("progpath_mazes");
                 if (stored) {
                     const mazes: MazeData[] = JSON.parse(stored);
                     const foundMaze = mazes.find((m) => m.id === mazeId);
                     if (foundMaze) { setMaze(foundMaze); }
                 }
             }
            setIsExecuting(true); // Start execution
        }
    };

    // Loading state display (no changes)
    if (!maze) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background pt-16">
                <Card className="border-neon-blue/30 bg-space-dark/50 p-8">
                    <p className="text-neon-cyan">迷路を読み込んでいます...</p>
                </Card>
            </div>
        );
    }

    // --- JSX Rendering ---
    return (
        <div className="min-h-screen bg-background pt-16">
            <div className="container mx-auto px-4 py-8">
                {/* Header Section (no changes) */}
                <div className="mb-6 flex items-center justify-between">
                    <Button onClick={() => router.push("/")} variant="outline" className="border-neon-blue text-neon-blue">
                        <ArrowLeft className="mr-2 h-4 w-4" /> 戻る
                    </Button>
                    <h2 className="text-2xl font-bold text-neon-cyan">{maze.name}</h2>
                    <div className="flex gap-2">
                        <Button onClick={handleReset} variant="outline" className="border-neon-blue text-neon-blue bg-transparent" disabled={isExecuting}>
                            <RotateCcw className="mr-2 h-4 w-4" /> リセット
                        </Button>
                        <Button onClick={handleExecute} className={ isExecuting ? "bg-neon-red text-space-dark hover:bg-neon-red/90" : "bg-neon-green text-space-dark hover:bg-neon-green/90" } disabled={commands.length === 0}>
                            {isExecuting ? (<><Pause className="mr-2 h-4 w-4" />一時停止</>) : (<><Play className="mr-2 h-4 w-4" />実行</>)}
                        </Button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
                    {/* Left Panel: 3D Maze View and Status */}
                    <Card className="border-neon-blue/30 bg-space-dark/50 p-6">
                        {/* --- Updated MazeView3D props --- */}
                        <MazeView3D
                            maze={maze}
                            robotState={robotState}
                            onMarkerDetected={handleMarkerDetected} // Pass the callback
                            detectedCommandName={detectedCommandName} // Pass the name to display
                            currentCommandIndex={currentCommandIndex} // Pass index for animation
                            flattenedCommands={flattenedCommands} // Pass commands for animation
                        />
                        {/* --- End of update --- */}

                        {/* Status Display Area (no changes) */}
                        <div className="mt-4 space-y-2">
                            {/* Move Counter */}
                            <div className="flex items-center justify-center">
                                <div className="rounded-lg border border-neon-blue/30 bg-space-blue/20 px-4 py-2">
                                    <p className="text-sm text-muted-foreground"> 移動回数: <span className="font-bold text-neon-cyan">{moveCount}</span></p>
                                </div>
                            </div>
                            {/* Success Message */}
                            {gameStatus === "success" && (
                                <div className="animate-bounce-in rounded-lg border-2 border-neon-green bg-neon-green/10 px-6 py-4 text-center shadow-lg shadow-neon-green/20">
                                    <Trophy className="mx-auto mb-2 h-8 w-8 text-neon-green" />
                                    <p className="text-lg font-bold text-neon-green">ゴール達成！</p>
                                    <p className="text-sm text-neon-green/80">{moveCount}回の移動でクリア</p>
                                </div>
                            )}
                            {/* Failure Message */}
                            {gameStatus === "failed" && (
                                <div className="animate-shake rounded-lg border-2 border-neon-red bg-neon-red/10 px-6 py-4 text-center shadow-lg shadow-neon-red/20">
                                    <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-neon-red" />
                                    <p className="text-lg font-bold text-neon-red">失敗！</p>
                                    <p className="text-sm text-neon-red/80">{errorMessage}</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Right Panel: Command Stack */}
                    <div className="space-y-4">
                        <CommandStack
                            commands={commands}
                            currentIndex={currentCommandIndex}
                            onRemove={handleRemoveCommand}
                            onAddCommand={() => {}} // Adding commands is now done via markers
                            onUpdateCommand={handleUpdateCommand}
                            disabled={isExecuting}
                        />
                    </div>
                </div>

                {/* --- Loop Count Input Dialog --- */}
                <Dialog open={loopPopupOpen} onOpenChange={setLoopPopupOpen}>
                    <DialogContent className="border-neon-blue/50 bg-space-dark/90 text-foreground backdrop-blur-sm sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-neon-cyan">ループ回数を入力</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <Input
                                id="loopCountInput"
                                type="number"
                                value={tempLoopCommand?.loopCount ?? 2} // Use ?? for default value
                                onChange={handleLoopCountChange}
                                className="border-neon-blue/30 bg-space-blue/20 text-foreground"
                                min="1"
                                max="10"
                                autoFocus // Focus the input when the dialog opens
                            />
                        </div>
                        <DialogFooter>
                            <Button onClick={handleLoopConfirm} className="bg-neon-cyan text-space-dark hover:bg-neon-cyan/90">
                                決定
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                {/* --- End of Dialog --- */}
            </div>
        </div>
    );
}


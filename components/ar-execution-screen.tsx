"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    ArrowLeft,
    Play,
    Pause,
    RotateCcw,
    Trophy,
    AlertTriangle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type { MazeData, Command, CommandType } from "@/lib/types";
import { CommandStack } from "@/components/command-stack";
import { MazeView3D } from "@/components/maze-view-3d";

type Direction = "north" | "east" | "south" | "west";

interface RobotState {
    x: number;
    y: number;
    direction: Direction;
}

function flattenCommands(commands: Command[]): Command[] {
    const flattened: Command[] = [];

    for (const command of commands) {
        if (command.type === "loop" && command.children && command.loopCount) {
            // Repeat children loopCount times
            for (let i = 0; i < command.loopCount; i++) {
                flattened.push(...flattenCommands(command.children));
            }
        } else if (command.type === "ifHole") {
            // ifHole is handled during execution, add as marker
            flattened.push(command);
        } else {
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
        x: 0,
        y: 0,
        direction: "east",
    });
    const [initialRobotState, setInitialRobotState] = useState<RobotState>({
        x: 0,
        y: 0,
        direction: "east",
    });
    const [isExecuting, setIsExecuting] = useState(false);
    const [currentCommandIndex, setCurrentCommandIndex] = useState(-1);
    const [gameStatus, setGameStatus] = useState<
        "idle" | "running" | "success" | "failed"
    >("idle");
    const [flattenedCommands, setFlattenedCommands] = useState<Command[]>([]);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [moveCount, setMoveCount] = useState(0);

    useEffect(() => {
        if (mazeId) {
            const stored = localStorage.getItem("progpath_mazes");
            if (stored) {
                const mazes: MazeData[] = JSON.parse(stored);
                const foundMaze = mazes.find((m) => m.id === mazeId);
                if (foundMaze) {
                    setMaze(foundMaze);
                    // Find start position
                    for (let y = 0; y < foundMaze.grid.length; y++) {
                        for (let x = 0; x < foundMaze.grid[y].length; x++) {
                            if (foundMaze.grid[y][x] === "start") {
                                const startState = {
                                    x,
                                    y,
                                    direction: "east" as Direction,
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

    useEffect(() => {
        setFlattenedCommands(flattenCommands(commands));
    }, [commands]);

    useEffect(() => {
        if (
            !isExecuting ||
            currentCommandIndex < 0 ||
            currentCommandIndex >= flattenedCommands.length ||
            !maze
        ) {
            if (
                isExecuting &&
                currentCommandIndex >= flattenedCommands.length
            ) {
                setIsExecuting(false);
                setCurrentCommandIndex(-1);
                // Check if robot reached goal
                if (maze?.grid[robotState.y][robotState.x] !== "goal") {
                    setGameStatus("failed");
                    setErrorMessage("ゴールに到達できませんでした");
                }
            }
            return;
        }

        const executeCommand = async () => {
            await new Promise((resolve) => setTimeout(resolve, 500));

            const command = flattenedCommands[currentCommandIndex];

            if (command.type === "ifHole") {
                // Check if there's a hole in front
                let checkX = robotState.x;
                let checkY = robotState.y;

                switch (robotState.direction) {
                    case "north":
                        checkY -= 1;
                        break;
                    case "east":
                        checkX += 1;
                        break;
                    case "south":
                        checkY += 1;
                        break;
                    case "west":
                        checkX -= 1;
                        break;
                }

                // If there's a hole ahead, execute children commands
                if (
                    checkX >= 0 &&
                    checkX < maze.size &&
                    checkY >= 0 &&
                    checkY < maze.size &&
                    maze.grid[checkY][checkX] === "hole"
                ) {
                    // Skip the hole by executing children (typically a turn or jump logic)
                    if (command.children && command.children.length > 0) {
                        // Insert children commands after current position
                        const newFlattened = [
                            ...flattenedCommands.slice(
                                0,
                                currentCommandIndex + 1
                            ),
                            ...flattenCommands(command.children),
                            ...flattenedCommands.slice(currentCommandIndex + 1),
                        ];
                        setFlattenedCommands(newFlattened);
                    }
                }

                setCurrentCommandIndex((prev) => prev + 1);
                return;
            }

            setRobotState((prevState) => {
                let newState = { ...prevState };

                if (command.type === "forward") {
                    // Calculate new position based on direction
                    let newX = prevState.x;
                    let newY = prevState.y;

                    switch (prevState.direction) {
                        case "north":
                            newY -= 1;
                            break;
                        case "east":
                            newX += 1;
                            break;
                        case "south":
                            newY += 1;
                            break;
                        case "west":
                            newX -= 1;
                            break;
                    }

                    // Check if new position is valid
                    if (
                        newX >= 0 &&
                        newX < maze.size &&
                        newY >= 0 &&
                        newY < maze.size
                    ) {
                        const targetTile = maze.grid[newY][newX];
                        if (targetTile !== "wall") {
                            newState = { ...prevState, x: newX, y: newY };
                            setMoveCount((prev) => prev + 1);

                            // Check for hole
                            if (targetTile === "hole") {
                                setGameStatus("failed");
                                setErrorMessage("穴に落ちてしまいました！");
                                setIsExecuting(false);
                            }
                            // Check for goal
                            else if (targetTile === "goal") {
                                setGameStatus("success");
                                setIsExecuting(false);
                            }
                        } else {
                            // Hit a wall
                            setGameStatus("failed");
                            setErrorMessage("壁にぶつかりました！");
                            setIsExecuting(false);
                        }
                    } else {
                        // Out of bounds
                        setGameStatus("failed");
                        setErrorMessage("迷路の外に出てしまいました！");
                        setIsExecuting(false);
                    }
                } else if (command.type === "turnRight") {
                    const directions: Direction[] = [
                        "north",
                        "east",
                        "south",
                        "west",
                    ];
                    const currentIndex = directions.indexOf(
                        prevState.direction
                    );
                    const newDirection = directions[(currentIndex + 1) % 4];
                    newState = { ...prevState, direction: newDirection };
                } else if (command.type === "turnLeft") {
                    const directions: Direction[] = [
                        "north",
                        "east",
                        "south",
                        "west",
                    ];
                    const currentIndex = directions.indexOf(
                        prevState.direction
                    );
                    const newDirection = directions[(currentIndex + 3) % 4];
                    newState = { ...prevState, direction: newDirection };
                }

                return newState;
            });

            setCurrentCommandIndex((prev) => prev + 1);
        };

        executeCommand();
    }, [isExecuting, currentCommandIndex, flattenedCommands, maze, robotState]);

    const handleAddCommand = (type: CommandType) => {
        if (type === "loop") {
            setCommands([...commands, { type, loopCount: 2, children: [] }]);
        } else if (type === "ifHole") {
            setCommands([...commands, { type, children: [] }]);
        } else {
            setCommands([...commands, { type }]);
        }
    };

    const handleRemoveCommand = (index: number) => {
        setCommands(commands.filter((_, i) => i !== index));
    };

    const handleUpdateCommand = (index: number, updatedCommand: Command) => {
        const newCommands = [...commands];
        newCommands[index] = updatedCommand;
        setCommands(newCommands);
    };

    const handleReset = () => {
        setIsExecuting(false);
        setCurrentCommandIndex(-1);
        setGameStatus("idle");
        setRobotState(initialRobotState);
        setErrorMessage("");
        setMoveCount(0);
    };

    const handleExecute = () => {
        if (isExecuting) {
            setIsExecuting(false);
        } else {
            setIsExecuting(true);
            setGameStatus("running");
            setCurrentCommandIndex(0);
            setErrorMessage("");
            setMoveCount(0);
        }
    };

    if (!maze) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Card className="border-neon-blue/30 bg-space-dark/50 p-8">
                    <p className="text-neon-cyan">迷路を読み込んでいます...</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
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
                            <RotateCcw className="mr-2 h-4 w-4" />
                            リセット
                        </Button>
                        <Button
                            onClick={handleExecute}
                            className={
                                isExecuting
                                    ? "bg-neon-red text-space-dark hover:bg-neon-red/90"
                                    : "bg-neon-green text-space-dark hover:bg-neon-green/90"
                            }
                            disabled={commands.length === 0}
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

                <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
                    {/* 3D Maze View */}
                    <Card className="border-neon-blue/30 bg-space-dark/50 p-6">
                        <MazeView3D maze={maze} robotState={robotState} />

                        {/* Status Display */}
                        <div className="mt-4 space-y-2">
                            {/* Move Counter */}
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

                            {/* Success/Failure Messages */}
                            {gameStatus === "success" && (
                                <div className="animate-bounce-in rounded-lg border-2 border-neon-green bg-neon-green/10 px-6 py-4 text-center shadow-lg shadow-neon-green/20">
                                    <Trophy className="mx-auto mb-2 h-8 w-8 text-neon-green" />
                                    <p className="text-lg font-bold text-neon-green">
                                        ゴール達成！
                                    </p>
                                    <p className="text-sm text-neon-green/80">
                                        {moveCount}回の移動でクリア
                                    </p>
                                </div>
                            )}
                            {gameStatus === "failed" && (
                                <div className="animate-shake rounded-lg border-2 border-neon-red bg-neon-red/10 px-6 py-4 text-center shadow-lg shadow-neon-red/20">
                                    <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-neon-red" />
                                    <p className="text-lg font-bold text-neon-red">
                                        失敗！
                                    </p>
                                    <p className="text-sm text-neon-red/80">
                                        {errorMessage}
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Command Stack */}
                    <div className="space-y-4">
                        <CommandStack
                            commands={commands}
                            currentIndex={currentCommandIndex}
                            onRemove={handleRemoveCommand}
                            onAddCommand={handleAddCommand}
                            onUpdateCommand={handleUpdateCommand}
                            disabled={isExecuting}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

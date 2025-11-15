"use client";

import React, { useState, useEffect, useRef, useCallback } from "react"; // useCallback をインポート
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input"; // Inputをインポート
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"; // Dialog関連をインポート
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
import type {
    MazeData,
    Command,
    CommandType,
    RobotState,
    DirectionVector,
} from "@/lib/types";
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
        } else {
            // ifHole もそのまま含める
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
        direction: [0, 1], // ★ 修正: 初期向きを [1, 0] (東) から [0, 1] (南) に変更
    });
    const [initialRobotState, setInitialRobotState] = useState<RobotState>({
        x: 0,
        y: 0,
        direction: [0, 1], // ★ 修正: 初期向きを [1, 0] (東) から [0, 1] (南) に変更
    });
    const [isExecuting, setIsExecuting] = useState(false);
    const [currentCommandIndex, setCurrentCommandIndex] = useState(-1);
    const [gameStatus, setGameStatus] = useState<
        "idle" | "running" | "success" | "failed"
    >("idle");
    const [flattenedCommands, setFlattenedCommands] = useState<Command[]>([]);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [moveCount, setMoveCount] = useState(0);

    // --- State for marker detection and loop popup ---
    const [detectedCommandName, setDetectedCommandName] = useState<
        string | null
    >(null); // To display detected command name
    const [loopPopupOpen, setLoopPopupOpen] = useState(false); // To control loop count popup visibility
    const [tempLoopCommand, setTempLoopCommand] = useState<Command | null>(
        null
    ); // To temporarily store loop command data
    
    // --- ループ構築中フラグ ---
    const [isBuildingLoop, setIsBuildingLoop] = useState(false);

    // 実行エラー（壁、穴など）の状態を保持するRef
    const executionErrorRef = useRef<string | null>(null);

    // --- 修正: 無限ループ対策 ---
    // state の値を ref に同期させ、安定したコールバック内から
    // 最新の値を参照できるようにする
    const isBuildingLoopRef = useRef(isBuildingLoop);
    const tempLoopCommandRef = useRef(tempLoopCommand);
    const isExecutingRef = useRef(isExecuting);

    // ★★★★★ バグ修正 ★★★★★
    // 迷路の最新状態を Ref にも保持する
    const mazeRef = useRef<MazeData | null>(null);
    // ★★★★★ 修正終了 ★★★★★


    // ★★★ 修正 (Invalid hook call エラー修正) ★★★
    // 実行ループのタイマーIDを保持するRef (トップレベルに移動)
    const timerIdRef = useRef<number | null>(null);
    // ★★★ 修正 終了 ★★★

    useEffect(() => {
        isBuildingLoopRef.current = isBuildingLoop;
    }, [isBuildingLoop]);

    useEffect(() => {
        tempLoopCommandRef.current = tempLoopCommand;
    }, [tempLoopCommand]);

    useEffect(() => {
        isExecutingRef.current = isExecuting;
    }, [isExecuting]);
    // --- 修正 終了 ---
    
    // ★★★★★ バグ修正 ★★★★★
    // maze state が更新されたら、mazeRef も更新する
    useEffect(() => {
        mazeRef.current = maze;
    }, [maze]);
    // ★★★★★ 修正終了 ★★★★★


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
                                    x,
                                    y,
                                    direction: [0, 1] as DirectionVector, // ★ 修正: 初期向きを [1, 0] (東) から [0, 1] (南) に変更
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

    // Effect for command execution (変更)
    useEffect(() => {
        // ★★★ 修正 (Invalid hook call エラー修正) ★★★
        // const timerId = useRef<number | null>(null); // <-- この行を削除
        // ★★★ 修正 終了 ★★★

        // ★★★★★ バグ修正 ★★★★★
        // maze state の代わりに mazeRef をチェック
        if (
            !isExecuting ||
            currentCommandIndex < 0 ||
            currentCommandIndex >= flattenedCommands.length ||
            !mazeRef.current // <-- 修正
        ) {
        // ★★★★★ 修正終了 ★★★★★
            if (
                isExecuting &&
                currentCommandIndex >= flattenedCommands.length
            ) {
                // コマンドが最後まで実行された
                setIsExecuting(false);
                // アニメーション停止
                setCurrentCommandIndex(-1);
                // ★★★★★ バグ修正 ★★★★★
                // maze state の代わりに mazeRef をチェック
                if (mazeRef.current?.grid[robotState.y][robotState.x] !== "goal") {
                // ★★★★★ 修正終了 ★★★★★
                    setGameStatus("failed");
                    setErrorMessage("ゴールに到達できませんでした");
                }
            }
            return;
        }

        // 実行開始時にエラーフラグをリセット
        if (isExecuting && currentCommandIndex === 0) {
            executionErrorRef.current = null;
        }

        const executeCommand = async () => {
            // ★★★ 修正 (レースコンディション対策) ★★★
            // Promise ベースの待機を、キャンセル可能な setTimeout に変更
            const timeoutPromise = new Promise<void>((resolve) => {
                const id = window.setTimeout(() => {
                    resolve();
                }, 500); // Delay between commands
                
                // ★★★ 修正 (Invalid hook call エラー修正) ★★★
                // timerIdRef (トップレベルのRef) を使用
                timerIdRef.current = id;
                // ★★★ 修正 終了 ★★★
            });

            try {
                await timeoutPromise;
                // ★★★ 修正 (Invalid hook call エラー修正) ★★★
                timerIdRef.current = null; // 実行されたらタイマーIDをクリア
                // ★★★ 修正 終了 ★★★
            } catch (e) {
                // (これはクリーンアップ関数から reject されない限り発生しない)
                console.log("Timer cancelled during execution");
                return; // 実行を中止
            }
            // ★★★ 修正 終了 ★★★

            
            // 前回のコマンド実行でエラーRefがセットされていたら、実行を停止
            if (executionErrorRef.current) {
                setGameStatus("failed");
                setErrorMessage(executionErrorRef.current);
                setIsExecuting(false);
                executionErrorRef.current = null; // エラーフラグをリセット
                
                // アニメーション停止
                setCurrentCommandIndex(-1);
                
                return; // このティックの実行を終了
            }

            // ★★★ 修正 (レースコンディション対策) ★★★
            // ポーズボタンなどで停止された場合 (await 後に Ref で再チェック)
            if (!isExecutingRef.current) return;
            // ★★★ 修正 終了 ★★★

            const command = flattenedCommands[currentCommandIndex];
            
            // ★★★★★ バグ修正 ★★★★★
            // 実行ロジックで mazeRef.current を使う
            const currentMaze = mazeRef.current;
            if (!currentMaze) return; // maze が null なら実行しない
            // ★★★★★ 修正終了 ★★★★★


            // ifHole ロジック (変更)
            if (command.type === "ifHole") {
                const checkX = robotState.x + robotState.direction[0];
                const checkY = robotState.y + robotState.direction[1];

                if (
                    checkX >= 0 &&
                    checkX < currentMaze.size && // <-- 修正: currentMaze
                    checkY >= 0 &&
                    checkY < currentMaze.size // <-- 修正: currentMaze
                ) {
                    // ★★★★★ バグ修正 ★★★★★
                    // 読み取りに currentMaze (mazeRef.current) を使用
                    if (currentMaze.grid[checkY][checkX] === "hole") {
                        const newGrid = currentMaze.grid.map((row) => [...row]); 
                        newGrid[checkY][checkX] = "floor";
                        // setMaze は state を更新するために必須
                        setMaze(
                            (prevMaze) =>
                                prevMaze ? { ...prevMaze, grid: newGrid } : null
                        );
                    }
                    // ★★★★★ 修正終了 ★★★★★
                }
                // ifHole は setRobotState を呼ばないので、ここで次のコマンドへ
                setCurrentCommandIndex((prev) => prev + 1);
                return; 
            }
            // --- ifHole 終了 ---

            // setRobotState のコールバック内で移動と衝突判定を完結させる
            setRobotState((prevState) => {
                // ★★★ 修正 (レースコンディション対策) ★★★
                // このスコープ内で isExecuting を再チェック (Ref を使用)
                if (!isExecutingRef.current) return prevState; 
                // ★★★ 修正 終了 ★★★

                // ★★★★★ バグ修正 ★★★★★
                // setRobotState のコールバック内でも、
                // 迷路のチェックは mazeRef.current を使う
                const latestMaze = mazeRef.current;
                if (!latestMaze) return prevState; // 念のため
                // ★★★★★ 修正終了 ★★★★★

                let newState = { ...prevState };
                
                if (command.type === "forward") {
                    const newX = prevState.x + prevState.direction[0];
                    const newY = prevState.y + prevState.direction[1];

                    // 1. 範囲外チェック
                    if (
                        newX < 0 ||
                        newX >= latestMaze.size || // <-- 修正: latestMaze
                        newY < 0 ||
                        newY >= latestMaze.size // <-- 修正: latestMaze
                    ) {
                        executionErrorRef.current = "迷路の外に出てしまいました！";
                        return prevState; // 移動しない
                    }
                    
                    // ★★★★★ バグ修正 ★★★★★
                    // 衝突判定に latestMaze (mazeRef.current) を使用
                    const targetTile = latestMaze.grid[newY][newX];
                    // ★★★★★ 修正終了 ★★★★★

                    // 2. 壁チェック
                    if (targetTile === "wall") {
                        executionErrorRef.current = "壁にぶつかりました！";
                        return prevState; // 移動しない
                    }

                    // 3. 穴チェック (ここで "floor" になっているはず)
                    if (targetTile === "hole") {
                        newState = { ...prevState, x: newX, y: newY }; // 穴に移動
                        setMoveCount((prev) => prev + 1);
                        executionErrorRef.current = "穴に落ちてしまいました！";
                        return newState; // 移動する
                    }

                    // 4. ゴールチェック
                    if (targetTile === "goal") {
                        newState = { ...prevState, x: newX, y: newY }; // ゴールに移動
                        setMoveCount((prev) => prev + 1);
                        // ゴールはエラーではない
                        setGameStatus("success");
                        setIsExecuting(false); // 実行停止 (これは即時反映される)
                        setCurrentCommandIndex(-1); // アニメーション停止
                        return newState; // 移動する
                    }

                    // 5. 安全な移動 (床)
                    newState = { ...prevState, x: newX, y: newY };
                    setMoveCount((prev) => prev + 1);

                } else if (command.type === "turnRight") {
                    // (回転の向き修正済み)
                    // 時計回り
                    newState = { ...prevState, direction: [
                        -prevState.direction[1],
                        prevState.direction[0],
                    ]};
                } else if (command.type === "turnLeft") {
                    // (回転の向き修正済み)
                    // 反時計回り
                    newState = { ...prevState, direction: [
                        prevState.direction[1],
                        -prevState.direction[0],
                    ]};
                }
                
                return newState;
            });
            
            // ★★★★★ 修正 ★★★★★
            // setRobotState が (同期的に) 実行された直後にエラーRefをチェック
            if (executionErrorRef.current) {
                // エラーがセットされた (例: 壁にぶつかった)
                setGameStatus("failed");
                setErrorMessage(executionErrorRef.current);
                setIsExecuting(false); 
                
                // ★ 2. アニメーションを停止するためにインデックスをリセット
                setCurrentCommandIndex(-1); 
                return; // インデックスを進めずに終了
            }
            // ★★★★★ 修正 終了 ★★★★★
            
            // 次のコマンドインデックスに進む
            setCurrentCommandIndex((prev) => prev + 1);
        };
        
        executeCommand();

        // ★★★ 修正 (レースコンディション対策) ★★★
        // クリーンアップ関数
        return () => {
            // ★★★ 修正 (Invalid hook call エラー修正) ★★★
            if (timerIdRef.current) {
                // console.log("Cleaning up timer:", timerIdRef.current);
                clearTimeout(timerIdRef.current);
                timerIdRef.current = null;
            }
            // ★★★ 修正 終了 ★★★
        };
        // ★★★ 修正 終了 ★★★

    // 依存配列から robotState を削除
    // (isExecutingRef を使用するが、useEffect のトリガーとして isExecuting と currentCommandIndex は必要)
    // ★★★★★ バグ修正 ★★★★★
    // 'maze' は依存配列に残す (maze state の変更が mazeRef に同期され、
    // 同時にこの effect が再実行されることを期待するため)
    }, [isExecuting, currentCommandIndex, flattenedCommands, maze, isExecutingRef]);
    // ★★★★★ 修正終了 ★★★★★


    // --- 修正: 無限ループ対策 ---
    // Function to add a command to the stack (accepts Command object)
    const handleAddCommand = useCallback((newCommand: Command) => {
        setCommands((prevCommands) => [...prevCommands, newCommand]);
    }, []); // setCommands は安定しているので依存配列は空

    // Callback function called by MazeView3D when a marker is detected
    // 依存配列を安定させ、Ref を使って最新の state を読む
    const handleMarkerDetected = useCallback((detectedCommand: Command) => {
        // isExecuting を Ref から読む
        if (isExecutingRef.current) return; // Ignore markers while executing

        // isBuildingLoop を Ref から読む
        const commandDisplayName = isBuildingLoopRef.current
            ? detectedCommand.type === "loop"
                ? "End Loop" // ループ構築中に "loop" マーカーを検出
                : detectedCommand.type // ループ構築中に他のコマンドを検出
            : detectedCommand.type; // 通常時
            
        setDetectedCommandName(commandDisplayName);
        setTimeout(() => setDetectedCommandName(null), 1500); // Display for 1.5 seconds

        if (detectedCommand.type === "loop") {
            // isBuildingLoop を Ref から読む
            if (isBuildingLoopRef.current) {
                // --- ループ終了処理 ---
                // tempLoopCommand を Ref から読む
                if (tempLoopCommandRef.current) { 
                    handleAddCommand(tempLoopCommandRef.current);
                }
                setIsBuildingLoop(false); // state を更新
                setTempLoopCommand(null); // state を更新
            } else {
                // --- ループ開始処理 ---
                setTempLoopCommand({
                    ...detectedCommand,
                    loopCount: detectedCommand.loopCount || 2,
                    children: [],
                }); 
                setLoopPopupOpen(true);
            }
        } else {
            // --- ループ以外のコマンド処理 ---
            // isBuildingLoop を Ref から読む
            if (isBuildingLoopRef.current) {
                // functional update を使う
                setTempLoopCommand((prevLoop) =>
                    prevLoop
                        ? {
                            ...prevLoop,
                            children: [...(prevLoop.children || []), detectedCommand],
                        }
                        : null
                );
            } else {
                // 通常時：直接スタックに追加
                handleAddCommand(detectedCommand);
            }
        }
    // 依存配列から state を削除し、安定した setter と handleAddCommand のみに依存
    }, [handleAddCommand, setDetectedCommandName, setIsBuildingLoop, setTempLoopCommand, setLoopPopupOpen]);
    // --- 修正 終了 ---

    // Function called when the 'Confirm' button in the loop popup is clicked (変更なし)
    const handleLoopConfirm = () => {
        if (tempLoopCommand) {
            setIsBuildingLoop(true); 
        }
        setLoopPopupOpen(false); 
    };

    // Function to handle changes in the loop count input field (no changes)
    const handleLoopCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (tempLoopCommand) {
            const count = Math.max(
                1,
                Number.parseInt(e.target.value)
            );
            setTempLoopCommand({ ...tempLoopCommand, loopCount: count });
        }
    };

    // Function to remove a command (no changes)
    const handleRemoveCommand = (index: number) => {
        setCommands(commands.filter((_, i) => i !== index));
    };

    // Function to update a command (no changes)
    const handleUpdateCommand = (index: number, updatedCommand: Command) => {
        const newCommands = [...commands];
        newCommands[index] = updatedCommand;
        setCommands(newCommands);
    };

    // Function to reset the execution state
    const handleReset = () => {
        setIsExecuting(false);
        setCurrentCommandIndex(-1); // ★ アニメーション停止
        setGameStatus("idle");
        setRobotState(initialRobotState);
        setErrorMessage("");
        setMoveCount(0);
        executionErrorRef.current = null; // エラーフラグもリセット
        // Restore original maze grid if it was modified by ifHole
        if (mazeId) {
            const stored = localStorage.getItem("progpath_mazes");
            if (stored) {
                const mazes: MazeData[] = JSON.parse(stored);
                const foundMaze = mazes.find((m) => m.id === mazeId);
                if (foundMaze) {
                    setMaze(foundMaze);
                }
            }
        }
    };

    // Function to start/pause execution
    const handleExecute = () => {
        if (isExecuting) {
            setIsExecuting(false); // Pause execution
            // ★★★ 修正 ★★★
            // 一時停止時もアニメーションを止める
            setCurrentCommandIndex(-1);
            // ★★★ 修正 終了 ★★★
        } else {
            // Reset state before starting execution
            setGameStatus("running");
            setCurrentCommandIndex(0); // 実行開始 (Index 0 から)
            setRobotState(initialRobotState); 
            setErrorMessage("");
            setMoveCount(0);
            executionErrorRef.current = null; // エラーフラグをリセット
            
            // ★★★★★ バグ修正 (関連) ★★★★★
            // 実行開始時に迷路をリセットする
            // (ifHole の変更が次の実行に残らないようにする)
            if (mazeId) {
                const stored = localStorage.getItem("progpath_mazes");
                if (stored) {
                    const mazes: MazeData[] = JSON.parse(stored);
                    const foundMaze = mazes.find((m) => m.id === mazeId);
                    if (foundMaze) {
                        setMaze(foundMaze);
                    }
                }
            }
            // ★★★★★ 修正終了 ★★★★★
            
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

    // --- JSX Rendering (変更なし) ---
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

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
                    {/* Left Panel: 3D Maze View and Status */}
                    <Card className="border-neon-blue/30 bg-space-dark/50 p-6">
                        <MazeView3D
                            maze={maze}
                            robotState={robotState}
                            onMarkerDetected={handleMarkerDetected} // 安定化された関数を渡す
                            detectedCommandName={detectedCommandName} 
                            currentCommandIndex={currentCommandIndex} // -1 が渡されるとアニメーションが停止する
                            flattenedCommands={flattenedCommands} 
                        />

                        {/* Status Display Area */}
                        <div className="mt-4 space-y-2">
                            {/* Move Counter */}
                            <div className="flex items-center justify-center">
                                <div className="rounded-lg border border-neon-blue/30 bg-space-blue/20 px-4 py-2">
                                    <p className="text-sm text-muted-foreground">
                                        {" "}
                                        移動回数:{" "}
                                        <span className="font-bold text-neon-cyan">
                                            {moveCount}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            {/* Success Message */}
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
                            {/* Failure Message */}
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
                            <DialogTitle className="text-neon-cyan">
                                ループ回数を入力
                            </DialogTitle>
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
                            <Button
                                onClick={handleLoopConfirm}
                                className="bg-neon-cyan text-space-dark hover:bg-neon-cyan/90"
                            >
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
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

interface InsertionPoint {
    parentIndex: number | null;
    childIndex: number;
}

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
    const importMode = searchParams.get("import") === "true";

    const [maze, setMaze] = useState<MazeData | null>(null);
    const [commands, setCommands] = useState<Command[]>([]);
    const [robotState, setRobotState] = useState<RobotState>({
        x: 0,
        y: 0,
        z: 0, // 階層情報を追加
        direction: [0, 1], // ★ 修正: 初期向きを [1, 0] (東) から [0, 1] (南) に変更
    });
    const [initialRobotState, setInitialRobotState] = useState<RobotState>({
        x: 0,
        y: 0,
        z: 0, // 階層情報を追加
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
    const [buildingLoopIndex, setBuildingLoopIndex] = useState<number | null>(null); // ★ 追加: 構築中のloopコマンドのインデックス

    const [insertionPoint, setInsertionPoint] = useState<InsertionPoint>({
        parentIndex: null,
        childIndex: 0
    });
    
    // ★ バグ修正: ループ回数入力用の文字列 state
    const [loopInputString, setLoopInputString] = useState<string>("2");

    // --- ループ構築中フラグ ---
    const [isBuildingLoop, setIsBuildingLoop] = useState(false);

    // 実行エラー（壁、穴など）の状態を保持するRef
    const executionErrorRef = useRef<string | null>(null);

    // --- 修正: 無限ループ対策 ---
    // state の値を ref に同期させ、安定したコールバック内から
    // 最新の値を参照できるようにする
    const isBuildingLoopRef = useRef(isBuildingLoop);
    const tempLoopCommandRef = useRef(tempLoopCommand);
    const buildingLoopIndexRef = useRef<number | null>(null); // ★ 追加: buildingLoopIndexのRef
    const isExecutingRef = useRef(isExecuting);

    // ★★★★★ バグ修正 ★★★★★
    // 迷路の最新状態を Ref にも保持する
    const mazeRef = useRef<MazeData | null>(null);
    // ★★★★★ 修正終了 ★★★★★


    // ★★★ 修正 (Invalid hook call エラー修正) ★★★
    // 実行ループのタイマーIDを保持するRef (トップレベルに移動)
    const timerIdRef = useRef<number | null>(null);
    // ★★★ 修正 終了 ★★★

    // ★ 追加: 最後に追加したコマンド情報（インターバル制御用）
    const lastAddedCommandRef = useRef<{ type: string; time: number } | null>(null);

    useEffect(() => {
        isBuildingLoopRef.current = isBuildingLoop;
    }, [isBuildingLoop]);

    useEffect(() => {
        tempLoopCommandRef.current = tempLoopCommand;
    }, [tempLoopCommand]);

    useEffect(() => {
        buildingLoopIndexRef.current = buildingLoopIndex;
    }, [buildingLoopIndex]); // ★ 追加: buildingLoopIndexの同期

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


    // Effect to load maze data
    useEffect(() => {
        // マイグレーション関数
        const migrateMazeData = (maze: any): MazeData => {
            if (maze.layers) return maze as MazeData;
            return { ...maze, layers: [maze.grid], currentLayer: 0 };
        };

        if (mazeId) {
            // 通常モード: 指定されたIDの迷路を読み込む
            const stored = localStorage.getItem("progpath_mazes");
            if (stored) {
                const parsed = JSON.parse(stored);
                const mazes: MazeData[] = parsed.map(migrateMazeData);
                const foundMaze = mazes.find((m) => m.id === mazeId);
                if (foundMaze) {
                    setMaze(foundMaze);
                    // 最初の階層（z=0）でstartタイルを探す
                    for (let y = 0; y < foundMaze.layers[0].length; y++) {
                        for (let x = 0; x < foundMaze.layers[0][y].length; x++) {
                            if (foundMaze.layers[0][y][x] === "start") {
                                const startState = {
                                    x,
                                    y,
                                    z: 0,
                                    direction: [0, 1] as DirectionVector,
                                };
                                setRobotState(startState);
                                setInitialRobotState(startState);
                                return;
                            }
                        }
                    }
                }
            }
        } else if (importMode) {
            // インポートモード: カメラでQRコードをスキャンして迷路を読み込む
            // 最初の迷路をデフォルトとして読み込む
            const stored = localStorage.getItem("progpath_mazes");
            if (stored) {
                const parsed = JSON.parse(stored);
                const mazes: MazeData[] = parsed.map(migrateMazeData);
                if (mazes.length > 0) {
                    const defaultMaze = mazes[0];
                    setMaze(defaultMaze);
                    // 最初の階層でstartタイルを探す
                    for (let y = 0; y < defaultMaze.layers[0].length; y++) {
                        for (let x = 0; x < defaultMaze.layers[0][y].length; x++) {
                            if (defaultMaze.layers[0][y][x] === "start") {
                                const startState = {
                                    x,
                                    y,
                                    z: 0,
                                    direction: [0, 1] as DirectionVector,
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
    }, [mazeId, importMode]);

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
                const currentZ = robotState.z;
                if (mazeRef.current && 
                    currentZ >= 0 && 
                    currentZ < mazeRef.current.layers.length &&
                    mazeRef.current.layers[currentZ][robotState.y][robotState.x] !== "goal") {
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
                const checkZ = robotState.z;

                if (
                    checkX >= 0 &&
                    checkX < currentMaze.size && // <-- 修正: currentMaze
                    checkY >= 0 &&
                    checkY < currentMaze.size && // <-- 修正: currentMaze
                    checkZ >= 0 &&
                    checkZ < currentMaze.layers.length
                ) {
                    // ★★★★★ バグ修正 ★★★★★
                    // 読み取りに currentMaze (mazeRef.current) を使用
                    if (currentMaze.layers[checkZ][checkY][checkX] === "hole") {
                        const newLayers = currentMaze.layers.map((layer, idx) =>
                            idx === checkZ
                                ? layer.map(row => [...row])
                                : layer
                        );
                        newLayers[checkZ][checkY][checkX] = "floor";
                        // setMaze は state を更新するために必須
                        setMaze(
                            (prevMaze) =>
                                prevMaze ? { ...prevMaze, layers: newLayers } : null
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
                    const currentZ = prevState.z;
                    if (currentZ < 0 || currentZ >= latestMaze.layers.length) {
                        executionErrorRef.current = "階層エラーが発生しました！";
                        return prevState;
                    }
                    const targetTile = latestMaze.layers[currentZ][newY][newX];
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

                    // 4. テレポート床チェック
                    if (targetTile === "teleportUp") {
                        if (currentZ < latestMaze.layers.length - 1) {
                            newState = { ...prevState, x: newX, y: newY, z: currentZ + 1 };
                            setMoveCount((prev) => prev + 1);
                        } else {
                            executionErrorRef.current = "これより上の階層はありません！";
                            return prevState;
                        }
                    } else if (targetTile === "teleportDown") {
                        if (currentZ > 0) {
                            newState = { ...prevState, x: newX, y: newY, z: currentZ - 1 };
                            setMoveCount((prev) => prev + 1);
                        } else {
                            executionErrorRef.current = "これより下の階層はありません！";
                            return prevState;
                        }
                    } else if (targetTile === "goal") {
                        // 5. ゴールチェック
                        newState = { ...prevState, x: newX, y: newY }; // ゴールに移動
                        setMoveCount((prev) => prev + 1);
                        // ゴールはエラーではない
                        setGameStatus("success");
                        setIsExecuting(false); // 実行停止 (これは即時反映される)
                        setCurrentCommandIndex(-1); // アニメーション停止
                        return newState; // 移動する
                    } else {
                        // 6. 安全な移動 (床)
                        newState = { ...prevState, x: newX, y: newY };
                        setMoveCount((prev) => prev + 1);
                    }

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
        setCommands((prevCommands) => {
            const newCommands = [...prevCommands];

            if (insertionPoint.parentIndex === null) {
                // ルートレベルへの挿入
                newCommands.splice(insertionPoint.childIndex, 0, newCommand);
            } else {
                // ループ内への挿入
                const parentCommand = newCommands[insertionPoint.parentIndex];
                if (parentCommand && parentCommand.children) {
                    // ★ 修正: children配列の新しいコピーを作成
                    const children = [...parentCommand.children];
                    children.splice(insertionPoint.childIndex, 0, newCommand);
                    newCommands[insertionPoint.parentIndex] = { ...parentCommand, children };
                }
            }

            return newCommands;
        });

        // 挿入位置を次の位置に進める
        setInsertionPoint(prev => ({
            ...prev,
            childIndex: prev.childIndex + 1
        }));
    }, [insertionPoint]);

    // Callback function called by MazeView3D when a marker is detected
    // 依存配列を安定させ、Ref を使って最新の state を読む
    const handleMarkerDetected = useCallback((detectedCommand: Command) => {
        // isExecuting を Ref から読む
        if (isExecutingRef.current) return; // Ignore markers while executing

        // ★ 追加: 同じコマンドタイプが2秒以内に連続して検出されたら無視
        const now = Date.now();
        const lastAdded = lastAddedCommandRef.current;
        if (lastAdded && lastAdded.type === detectedCommand.type && (now - lastAdded.time) < 2000) {
            return; // 同じコマンドタイプが2秒以内なら無視
        }
        
        // ★ 現在のコマンドを記録
        lastAddedCommandRef.current = { type: detectedCommand.type, time: now };
    
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
                // ★ 修正: handleAddCommandは呼ばない（既に追加済み）
 


                setIsBuildingLoop(false); // state を更新
                setTempLoopCommand(null); // state を更新
                setBuildingLoopIndex(null); // インデックスをリセット
            } else {
                // --- ループ開始処理 ---
                // ★ バグ修正: 
                const initialCommand = {
                    ...detectedCommand,
                    loopCount: detectedCommand.loopCount || 2,
                    children: [],
                };
                setTempLoopCommand(initialCommand); // 先にセット
                setLoopInputString(String(initialCommand.loopCount)); // input 用の文字列 state もセット
                setLoopPopupOpen(true);
            }
                } else {
            // --- ループ以外のコマンド処理 ---
            // isBuildingLoop を Ref から読む
            if (isBuildingLoopRef.current) {
                // ★ 修正: loop構築中は、setCommandsのみで処理
                const loopIndex = buildingLoopIndexRef.current;
                
                // commands配列内のloopコマンドを更新
                if (loopIndex !== null) {
                    setCommands((prevCommands) => {
                        const newCommands = [...prevCommands];
                        if (newCommands[loopIndex]) {
                            const children = newCommands[loopIndex].children || [];
                            newCommands[loopIndex] = {
                                ...newCommands[loopIndex],
                                children: [
                                    ...children.slice(0, insertionPoint.childIndex),
                                    detectedCommand,
                                    ...children.slice(insertionPoint.childIndex)
                                ],
                            };
                        }
                        return newCommands;
                    });
                }
                
                // 挿入位置を次に進める（loop内の場合のみ）
                if (insertionPoint.parentIndex === loopIndex) {
                    setInsertionPoint(prev => ({
                        ...prev,
                        childIndex: prev.childIndex + 1
                    }));
                }
            } else {
                // 通常時：直接スタックに追加
                handleAddCommand(detectedCommand);
            }
        }
    // 依存配列から state を削除し、安定した setter と handleAddCommand のみに依存
    }, [handleAddCommand, setDetectedCommandName, setIsBuildingLoop, setTempLoopCommand, setLoopPopupOpen]);
    // --- 修正 終了 ---

    // ★ バグ修正: Function called when the 'Confirm' button in the loop popup is clicked
    const handleLoopConfirm = () => {
        let count = Number.parseInt(loopInputString); // "" は NaN
        
        if (isNaN(count) || count < 1) {
            count = 1;
        } else if (count > 10) {
            count = 10;
        }
        
        if (tempLoopCommand) {
             // 確定した値で tempLoopCommand を更新
            const updatedCommand = { ...tempLoopCommand, loopCount: count };
            setTempLoopCommand(updatedCommand);
            handleAddCommand(updatedCommand); // ★ loop コマンドを即座に追加
                        
            const loopIndex = commands.length; // 追加されるloopのインデックス
            setBuildingLoopIndex(loopIndex); // ★ インデックスを記録
            setIsBuildingLoop(true);
            
            // ★ 追加: insertionPointをloop内の先頭に設定
            setInsertionPoint({
                parentIndex: loopIndex,
                childIndex: 0
            });
        }
        setLoopPopupOpen(false);
    };

    // ★ バグ修正: Function to handle changes in the loop count input field
    const handleLoopCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // type="number" は空文字 "" も許可する
        const value = e.target.value;
        // 数値か空文字のみ許可
        if (value === "" || /^[0-9]+$/.test(value)) {
             // 長すぎる入力を防ぐ
             if (value.length > 3) return;
             setLoopInputString(value);
        }
    };

    // Function to remove a command (no changes)
    const handleRemoveCommand = (index: number) => {
        setCommands(commands.filter((_, i) => i !== index));

        // ★ 追加: 削除時のフィードバックメッセージ
        setDetectedCommandName("Command Deleted");
        setTimeout(() => setDetectedCommandName(null), 1500);
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
                const parsed = JSON.parse(stored);
                const migrateMazeData = (maze: any): MazeData => {
                    if (maze.layers) return maze as MazeData;
                    return { ...maze, layers: [maze.grid], currentLayer: 0 };
                };
                const mazes: MazeData[] = parsed.map(migrateMazeData);
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
                    const parsed = JSON.parse(stored);
                    const migrateMazeData = (maze: any): MazeData => {
                        if (maze.layers) return maze as MazeData;
                        return { ...maze, layers: [maze.grid], currentLayer: 0 };
                    };
                    const mazes: MazeData[] = parsed.map(migrateMazeData);
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

    // Auto-hide success/failure messages after 3 seconds
    useEffect(() => {
        if (gameStatus === "success" || gameStatus === "failed") {
            const timer = setTimeout(() => {
                setGameStatus("idle");
            }, 3000);
            
            return () => clearTimeout(timer);
        }
    }, [gameStatus]);

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
                    <Card className="relative border-neon-blue/30 bg-space-dark/50 p-6">
                        <MazeView3D
                            maze={maze}
                            robotState={robotState}
                            onMarkerDetected={handleMarkerDetected} // 安定化された関数を渡す
                            detectedCommandName={detectedCommandName} 
                            currentCommandIndex={currentCommandIndex} // -1 が渡されるとアニメーションが停止する
                            flattenedCommands={flattenedCommands} 
                        />

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
                            {false && gameStatus === "success" && (
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
                            {false && gameStatus === "failed" && (
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
                            onRemoveChild={() => {
                                setDetectedCommandName("Command Deleted");
                                setTimeout(() => setDetectedCommandName(null), 1500);
                            }}
                            onAddCommand={() => {}} // Adding commands is now done via markers
                            onUpdateCommand={handleUpdateCommand}
                            insertionPoint={insertionPoint}
                            onSetInsertionPoint={setInsertionPoint}
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
                            {/* ★ バグ修正: value と onChange を変更 */}
                            <Input
                                id="loopCountInput"
                                type="number"
                                value={loopInputString}
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
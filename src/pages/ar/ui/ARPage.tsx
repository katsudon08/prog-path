/**
 * AR実行ページコンポーネント
 * 迷路の3D表示とコマンド実行を統合
 */

'use client';

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMazeStore, type MazeData, findStartPosition } from '@/src/entities/maze';
import { useRobotStore, type RobotState } from '@/src/entities/robot';
import { type Command, type CommandType } from '@/src/entities/command';
import { useCommandStore, useCommandBuilder } from '@/src/features/command-management';
import { useSimulationStore } from '@/src/features/maze-simulation/model/useSimulationStore';
import { useSimulationRunner } from '@/src/features/maze-simulation/model/useSimulationRunner';
import { ARPlaygroundWidget } from '@/src/widgets/ar';
import { MazeView3DWidget } from '@/src/widgets/maze-view-3d';
import { useToast } from '@/src/shared/ui/toast/useToast';

export function ARPage(): React.ReactElement {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mazeId = searchParams?.get('id') ?? null;
    const importMode = searchParams?.get('import') === 'true';

    // Stores
    const { selectedMaze, selectMaze, initialize, getMazeById } = useMazeStore();
    const { robotState, animationState } = useRobotStore();
    const { commands, clearCommands } = useCommandStore();
    const { addCommandToActivePath } = useCommandBuilder();
    const { addToast } = useToast();
    const { status, currentPath, setInitialMazeData, forwardStepCount, resultDetails, setResultDetails, speed } = useSimulationStore();
    const { run, pause, reset } = useSimulationRunner();

    // Debug: Monitor selectedMaze changes
    useEffect(() => {
        if (selectedMaze) {
            console.log('[ARPage] selectedMaze changed, first tile of layer 0:', selectedMaze.layers[0]?.[1]?.[0]);
        }
    }, [selectedMaze]);

    // 結果表示の自動消去タイマー
    useEffect(() => {
        if (resultDetails) {
            const timer = setTimeout(() => {
                setResultDetails(null);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [resultDetails, setResultDetails]);

    // QR Detection State
    const [detectedCommandName, setDetectedCommandName] = useState<string | null>(null);
    const lastAddedCommandRef = useRef<{ type: string; time: number } | null>(null);

    // Cleanup Effect (Unmount)
    const cleanupRefs = useRef({ reset, clearCommands });
    
    // Update refs on every render to ensure we have the latest functions
    useEffect(() => {
        cleanupRefs.current = { reset, clearCommands };
    });

    // Cleanup on unmount only
    useEffect(() => {
        return () => {
            console.log('[ARPage] Unmounting: cleaning up');
            // reset() restores maze and resets robot
            cleanupRefs.current.reset();
            // clearCommands() clears the stack
            cleanupRefs.current.clearCommands();
        };
    }, []);

    // Load maze from localStorage
    useEffect(() => {
        // ストアを初期化
        initialize();

        if (!mazeId && !importMode) {
            // If no maze ID and not import mode, redirect to home
            if (!selectedMaze) {
                router.push('/');
            }
            return;
        }

        // ストアから迷路を取得（初期化後）
        if (mazeId) {
            // 既に選択されている迷路が対象の迷路と同じなら、リロードしない
            // (シミュレーション中の状態変更でこのEffectが発火しても、上書きを防ぐ)
            if (selectedMaze?.id === mazeId) {
                return;
            }

            const maze = getMazeById(mazeId);
            if (maze) {
                selectMaze(maze);
                return;
            }
        }

        // フォールバック: LocalStorageから直接読み込み
        const stored = localStorage.getItem('progpath_mazes');
        if (!stored) return;

        const mazes: MazeData[] = JSON.parse(stored);
        let targetMaze: MazeData | undefined;

        if (mazeId) {
            targetMaze = mazes.find((m) => m.id === mazeId);
        } else if (importMode && mazes.length > 0) {
            targetMaze = mazes[0];
        }

        if (targetMaze) {
            selectMaze(targetMaze);
            
            // [Initialization] AR画面遷移時: ロボットリセット、コマンド消去、初期状態保存
            clearCommands();
            const startPos = findStartPosition(targetMaze);
            if (startPos) {
                useRobotStore.getState().updateRobotState({
                    x: startPos.x,
                    y: startPos.y,
                    layer: startPos.layer,
                    direction: [0, 1],
                    hasKey: false
                });
            }
            setInitialMazeData(structuredClone(targetMaze));
        }
    }, [mazeId, importMode, router, selectMaze, selectedMaze, initialize, getMazeById, clearCommands, setInitialMazeData]);

    // QR Command Detection Handler
    const handleMarkerDetected = useCallback((detectedCommand: Command) => {
        if (status === 'running') return;

        const now = Date.now();
        const lastAdded = lastAddedCommandRef.current;
        if (lastAdded && lastAdded.type === detectedCommand.type && (now - lastAdded.time) < 2000) {
            return;
        }

        lastAddedCommandRef.current = { type: detectedCommand.type, time: now };

        setDetectedCommandName(detectedCommand.type);
        setTimeout(() => setDetectedCommandName(null), 2000);

        // useCommandBuilder経由でコマンドを追加（insertIndex/activePathを考慮）
        const result = addCommandToActivePath(detectedCommand.type as CommandType);
        addToast(result);
    }, [status, addCommandToActivePath, addToast]);

    // Flatten commands for 3D widget
    const flattenedCommands: Command[] = React.useMemo(() => {
        const result: Command[] = [];
        const flatten = (cmds: Command[]) => {
            for (const cmd of cmds) {
                result.push(cmd);
                if (cmd.type === 'loop' && cmd.children) {
                    flatten(cmd.children);
                }
            }
        };
        flatten(commands);
        return result;
    }, [commands]);

    // Current command index from path
    const currentCommandIndex = currentPath.length > 0 ? currentPath[currentPath.length - 1] : -1;

    // Loading state
    if (!selectedMaze) {
        return (
            <div className="flex h-screen items-center justify-center bg-space-darker">
                <p className="text-neon-cyan">迷路を読み込んでいます...</p>
            </div>
        );
    }

    // Render 3D view with all required props
    const view3D = (
        <MazeView3DWidget
            maze={selectedMaze}
            robotState={robotState}
            animationState={animationState}
            onMarkerDetected={handleMarkerDetected}
            detectedCommandName={detectedCommandName}
            currentCommandIndex={currentCommandIndex}
            flattenedCommands={flattenedCommands}
            speed={speed}
        >
            {/* 結果オーバーレイ */}
            {resultDetails && (status === 'finished' || status === 'error') && (
                <div className="absolute inset-0 flex items-center justify-center z-40 p-4 pointer-events-none">
                    <div className={`
                        bg-space-darker/90 border-2 rounded-xl p-8 shadow-2xl backdrop-blur-md flex flex-col items-center justify-center
                        animate-in fade-in zoom-in-75 slide-in-from-bottom-5 duration-500 ease-out pointer-events-auto
                        w-[60%] h-[50%]
                        ${resultDetails.type === 'success' ? 'border-neon-green shadow-neon-green/40' : 'border-red-500 shadow-red-500/40'}
                    `}>
                        <h2 className={`
                            text-3xl font-bold mb-4 drop-shadow-lg
                            ${resultDetails.type === 'success' ? 'text-neon-green' : 'text-red-500'}
                        `}>
                            {resultDetails.type === 'success' ? 'GOAL! 🎉' : 'FAILED 😢'}
                        </h2>
                        
                        <div className="text-xl text-white text-center whitespace-pre-wrap">
                            {resultDetails.reason === 'goal_success' && (
                                <>
                                    「前にすすむ」: <span className="text-neon-cyan font-bold text-2xl mx-1">{resultDetails.stepCount}</span> 回
                                </>
                            )}
                            {resultDetails.reason === 'goal_missing_keys' && (
                                <>
                                    カギが足りません！<br/>
                                    あと <span className="text-neon-cyan font-bold text-2xl mx-1">{resultDetails.remainingKeys}</span> 個必要です
                                </>
                            )}
                            {resultDetails.reason === 'hole_fall' && "穴に落ちました..."}
                            {resultDetails.reason === 'wall_collision' && "壁にぶつかりました..."}
                            {resultDetails.reason === 'out_of_bounds' && "迷路の外にはみ出しました..."}
                            {resultDetails.reason === 'commands_exhausted' && "ゴールにたどり着けませんでした..."}
                        </div>
                    </div>
                </div>
            )}
        </MazeView3DWidget>
    );

    return (
        <div className="h-screen bg-space-darker">
            <ARPlaygroundWidget
                view3D={view3D}
                mazeName={selectedMaze.name}
            />
        </div>
    );
}

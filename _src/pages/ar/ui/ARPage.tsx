/**
 * AR実行ページコンポーネント
 * 迷路の3D表示とコマンド実行を統合
 */

'use client';

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMazeStore, type MazeData } from '@/_src/entities/maze';
import { useRobotStore, type RobotState } from '@/_src/entities/robot';
import { type Command } from '@/_src/entities/command';
import { useCommandStore } from '@/_src/features/command-management';
import { useSimulationStore } from '@/_src/features/maze-simulation/model/useSimulationStore';
import { useSimulationRunner } from '@/_src/features/maze-simulation/model/useSimulationRunner';
import { ARPlaygroundWidget } from '@/_src/widgets/ar';
import { MazeView3DWidget } from '@/_src/widgets/maze-view-3d';

export function ARPage(): React.ReactElement {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mazeId = searchParams?.get('id') ?? null;
    const importMode = searchParams?.get('import') === 'true';

    // Stores
    const { selectedMaze, selectMaze } = useMazeStore();
    const { robotState } = useRobotStore();
    const { commands, addCommand } = useCommandStore();
    const { status, currentPath } = useSimulationStore();
    const { run, pause, reset } = useSimulationRunner();

    // QR Detection State
    const [detectedCommandName, setDetectedCommandName] = useState<string | null>(null);
    const lastAddedCommandRef = useRef<{ type: string; time: number } | null>(null);

    // Load maze from localStorage
    useEffect(() => {
        if (!mazeId && !importMode) {
            // If no maze ID and not import mode, redirect to home
            if (!selectedMaze) {
                router.push('/');
            }
            return;
        }

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
        }
    }, [mazeId, importMode, router, selectMaze, selectedMaze]);

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

        addCommand(detectedCommand, []);  // Add to root level
    }, [status, addCommand]);

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
            onMarkerDetected={handleMarkerDetected}
            detectedCommandName={detectedCommandName}
            currentCommandIndex={currentCommandIndex}
            flattenedCommands={flattenedCommands}
        />
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

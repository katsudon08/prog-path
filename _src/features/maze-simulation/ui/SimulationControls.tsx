"use client"

import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react'
import { useSimulationStore } from '../model/useSimulationStore'
import { useSimulationRunner } from '../model/useSimulationRunner'
import { useToast } from '@/_src/shared/ui/toast/useToast'
import { useRobotStore, DEFAULT_DIRECTION } from '@/_src/entities/robot'
import { useMazeStore, findStartPosition } from '@/_src/entities/maze'
import { useEffect, useRef } from 'react'
import { createSuccessResult, createErrorResult } from '@/_src/shared/model'

interface SimulationControlsProps {
    className?: string
}

export function SimulationControls({ className = '' }: SimulationControlsProps) {
    const { status, error } = useSimulationStore()
    const { run, pause, step, reset: runnerReset } = useSimulationRunner()
    const { updateRobotState } = useRobotStore()
    const { selectedMaze } = useMazeStore()
    const { addToast } = useToast()

    // 前回の迷路IDを記録
    const prevMazeIdRef = useRef<string | undefined>(selectedMaze?.id)

    // 迷路が切り替わったら自動リセット
    useEffect(() => {
        if (selectedMaze?.id !== prevMazeIdRef.current) {
            prevMazeIdRef.current = selectedMaze?.id
            // 初回レンダリング時は除く
            if (prevMazeIdRef.current !== undefined) {
                runnerReset()
                // ロボットを新しい迷路のスタート地点に移動
                if (selectedMaze) {
                    const startPos = findStartPosition(selectedMaze)
                    if (startPos) {
                        updateRobotState({
                            x: startPos.x,
                            y: startPos.y,
                            layer: startPos.layer,
                            direction: DEFAULT_DIRECTION,
                            hasKey: false
                        })
                    }
                }
            }
        }
    }, [selectedMaze?.id, runnerReset, updateRobotState, selectedMaze])

    // エラー/完了時にトースト表示
    useEffect(() => {
        if (status === 'error' && error) {
            addToast(createErrorResult("実行エラー", [error]))
        }
        if (status === 'finished') {
            // ゴール到達時はRunner側でメッセージが出るのでここでは汎用メッセージ
            addToast(createSuccessResult("シミュレーション完了"))
        }
    }, [status, error, addToast])

    const handlePlay = () => {
        run()
    }

    const handlePause = () => {
        pause()
    }

    const handleStep = async () => {
        const result = await step()
        if (!result.success) {
            // エラー時はuseEffectでハンドリングされるのでここでは何もしない、あるいはログ出力
        }
    }

    const handleReset = () => {
        // シミュレーション状態のリセット
        runnerReset()

        // ロボットを初期位置へ戻す
        if (selectedMaze) {
            const startPos = findStartPosition(selectedMaze)
            if (startPos) {
                resetRobot({
                    x: startPos.x,
                    y: startPos.y,
                    layer: startPos.layer,
                    direction: DEFAULT_DIRECTION,
                    hasKey: false
                })
                addToast(createSuccessResult("リセットしました"))
            } else {
                addToast(createErrorResult("リセット失敗", ["スタート地点が見つかりません"]))
            }
        }
    }

    const isRunning = status === 'running'

    return (
        <div className={`flex items-center gap-2 p-2 bg-space-dark/80 rounded-lg border border-neon-blue/20 backdrop-blur-sm ${className}`}>
            
            {/* 再生/一時停止 */}
            {isRunning ? (
                <button
                    onClick={handlePause}
                    className="p-2 rounded-full bg-neon-yellow/20 text-neon-yellow hover:bg-neon-yellow/30 transition-colors"
                >
                    <Pause size={20} fill="currentColor" />
                </button>
            ) : (
                <button
                    onClick={handlePlay}
                    className="p-2 rounded-full bg-neon-green/20 text-neon-green hover:bg-neon-green/30 transition-colors"
                >
                    <Play size={20} fill="currentColor" />
                </button>
            )}

            {/* ステップ実行 */}
            <button
                onClick={handleStep}
                disabled={isRunning}
                className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-foreground"
                title="1ステップ実行"
            >
                <SkipForward size={20} />
            </button>

            {/* リセット */}
            <button
                onClick={handleReset}
                disabled={isRunning}
                className="p-2 rounded-full text-neon-red hover:bg-neon-red/10 disabled:opacity-30 disabled:cursor-not-allowed"
                title="初期位置に戻す"
            >
                <RotateCcw size={20} />
            </button>

            {/* ステータス表示（デバッグ用） */}
            <div className="ml-2 text-xs text-muted-foreground font-mono">
                {status.toUpperCase()}
            </div>
        </div>
    )
}

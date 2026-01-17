"use client"

import { useCallback, useRef } from 'react'
import { useRobotStore, moveForward, turnRight, turnLeft } from '@/_src/entities/robot'
import { useMazeStore, findStartPosition } from '@/_src/entities/maze'
import { useCommandStore } from '../../command-management'
import { useSimulationStore } from './useSimulationStore'
import { isWalkable } from '../lib/collision'
import { getCommandByPath, getNextPath } from '../lib/tree-utils'
import type { MazeData, TileType } from '@/_src/entities/maze'
import { 
    type ActionResult, 
    createSuccessResult, 
    createErrorResult, 
    createInfoResult 
} from '@/_src/shared/model'

/**
 * 指定位置のタイルを取得
 */
function getTile(maze: MazeData, x: number, y: number, layer: number): TileType | undefined {
    const layers = maze.layers
    if (layer < 0 || layer >= layers.length) return undefined
    if (y < 0 || y >= layers[layer].length) return undefined
    if (x < 0 || x >= layers[layer][y].length) return undefined
    return layers[layer][y][x]
}

/**
 * 迷路のタイルを書き換える（ディープコピーを作成）
 */
function setTile(maze: MazeData, x: number, y: number, layer: number, tile: TileType): MazeData {
    const newLayers = maze.layers.map((l, li) =>
        li === layer
            ? l.map((row, yi) =>
                yi === y
                    ? row.map((cell, xi) => (xi === x ? tile : cell))
                    : row
              )
            : l
    )
    return { ...maze, layers: newLayers }
}

export function useSimulationRunner() {
    const { 
        status, 
        speed,
        currentPath, 
        loopCounters,
        initialMazeData,
        setStatus, 
        setCurrentPath, 
        setError,
        incrementLoopCounter,
        resetLoopCounter,
        setInitialMazeData,
        resetSimulation
    } = useSimulationStore()

    const { robotState, moveTo, rotateTo, setAnimationState, updateRobotState } = useRobotStore()
    const { commands } = useCommandStore()
    const { selectedMaze, selectMaze, updateMaze } = useMazeStore()

    const abortControllerRef = useRef<AbortController | null>(null)

    /**
     * マップイベントを処理（移動直後）
     */
    const handleMapEvent = useCallback((maze: MazeData, x: number, y: number, layer: number): ActionResult | null => {
        const tile = getTile(maze, x, y, layer)
        if (!tile) return null

        switch (tile) {
            case 'goal':
                setStatus('finished')
                return createSuccessResult('ゴールに到達しました！🎉')

            case 'hole':
                setAnimationState('falling')
                setStatus('error')
                setError('穴に落ちました')
                return createErrorResult('穴に落ちました')

            case 'key': {
                // 鍵を取得
                const newState = { ...useRobotStore.getState().robotState, hasKey: true }
                updateRobotState(newState)
                setAnimationState('collecting')
                // タイルを床に書き換え
                const updatedMaze = setTile(maze, x, y, layer, 'floor')
                selectMaze(updatedMaze)
                return null // 処理継続
            }

            case 'teleportUp':
                if (layer > 0) {
                    moveTo(x, y, layer - 1)
                    setAnimationState('teleporting')
                }
                return null

            case 'teleportDown':
                if (layer < maze.layers.length - 1) {
                    moveTo(x, y, layer + 1)
                    setAnimationState('teleporting')
                }
                return null

            default:
                return null
        }
    }, [setStatus, setError, setAnimationState, updateRobotState, selectMaze, moveTo])

    /**
     * 1ステップ実行
     */
    const step = useCallback(async (): Promise<ActionResult> => {
        // 最新の状態をストアから取得（stale closure対策）
        const currentState = useSimulationStore.getState()
        const latestCurrentPath = currentState.currentPath
        const latestLoopCounters = currentState.loopCounters
        const latestCommands = useCommandStore.getState().commands
        const latestRobotState = useRobotStore.getState().robotState
        const latestMaze = useMazeStore.getState().selectedMaze

        if (!latestMaze) {
            const msg = "迷路が選択されていません"
            setError(msg)
            return createErrorResult(msg)
        }

        // 初回実行時にスナップショットを保存
        if (!currentState.initialMazeData && currentState.status === 'idle') {
            setInitialMazeData(structuredClone(latestMaze))
        }

        const targetPath = latestCurrentPath.length === 0 ? [0] : latestCurrentPath
        const command = getCommandByPath(latestCommands, targetPath)

        if (!command) {
            setStatus('finished')
            return createInfoResult("実行終了")
        }

        setAnimationState('moving')

        try {
            switch (command.type) {
                case 'forward': {
                    const nextPos = moveForward(latestRobotState)
                    if (isWalkable(latestMaze, nextPos.x, nextPos.y, latestRobotState.layer)) {
                        moveTo(nextPos.x, nextPos.y, latestRobotState.layer)
                        
                        // マップイベント判定
                        const eventResult = handleMapEvent(latestMaze, nextPos.x, nextPos.y, latestRobotState.layer)
                        if (eventResult && !eventResult.success) {
                            return eventResult
                        }
                        if (eventResult && eventResult.success && eventResult.type === 'success' && eventResult.message.includes('ゴール')) {
                            return eventResult
                        }
                    } else {
                        throw new Error("壁に衝突しました")
                    }
                    break
                }

                case 'turnRight': {
                    const nextDir = turnRight(latestRobotState.direction)
                    rotateTo(nextDir)
                    setAnimationState('turning')
                    break
                }

                case 'turnLeft': {
                    const nextDir = turnLeft(latestRobotState.direction)
                    rotateTo(nextDir)
                    setAnimationState('turning')
                    break
                }

                case 'loop': {
                    // ループコマンド自体は何もしない。getNextPath が子要素へ遷移させる。
                    break
                }

                case 'ifHole': {
                    // 正面のタイルをチェック
                    const frontPos = moveForward(latestRobotState)
                    const frontTile = getTile(latestMaze, frontPos.x, frontPos.y, latestRobotState.layer)
                    
                    if (frontTile === 'hole') {
                        // 穴を埋める（アニメーション待機付き）
                        setAnimationState('collecting')
                        await new Promise(resolve => setTimeout(resolve, speed / 2))
                        const updatedMaze = setTile(latestMaze, frontPos.x, frontPos.y, latestRobotState.layer, 'floor')
                        selectMaze(updatedMaze)
                    }
                    // 穴でない場合は何もせずスキップ
                    break
                }

                default:
                    break
            }
        } catch (e: any) {
            const msg = e.message || "実行エラー"
            setError(msg)
            setStatus('error')
            setAnimationState('idle')
            return createErrorResult(msg)
        }

        // ロボット移動アニメーション完了を待つ
        await new Promise(resolve => setTimeout(resolve, speed))

        // 次のパスを計算
        const { nextPath, shouldResetPath } = getNextPath(latestCommands, targetPath, latestLoopCounters, incrementLoopCounter, resetLoopCounter)
        
        // ループ脱出時はそのカウンタをリセット
        if (shouldResetPath) {
            resetLoopCounter(shouldResetPath)
        }
        
        if (nextPath) {
            setCurrentPath(nextPath)
            setAnimationState('idle')
            return createSuccessResult("次のコマンドへ")
        } else {
            setStatus('finished')
            setAnimationState('idle')
            return createSuccessResult("全コマンド実行完了")
        }

    }, [
        speed,
        setStatus, 
        setError, 
        setCurrentPath, 
        moveTo, 
        rotateTo, 
        setAnimationState,
        incrementLoopCounter,
        resetLoopCounter,
        setInitialMazeData,
        handleMapEvent,
        selectMaze
    ])

    /**
     * 実行開始
     */
    const run = useCallback(async () => {
        const mazeStore = useMazeStore.getState()
        const currentMaze = mazeStore.selectedMaze
        const simStore = useSimulationStore.getState()
        
        if (!currentMaze) return
        
        // 初回実行時にスナップショットを保存
        if (!simStore.initialMazeData) {
            setInitialMazeData(structuredClone(currentMaze))
        }

        // 即座に実行状態に変更（削除ボタン無効化）
        setStatus('running')
        setCurrentPath([]) // ハイライトはStep実行直前に設定
        setError(null)

        // ロボットをスタート位置にリセット
        const startPos = findStartPosition(currentMaze)
        if (startPos) {
            updateRobotState({
                x: startPos.x,
                y: startPos.y,
                layer: startPos.layer,
                direction: [0, 1], // デフォルトの向き（下向き）
                hasKey: false
            })
        }

        // スタート位置リセット後に0.5秒待機
        await new Promise(resolve => setTimeout(resolve, 500))

        // 最初のコマンドのハイライトを設定
        setCurrentPath([0])

        const controller = new AbortController()
        abortControllerRef.current = controller

        try {
            while (!controller.signal.aborted) {
                const result = await step()
                
                if (!result.success || result.type === 'info') {
                    break
                }

                // ゴール到達時も終了
                const currentStatus = useSimulationStore.getState().status
                if (currentStatus !== 'running') {
                    break
                }
            }
        } catch (e) {
            console.error(e)
        } finally {
            abortControllerRef.current = null
        }
    }, [step, speed, setStatus, setError, setInitialMazeData, setCurrentPath, updateRobotState])

    /**
     * 一時停止
     */
    const pause = useCallback(() => {
        setStatus('paused')
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
    }, [setStatus])

    /**
     * リセット（迷路データも復元、ロボットをスタート位置に瞬間移動）
     */
    const reset = useCallback(() => {
        pause()
        
        // 迷路データを復元
        const simStore = useSimulationStore.getState()
        const mazeToRestore = simStore.initialMazeData
        if (mazeToRestore) {
            selectMaze(structuredClone(mazeToRestore))
            
            // ロボットをスタート位置に瞬間移動（updateRobotStateで完全リセット）
            const startPos = findStartPosition(mazeToRestore)
            if (startPos) {
                updateRobotState({
                    x: startPos.x,
                    y: startPos.y,
                    layer: startPos.layer,
                    direction: [0, 1], // デフォルトの向き（下向き）
                    hasKey: false
                })
            }
        }
        
        resetSimulation()
    }, [pause, selectMaze, resetSimulation, updateRobotState])

    return {
        run,
        pause,
        step,
        reset,
        status // UIで編集ロック判定用に公開
    }
}

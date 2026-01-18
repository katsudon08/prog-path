"use client"

import { useCallback, useRef } from 'react'
import { useRobotStore, moveForward, turnRight, turnLeft } from '@/src/entities/robot'
import { useMazeStore, findStartPosition } from '@/src/entities/maze'
import { useCommandStore } from '../../command-management'
import { useSimulationStore } from './useSimulationStore'
import { getCommandByPath, getNextPath } from '../lib/tree-utils'
import type { MazeData, TileType } from '@/src/entities/maze'
import {
    type ActionResult,
    createSuccessResult,
    createErrorResult,
    createInfoResult
} from '@/src/shared/model'
import { useToast } from '@/src/shared/ui/toast/useToast'

// ... imports

/**
 * 移動判定結果
 */
function checkMoveResult(maze: MazeData, x: number, y: number, layer: number): 'ok' | 'wall' | 'out_of_bounds' {
    const layers = maze.layers
    if (layer < 0 || layer >= layers.length) return 'out_of_bounds'
    
    const currentLayer = layers[layer]
    if (y < 0 || y >= currentLayer.length) return 'out_of_bounds'
    if (x < 0 || x >= currentLayer[y].length) return 'out_of_bounds'

    const tile = currentLayer[y][x]
    if (tile === 'wall') return 'wall'
    
    return 'ok'
}

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
        resetSimulation,
        incrementForwardStepCount,
        resetForwardStepCount,
        setResultDetails
    } = useSimulationStore()

    const { robotState, moveTo, rotateTo, setAnimationState, updateRobotState } = useRobotStore()
    const { commands } = useCommandStore()
    const { selectedMaze, selectMaze, updateMaze } = useMazeStore()

    const abortControllerRef = useRef<AbortController | null>(null)
    const runIdRef = useRef<number>(0)

    type MapEvent = 
        | { type: 'goal'; message: string }
        | { type: 'hole'; message: string }
        | { type: 'item'; message: string }
        | { type: 'teleportUp'; targetLayer: number; message: string }
        | { type: 'teleportDown'; targetLayer: number; message: string }
        | null

    /**
     * マップイベント判定（副作用なし）
     */
    const detectMapEvent = useCallback((maze: MazeData, x: number, y: number, layer: number): MapEvent => {
        const tile = getTile(maze, x, y, layer)
        if (!tile) return null

        if (tile === 'goal') {
            return { type: 'goal', message: 'ゴールに到達しました！' }
        }

        if (tile === 'hole') {
            return { type: 'hole', message: '穴に落ちてしまいました...' }
        }

        if (tile === 'key') {
            return { type: 'item', message: 'カギを取得しました' }
        }
        
        if (tile === 'teleportUp') {
             if (layer < maze.layers.length - 1) {
                 return { type: 'teleportUp', targetLayer: layer + 1, message: 'テレポートしました' }
             }
        }

        if (tile === 'teleportDown') {
            if (layer > 0) {
                return { type: 'teleportDown', targetLayer: layer - 1, message: 'テレポートしました' }
            }
        }

        return null
    }, [])

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

        console.log('[Step Start] Path:', targetPath, 'Command:', command?.type)
        console.log('[Step Start] Robot:', latestRobotState.x, latestRobotState.y, 'L:', latestRobotState.layer, 'Dir:', latestRobotState.direction)

        if (!command) {
            setStatus('finished')
            return createInfoResult("実行終了")
        }

        setAnimationState('moving')

        try {
            switch (command.type) {
                case 'forward': {
                    incrementForwardStepCount()
                    const nextPos = moveForward(latestRobotState)
                    const moveCheck = checkMoveResult(latestMaze, nextPos.x, nextPos.y, latestRobotState.layer)

                    if (moveCheck === 'ok') {
                        moveTo(nextPos.x, nextPos.y, latestRobotState.layer)

                        // マップイベント判定
                        const event = detectMapEvent(latestMaze, nextPos.x, nextPos.y, latestRobotState.layer)
                        
                        // まずは通常の移動アニメーション分待機
                        await new Promise(resolve => setTimeout(resolve, speed))

                        if (event) {
                            switch (event.type) {
                                case 'goal':
                                    // マップ上に残っているカギがあるかチェック
                                    const remainingKeyCount = latestMaze.layers.reduce((acc, layer) => 
                                        acc + layer.reduce((rAcc, row) => 
                                            rAcc + row.reduce((cAcc, cell) => cAcc + (cell === 'key' ? 1 : 0), 0), 0), 0)

                                    if (remainingKeyCount > 0) {
                                        setResultDetails({ type: 'failure', reason: 'goal_missing_keys', remainingKeys: remainingKeyCount })
                                        return createErrorResult(`全てのカギを集めてください！(残り${remainingKeyCount}個)`)
                                    }

                                    setResultDetails({ 
                                        type: 'success', 
                                        reason: 'goal_success', 
                                        stepCount: useSimulationStore.getState().forwardStepCount 
                                    })
                                    setStatus('finished')
                                    return createSuccessResult('ゴールに到達しました！🎉')

                                case 'hole':
                                    setAnimationState('falling')
                                    // 落下アニメーション待機
                                    await new Promise(resolve => setTimeout(resolve, 1000))
                                    setResultDetails({ type: 'failure', reason: 'hole_fall' })
                                    return createErrorResult(event.message)

                                case 'item': { // Key
                                    const newState = { ...useRobotStore.getState().robotState, hasKey: true }
                                    updateRobotState(newState)
                                    setAnimationState('collecting')
                                    
                                    const updatedMaze = setTile(latestMaze, nextPos.x, nextPos.y, latestRobotState.layer, 'floor')
                                    selectMaze(updatedMaze)

                                    const remainingKeys = updatedMaze.layers.reduce((acc, l) => 
                                        acc + l.reduce((rAcc, r) => 
                                            rAcc + r.reduce((cAcc, c) => cAcc + (c === 'key' ? 1 : 0), 0), 0), 0)
                                    
                                    useToast.getState().addToast(createSuccessResult(`カギを取得しました 🔑 (残り${remainingKeys}個)`))
                                    // カギ取得アニメーション待機（少し）
                                    await new Promise(resolve => setTimeout(resolve, 500))
                                    break;
                                }

                                case 'teleportUp':
                                case 'teleportDown': {
                                    setAnimationState('teleporting')
                                    moveTo(nextPos.x, nextPos.y, event.targetLayer)
                                    // テレポートアニメーション待機
                                    await new Promise(resolve => setTimeout(resolve, 1000))
                                    // return createSuccessResult(event.message) // OLD
                                    break // continue to nextPath logic
                                }
                            }
                        }
                        
                        // イベントがない、または継続可能なイベント（カギ）の場合は終了
                        if (!event || event.type === 'item') {
                             // 結果を保存してswitchを抜ける（この後パス更新へ）
                             break
                        }
                        
                         // ここには到達しないはず
                         break
                    } else {
                        const reason = moveCheck === 'out_of_bounds' ? 'out_of_bounds' : 'wall_collision'
                        const msg = reason === 'out_of_bounds' ? '迷路の外にはみ出しました' : '壁に衝突しました'
                        setResultDetails({ type: 'failure', reason })
                        throw new Error(msg)
                    }
                    // break is implicit due to block end, but good for clarity
                    break
                }

                case 'turnRight': {
                    const nextDir = turnRight(latestRobotState.direction)
                    rotateTo(nextDir)
                    setAnimationState('turning')
                    await new Promise(resolve => setTimeout(resolve, speed))
                    break
                }

                case 'turnLeft': {
                    const nextDir = turnLeft(latestRobotState.direction)
                    rotateTo(nextDir)
                    setAnimationState('turning')
                    await new Promise(resolve => setTimeout(resolve, speed))
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

                    console.log('[ifHole] Robot position:', latestRobotState.x, latestRobotState.y, 'direction:', latestRobotState.direction)
                    console.log('[ifHole] Front position:', frontPos.x, frontPos.y, 'layer:', latestRobotState.layer)
                    console.log('[ifHole] Front tile:', frontTile)

                    if (frontTile === 'hole') {
                        console.log('[ifHole] Filling hole at', frontPos.x, frontPos.y)
                        // 穴を埋める（アニメーション待機付き）
                        setAnimationState('filling')
                        await new Promise(resolve => setTimeout(resolve, 1000))
                        const updatedMaze = setTile(latestMaze, frontPos.x, frontPos.y, latestRobotState.layer, 'floor')
                        console.log('[ifHole] Updated maze tile:', getTile(updatedMaze, frontPos.x, frontPos.y, latestRobotState.layer))
                        selectMaze(updatedMaze)
                        console.log('[ifHole] selectMaze called')
                    } else {
                        console.log('[ifHole] No hole at front, skipping')
                        // 穴がない場合もチェック動作として少し待つ
                        await new Promise(resolve => setTimeout(resolve, speed / 2))
                    }
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

        // Generic wait removed
        // await new Promise(resolve => setTimeout(resolve, speed))

        // 次のパスを計算
        const { nextPath, shouldResetPath } = getNextPath(latestCommands, targetPath, latestLoopCounters, incrementLoopCounter, resetLoopCounter)

        // ループ脱出時はそのカウンタをリセット
        if (shouldResetPath) {
            resetLoopCounter(shouldResetPath)
        }

        console.log('[Step End] Next Path:', nextPath)

        if (nextPath) {
            setCurrentPath(nextPath)
            setAnimationState('idle')
            return createSuccessResult("次のコマンドへ")
        } else {
            console.log('[Step End] No next path. Finishing.')
            setStatus('finished')
            setResultDetails({ type: 'failure', reason: 'commands_exhausted' })
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
        detectMapEvent,
        selectMaze
    ])

    /**
     * 実行開始
     */
    const run = useCallback(async () => {
        // Run IDをインクリメント（これで以前の待機中の処理はすべて無効になる）
        const currentRunId = ++runIdRef.current

        // すでに実行中の場合は中断
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        const mazeStore = useMazeStore.getState()
        const currentMaze = mazeStore.selectedMaze
        const simStore = useSimulationStore.getState()

        if (!currentMaze) return

        // 初回実行時にスナップショットを保存、あれば復元
        if (!simStore.initialMazeData) {
            setInitialMazeData(structuredClone(currentMaze))
        } else {
            // 前回の実行で変更された迷路を元に戻す
            selectMaze(structuredClone(simStore.initialMazeData))
        }

        // 即座に実行状態に変更（削除ボタン無効化）
        setStatus('running')
        resetForwardStepCount()
        setResultDetails(null)
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

        // スタート位置リセット後に1秒待機
        await new Promise(resolve => setTimeout(resolve, 1000))

        // IDチェック: 待機中に新しい実行がリクエストされていたら、この処理は破棄
        if (runIdRef.current !== currentRunId) {
            console.log('Run aborted due to new run request', currentRunId, runIdRef.current)
            return
        }

        // 最初のコマンドのハイライトを設定
        setCurrentPath([0])
        
        const controller = new AbortController()
        abortControllerRef.current = controller

        try {
            while (!controller.signal.aborted) {
                // ループ中もRun IDチェック（念のため）
                if (runIdRef.current !== currentRunId) break

                const result = await step()

                // ステップ間の待機（ユーザー要望により少し長めに）
                await new Promise(resolve => setTimeout(resolve, 300))

                if (!result.success || result.type === 'info') {
                    if (!result.success && result.type === 'error') {
                        setError(result.message)
                        setStatus('error')
                    }
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
            if (abortControllerRef.current === controller) {
                abortControllerRef.current = null
            }
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

        // アニメーション状態をリセット（即座に反映させるため）
        setAnimationState('idle')

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
    }, [pause, selectMaze, resetSimulation, updateRobotState, setAnimationState])

    return {
        run,
        pause,
        step,
        reset,
        status // UIで編集ロック判定用に公開
    }
}

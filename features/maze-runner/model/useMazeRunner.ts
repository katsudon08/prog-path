/**
 * 迷路実行用カスタムフック
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type { Command, RobotState, DirectionVector } from '@entities/robot'
import type { MazeData } from '@entities/maze'
import { flattenCommands, executeCommand } from '@entities/robot'
import { findStartPosition } from '@entities/maze'

/**
 * ゲーム状態
 */
export type GameStatus = 'idle' | 'running' | 'success' | 'failed'

/**
 * 迷路実行フックの戻り値
 */
export interface UseMazeRunnerReturn {
    /** 迷路データ */
    maze: MazeData | null
    /** ロボット状態 */
    robotState: RobotState
    /** 初期ロボット状態（リセット用） */
    initialRobotState: RobotState
    /** 実行中フラグ */
    isExecuting: boolean
    /** 現在のコマンドインデックス */
    currentCommandIndex: number
    /** 展開されたコマンド */
    flattenedCommands: Command[]
    /** ゲーム状態 */
    gameStatus: GameStatus
    /** エラーメッセージ */
    errorMessage: string
    /** 移動回数 */
    moveCount: number
    /** 迷路をセット */
    setMaze: (maze: MazeData | null) => void
    /** 実行開始/一時停止 */
    toggleExecution: (commands: Command[]) => void
    /** リセット */
    reset: () => void
    /** 成功ダイアログを閉じる */
    closeSuccessDialog: () => void
    /** 失敗ダイアログを閉じる */
    closeFailedDialog: () => void
}

const DEFAULT_DIRECTION: DirectionVector = [0, 1]

/**
 * 迷路実行用カスタムフック
 */
export function useMazeRunner(): UseMazeRunnerReturn {
    const [maze, setMaze] = useState<MazeData | null>(null)
    const [robotState, setRobotState] = useState<RobotState>({
        x: 0,
        y: 0,
        z: 0,
        direction: DEFAULT_DIRECTION,
    })
    const [initialRobotState, setInitialRobotState] = useState<RobotState>({
        x: 0,
        y: 0,
        z: 0,
        direction: DEFAULT_DIRECTION,
    })
    const [isExecuting, setIsExecuting] = useState(false)
    const [currentCommandIndex, setCurrentCommandIndex] = useState(-1)
    const [flattenedCommands, setFlattenedCommands] = useState<Command[]>([])
    const [gameStatus, setGameStatus] = useState<GameStatus>('idle')
    const [errorMessage, setErrorMessage] = useState<string>('')
    const [moveCount, setMoveCount] = useState(0)

    // Refs for stable callbacks
    const mazeRef = useRef<MazeData | null>(null)
    const robotStateRef = useRef(robotState)
    const isExecutingRef = useRef(isExecuting)
    const timerIdRef = useRef<number | null>(null)
    const executionErrorRef = useRef<string | null>(null)
    const isTeleportingRef = useRef(false)

    // Sync state to refs
    useEffect(() => {
        mazeRef.current = maze
    }, [maze])

    useEffect(() => {
        robotStateRef.current = robotState
    }, [robotState])

    useEffect(() => {
        isExecutingRef.current = isExecuting
    }, [isExecuting])

    // 迷路がセットされたらスタート位置を検索
    useEffect(() => {
        if (!maze) return

        const startPos = findStartPosition(maze)
        if (startPos) {
            const newState: RobotState = {
                x: startPos.x,
                y: startPos.y,
                z: startPos.z,
                direction: startPos.direction,
            }
            setRobotState(newState)
            setInitialRobotState(newState)
        }
    }, [maze])

    // コマンド実行effect
    useEffect(() => {
        if (
            !isExecuting ||
            currentCommandIndex < 0 ||
            currentCommandIndex >= flattenedCommands.length ||
            !mazeRef.current
        ) {
            if (isExecuting && currentCommandIndex >= flattenedCommands.length) {
                setIsExecuting(false)
                setCurrentCommandIndex(-1)

                if (executionErrorRef.current) {
                    setGameStatus('failed')
                    setErrorMessage(executionErrorRef.current)
                    executionErrorRef.current = null
                    return
                }

                const currentZ = robotState.z
                if (
                    mazeRef.current &&
                    currentZ >= 0 &&
                    currentZ < mazeRef.current.layers.length &&
                    mazeRef.current.layers[currentZ][robotState.y][robotState.x] !== 'goal'
                ) {
                    setGameStatus('failed')
                    setErrorMessage('ゴールに到達できませんでした')
                }
            }
            return
        }

        // 実行開始時にエラーフラグをリセット
        if (isExecuting && currentCommandIndex === 0) {
            executionErrorRef.current = null
        }

        const runCommand = async () => {
            // 待機
            await new Promise<void>((resolve) => {
                const id = window.setTimeout(() => resolve(), 500)
                timerIdRef.current = id
            })
            timerIdRef.current = null

            if (executionErrorRef.current) {
                setGameStatus('failed')
                setErrorMessage(executionErrorRef.current)
                setIsExecuting(false)
                executionErrorRef.current = null
                setCurrentCommandIndex(-1)
                return
            }

            if (!isExecutingRef.current) return

            const command = flattenedCommands[currentCommandIndex]
            const currentMaze = mazeRef.current
            if (!currentMaze) return

            const currentRobotState = robotStateRef.current

            // コマンド実行
            const result = executeCommand(currentRobotState, currentMaze, command)

            if (result.error) {
                executionErrorRef.current = result.error
            }

            if (executionErrorRef.current && !result.shouldIncrementMoveCount) {
                setGameStatus('failed')
                setErrorMessage(executionErrorRef.current)
                setIsExecuting(false)
                setCurrentCommandIndex(-1)
                executionErrorRef.current = null
                return
            }

            // 状態更新
            setRobotState(result.newState)
            robotStateRef.current = result.newState

            if (result.shouldIncrementMoveCount) {
                setMoveCount((prev) => prev + 1)
            }

            // アニメーション待機
            let animationDuration = 500
            if (result.isTeleporting) {
                animationDuration = 1100
                isTeleportingRef.current = true
            } else if (command.type === 'turnRight' || command.type === 'turnLeft') {
                animationDuration = 300
            }

            await new Promise<void>((resolve) => {
                const id = window.setTimeout(() => resolve(), animationDuration)
                timerIdRef.current = id
            })
            timerIdRef.current = null
            isTeleportingRef.current = false

            // 迷路更新（鍵取得など）
            if (result.newMaze) {
                setMaze(result.newMaze)
            }

            // ゴール到達チェック
            if (result.isGoalReached) {
                setGameStatus('success')
                setIsExecuting(false)
                setCurrentCommandIndex(-1)
                return
            }

            // エラーチェック（穴落下など）
            if (executionErrorRef.current) {
                setGameStatus('failed')
                setErrorMessage(executionErrorRef.current)
                setIsExecuting(false)
                setCurrentCommandIndex(-1)
                executionErrorRef.current = null
                return
            }

            // 次のコマンドへ
            setCurrentCommandIndex((prev) => prev + 1)
        }

        runCommand()

        return () => {
            if (timerIdRef.current) {
                clearTimeout(timerIdRef.current)
                timerIdRef.current = null
            }
        }
    }, [isExecuting, currentCommandIndex, flattenedCommands])

    const toggleExecution = useCallback((commands: Command[]) => {
        if (!maze) return

        if (isExecuting) {
            // 一時停止
            setIsExecuting(false)
        } else {
            // 実行開始
            const flattened = flattenCommands(commands)
            setFlattenedCommands(flattened)

            if (gameStatus === 'success' || gameStatus === 'failed') {
                // リセットして再実行
                setRobotState(initialRobotState)
                setGameStatus('idle')
                setErrorMessage('')
                setMoveCount(0)
            }

            setCurrentCommandIndex(0)
            setIsExecuting(true)
            setGameStatus('running')
        }
    }, [maze, isExecuting, gameStatus, initialRobotState])

    const reset = useCallback(() => {
        setRobotState(initialRobotState)
        setIsExecuting(false)
        setCurrentCommandIndex(-1)
        setGameStatus('idle')
        setErrorMessage('')
        setMoveCount(0)
        setFlattenedCommands([])
    }, [initialRobotState])

    const closeSuccessDialog = useCallback(() => {
        setGameStatus('idle')
    }, [])

    const closeFailedDialog = useCallback(() => {
        setGameStatus('idle')
        setErrorMessage('')
    }, [])

    return {
        maze,
        robotState,
        initialRobotState,
        isExecuting,
        currentCommandIndex,
        flattenedCommands,
        gameStatus,
        errorMessage,
        moveCount,
        setMaze,
        toggleExecution,
        reset,
        closeSuccessDialog,
        closeFailedDialog,
    }
}

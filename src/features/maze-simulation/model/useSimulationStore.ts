"use client"

import { create } from 'zustand'
import type { MazeData } from '@/src/entities/maze'

export type ResultType = 'success' | 'failure'
export type ResultReason = 'goal_success' | 'goal_missing_keys' | 'hole_fall' | 'wall_collision' | 'out_of_bounds' | 'commands_exhausted'

export interface ResultDetails {
    type: ResultType
    reason: ResultReason
    message?: string
    stepCount?: number
    remainingKeys?: number
}

export type SimulationStatus = 'idle' | 'running' | 'paused' | 'finished' | 'error'

interface SimulationState {
    /** 実行ステータス */
    status: SimulationStatus
    /** 現在実行中のコマンドパス */
    currentPath: number[]
    /** 実行速度 (ms) */
    speed: number
    /** エラーメッセージ */
    error: string | null
    /** ループカウンタ (path string -> count) */
    loopCounters: Record<string, number>
    /** 実行開始時の迷路スナップショット（復元用） */
    initialMazeData: MazeData | null
    /** 「前にすすむ」コマンド実行回数 */
    forwardStepCount: number
    /** 実行結果詳細 */
    resultDetails: ResultDetails | null

    // Actions
    setStatus: (status: SimulationStatus) => void
    setCurrentPath: (path: number[]) => void
    setSpeed: (speed: number) => void
    setError: (error: string | null) => void
    incrementLoopCounter: (pathKey: string) => void
    resetLoopCounter: (pathKey: string) => void
    resetLoopCounters: () => void
    setInitialMazeData: (maze: MazeData | null) => void
    resetSimulation: () => void
    incrementForwardStepCount: () => void
    resetForwardStepCount: () => void
    setResultDetails: (details: ResultDetails | null) => void
}

/**
 * シミュレーション状態管理ストア
 */
export const useSimulationStore = create<SimulationState>((set) => ({
    status: 'idle',
    currentPath: [],
    speed: 500, // デフォルト 500ms
    error: null,
    loopCounters: {},
    initialMazeData: null,
    forwardStepCount: 0,
    resultDetails: null,

    setStatus: (status) => set({ status }),
    setCurrentPath: (path) => set({ currentPath: path }),
    setSpeed: (speed) => set({ speed }),
    setError: (error) => set({ error }),

    incrementLoopCounter: (pathKey) => set((state) => ({
        loopCounters: {
            ...state.loopCounters,
            [pathKey]: (state.loopCounters[pathKey] || 0) + 1
        }
    })),

    resetLoopCounter: (pathKey) => set((state) => {
        const { [pathKey]: _, ...rest } = state.loopCounters
        return { loopCounters: rest }
    }),

    resetLoopCounters: () => set({ loopCounters: {} }),

    setInitialMazeData: (maze) => set({ initialMazeData: maze }),

    resetSimulation: () => set({
        status: 'idle',
        currentPath: [],
        error: null,
        loopCounters: {},
        initialMazeData: null,
        forwardStepCount: 0,
        resultDetails: null
    }),

    incrementForwardStepCount: () => set((state) => ({ forwardStepCount: state.forwardStepCount + 1 })),
    resetForwardStepCount: () => set({ forwardStepCount: 0 }),
    setResultDetails: (details) => set({ resultDetails: details })
}))


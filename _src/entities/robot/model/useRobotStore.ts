// ... (imports)
"use client"

import { create } from 'zustand'
import { 
    type RobotState, 
    type RobotAnimationState, 
    type DirectionVector,
    DEFAULT_DIRECTION 
} from './types'

interface RobotStoreState {
    /** ロボットの物理状態 */
    robotState: RobotState
    /** アニメーション状態 */
    animationState: RobotAnimationState

    /**
     * 状態をリセット（初期位置へ移動）
     * @param initialState 初期状態
     */
    reset: (initialState: RobotState) => void

    /**
     * 指定座標へ移動（ワープ的な移動、アニメーションは別途制御）
     */
    moveTo: (x: number, y: number, layer: number) => void

    /**
     * 指定方向へ回転
     */
    rotateTo: (direction: DirectionVector) => void

    /**
     * アニメーション状態を更新
     */
    setAnimationState: (state: RobotAnimationState) => void
}

/**
 * ロボット状態管理ストア
 * ロボットの位置、向き、アニメーション状態を管理する
 */
export const useRobotStore = create<RobotStoreState>((set) => ({
    // 初期値
    robotState: {
        x: 0,
        y: 0,
        layer: 0,
        direction: DEFAULT_DIRECTION,
        hasKey: false
    },
    animationState: 'idle',

    reset: (initialState) => {
        set({ 
            robotState: initialState,
            animationState: 'idle' 
        })
    },

    moveTo: (x, y, layer) => {
        set((state) => ({
            robotState: {
                ...state.robotState,
                x,
                y,
                layer
            }
        }))
    },

    rotateTo: (direction) => {
        set((state) => ({
            robotState: {
                ...state.robotState,
                direction
            }
        }))
    },

    setAnimationState: (animationState) => {
        set({ animationState })
    }
}))

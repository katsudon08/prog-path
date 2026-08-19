import { create } from 'zustand'
import type { ActionResult } from '../../model'

/**
 * トースト通知アイテム
 */
interface ToastItem extends ActionResult {
    id: string
    isExiting: boolean
}

/**
 * トースト通知ストアの状態
 */
interface ToastState {
    toasts: ToastItem[]
    addToast: (result: ActionResult) => void
    removeToast: (id: string) => void
    clearToasts: () => void
}

const TOAST_DURATION = 1500 // 表示時間
const FADE_OUT_DURATION = 300 // フェードアウト時間

/**
 * トースト通知ストア
 */
export const useToast = create<ToastState>((set) => ({
    toasts: [],

    addToast: (result) => {
        const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const toast: ToastItem = { ...result, id, isExiting: false }

        set((state) => ({
            toasts: [...state.toasts, toast]
        }))

        // フェードアウト開始
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.map((t) => 
                    t.id === id ? { ...t, isExiting: true } : t
                )
            }))
        }, TOAST_DURATION)

        // 完全に削除
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id)
            }))
        }, TOAST_DURATION + FADE_OUT_DURATION)
    },

    removeToast: (id) => {
        // まずフェードアウト状態にする
        set((state) => ({
            toasts: state.toasts.map((t) => 
                t.id === id ? { ...t, isExiting: true } : t
            )
        }))
        // フェードアウト後に削除
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id)
            }))
        }, FADE_OUT_DURATION)
    },

    clearToasts: () => {
        set({ toasts: [] })
    }
}))

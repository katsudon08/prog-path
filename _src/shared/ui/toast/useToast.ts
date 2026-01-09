import { create } from 'zustand'
import type { ActionResult } from '../../model'

/**
 * トースト通知アイテム
 */
interface ToastItem extends ActionResult {
    id: string
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

/**
 * トースト通知ストア
 */
export const useToast = create<ToastState>((set) => ({
    toasts: [],

    addToast: (result) => {
        const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const toast: ToastItem = { ...result, id }

        set((state) => ({
            toasts: [...state.toasts, toast]
        }))

        // 自動削除（5秒後）
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id)
            }))
        }, 5000)
    },

    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id)
        }))
    },

    clearToasts: () => {
        set({ toasts: [] })
    }
}))

"use client"

import { create } from 'zustand'
import type { CommandType } from '@/_src/entities/command'

/**
 * コマンドスタックの状態
 */
interface CommandStackState {
    /** コマンドスタック */
    commands: CommandType[]
    /** コマンドを追加 */
    addCommand: (type: CommandType) => void
    /** 指定位置のコマンドを削除 */
    removeCommand: (index: number) => void
    /** スタックを全消去 */
    clearCommands: () => void
}

/**
 * コマンドスタック管理用Zustandストア
 * AR実行画面でQRスキャンにより構築されるコマンドスタックを管理
 */
export const useCommandStore = create<CommandStackState>((set) => ({
    commands: [],

    addCommand: (type) => {
        set((state) => ({
            commands: [...state.commands, type]
        }))
    },

    removeCommand: (index) => {
        set((state) => ({
            commands: state.commands.filter((_, i) => i !== index)
        }))
    },

    clearCommands: () => {
        set({ commands: [] })
    }
}))

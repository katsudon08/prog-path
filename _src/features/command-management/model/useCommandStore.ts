"use client"

import { create } from 'zustand'
import type { CommandType, Command } from '@/_src/entities/command'

// ヘルパー: パスに基づいてコマンドツリーを再帰的に更新
function updateCommandsRecursive(
    commands: Command[],
    path: number[],
    updater: (target: Command[]) => Command[]
): Command[] {
    if (path.length === 0) {
        return updater(commands)
    }

    const [currentIndex, ...restPath] = path
    return commands.map((cmd, index) => {
        if (index !== currentIndex) return cmd
        
        // 子要素が存在しない場合は空配列で初期化して処理
        const children = cmd.children || []
        return {
            ...cmd,
            children: updateCommandsRecursive(children, restPath, updater)
        }
    })
}

/**
 * コマンドスタックの状態
 */
interface CommandStackState {
    /** コマンドスタック */
    commands: Command[]
    /** 現在の操作対象パス（[] = ルート） */
    activePath: number[]
    /** 操作対象パスを設定 */
    setActivePath: (path: number[]) => void
    /** 指定パスにコマンドを追加 */
    addCommand: (command: Command, parentPath: number[]) => void
    /** 指定パスのコマンドを更新 */
    updateCommand: (targetPath: number[], updates: Partial<Command>) => void
    /** 指定パスのコマンドを削除 */
    removeCommand: (targetPath: number[]) => void
    /** スタックを全消去 */
    clearCommands: () => void
}

/**
 * コマンドスタック管理用Zustandストア
 * AR実行画面でQRスキャンにより構築されるコマンドスタックを管理
 */
export const useCommandStore = create<CommandStackState>((set) => ({
    commands: [],
    activePath: [],

    setActivePath: (path) => set({ activePath: path }),

    addCommand: (command, parentPath) => {
        set((state) => ({
            commands: updateCommandsRecursive(state.commands, parentPath, (target) => [
                ...target,
                command
            ])
        }))
    },

    updateCommand: (targetPath, updates) => {
        if (targetPath.length === 0) return // ルート自体は更新できない

        const parentPath = targetPath.slice(0, -1)
        const targetIndex = targetPath[targetPath.length - 1]

        set((state) => ({
            commands: updateCommandsRecursive(state.commands, parentPath, (target) => 
                target.map((cmd, i) => 
                    i === targetIndex ? { ...cmd, ...updates } : cmd
                )
            )
        }))
    },

    removeCommand: (targetPath) => {
        if (targetPath.length === 0) return // ルート自体は削除できない

        const parentPath = targetPath.slice(0, -1)
        const targetIndex = targetPath[targetPath.length - 1]

        set((state) => ({
            commands: updateCommandsRecursive(state.commands, parentPath, (target) => 
                target.filter((_, i) => i !== targetIndex)
            )
        }))
    },

    clearCommands: () => {
        set({ commands: [], activePath: [] })
    }
}))

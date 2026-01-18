"use client"

import { create } from 'zustand'
import type { CommandType, Command } from '@/src/entities/command'

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
    /** 挿入位置インデックス（null = 末尾に追加） */
    insertIndex: number | null
    /** 折りたたまれているループのパス（キー: パス文字列） */
    collapsedLoops: Set<string>
    /** ループ構築中フラグ */
    isBuildingLoop: boolean
    /** 構築中のループのパス */
    buildingLoopPath: number[] | null
    /** 操作対象パスを設定 */
    setActivePath: (path: number[]) => void
    /** 挿入位置を設定 */
    setInsertIndex: (index: number | null) => void
    /** ループの開閉状態をトグル */
    toggleLoopCollapsed: (path: number[]) => void
    /** ループ構築を開始 */
    startLoopBuilding: (loopPath: number[]) => void
    /** ループ構築を終了 */
    endLoopBuilding: () => void
    /** 指定パスにコマンドを追加（末尾） */
    addCommand: (command: Command, parentPath: number[]) => void
    /** 指定パスの指定位置にコマンドを挿入 */
    insertCommandAt: (command: Command, parentPath: number[], index: number) => void
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
export const useCommandStore = create<CommandStackState>((set, get) => ({
    commands: [],
    activePath: [],
    insertIndex: null,
    collapsedLoops: new Set<string>(),
    isBuildingLoop: false,
    buildingLoopPath: null,

    setActivePath: (path) => set({ activePath: path }),

    setInsertIndex: (index) => set({ insertIndex: index }),

    toggleLoopCollapsed: (path) => set((state) => {
        const pathKey = path.join('-')
        const newCollapsedLoops = new Set(state.collapsedLoops)
        if (newCollapsedLoops.has(pathKey)) {
            newCollapsedLoops.delete(pathKey)
        } else {
            newCollapsedLoops.add(pathKey)
        }
        return { collapsedLoops: newCollapsedLoops }
    }),

    startLoopBuilding: (loopPath) => set({
        isBuildingLoop: true,
        buildingLoopPath: loopPath,
        activePath: loopPath,
        insertIndex: 0  // ループ内の先頭を挿入位置に
    }),

    endLoopBuilding: () => {
        const state = get()
        const commandsLength = state.commands.length
        set({
            isBuildingLoop: false,
            buildingLoopPath: null,
            activePath: [],
            insertIndex: commandsLength  // ルートレベルの末尾を挿入位置に
        })
    },

    addCommand: (command, parentPath) => {
        set((state) => ({
            commands: updateCommandsRecursive(state.commands, parentPath, (target) => [
                ...target,
                command
            ])
        }))
    },

    insertCommandAt: (command, parentPath, index) => {
        set((state) => ({
            commands: updateCommandsRecursive(state.commands, parentPath, (target) => [
                ...target.slice(0, index),
                command,
                ...target.slice(index)
            ]),
            // 挿入後は次の位置に更新（連続挿入時に次のコマンドはその後ろに追加される）
            insertIndex: index + 1
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
        set({ 
            commands: [], 
            activePath: [],
            isBuildingLoop: false,
            buildingLoopPath: null,
            insertIndex: null,
            collapsedLoops: new Set<string>()
        })
    }
}))

"use client"

import { useCallback } from 'react'
import type { CommandType, Command } from '@/_src/entities/command'
import {
    type ActionResult,
    createSuccessResult,
    createErrorResult,
    createInfoResult
} from '@/_src/shared/model'
import { useCommandStore } from './useCommandStore'

/** 有効なコマンドタイプの一覧 */
const VALID_COMMAND_TYPES: CommandType[] = [
    'forward',
    'turnRight',
    'turnLeft',
    'ifHole',
    'loop'
]

/** コマンドタイプごとの表示名 */
const COMMAND_LABELS: Record<CommandType, string> = {
    forward: '前にすすむ',
    turnRight: '右にまがる',
    turnLeft: '左にまがる',
    ifHole: '穴をうめる',
    loop: 'ループ'
}

/**
 * 文字列がCommandTypeかどうかを検証
 */
function isValidCommandType(value: string): value is CommandType {
    return VALID_COMMAND_TYPES.includes(value as CommandType)
}

/**
 * パスに基づいて対象のコマンド配列を取得するヘルパー
 */
function getTargetCommands(commands: Command[], path: number[]): Command[] {
    let current = commands
    for (const index of path) {
        if (!current[index]) return []
        current = current[index].children || []
    }
    return current
}

/**
 * コマンドスタック操作用カスタムフック
 * ActionResultを返す形式でロジックを提供
 */
export function useCommandBuilder() {
    const { 
        commands, 
        activePath,
        insertIndex,
        collapsedLoops,
        isBuildingLoop,
        buildingLoopPath,
        addCommand: storeAddCommand,
        insertCommandAt: storeInsertCommandAt,
        updateCommand: storeUpdateCommand, 
        removeCommand: storeRemoveCommand, 
        clearCommands: storeClearCommands,
        setActivePath,
        setInsertIndex,
        toggleLoopCollapsed,
        startLoopBuilding,
        endLoopBuilding
    } = useCommandStore()

    /** 最大ネスト深度 (これ以上のネストはUIやパフォーマンス面で問題が生じるため制限) */
    const MAX_NEST_DEPTH = 3

    /**
     * 現在のアクティブパスにコマンドを追加
     */
    const addCommandToActivePath = useCallback((type: CommandType): ActionResult => {
        if (!isValidCommandType(type)) {
            return createErrorResult(`無効なコマンドタイプ: ${type}`)
        }

        // ストアから最新の状態を取得（クロージャの古い値を回避）
        const currentState = useCommandStore.getState()
        const currentActivePath = currentState.activePath
        const currentInsertIndex = currentState.insertIndex
        const currentIsBuildingLoop = currentState.isBuildingLoop

        // ループ構築中に再度ループQRを読み込むと、ループを閉じる
        if (type === 'loop' && currentIsBuildingLoop) {
            endLoopBuilding()
            return createInfoResult('ループを閉じました')
        }

        // ネスト深度制限チェック
        if (currentActivePath.length >= MAX_NEST_DEPTH) {
            return createErrorResult(`これ以上のネストはできません（最大${MAX_NEST_DEPTH}階層）`)
        }

        // ループコマンドの場合は、追加後の深さもチェック（ループ内がさらに1層深くなるため）
        if (type === 'loop' && currentActivePath.length >= MAX_NEST_DEPTH - 1) {
            return createErrorResult('これ以上ループを追加できません（ネストが深すぎます）')
        }

        // 現在の階層のコマンド数を取得
        const targetCommands = getTargetCommands(currentState.commands, currentActivePath)

        // Commandオブジェクトを生成
        const newCommand = {
            type,
            loopCount: type === 'loop' ? 2 : undefined,
            children: []
        }

        // insertIndexが指定されている場合はその位置に挿入、それ以外は末尾に追加
        let newIndex: number
        if (currentInsertIndex !== null) {
            storeInsertCommandAt(newCommand, currentActivePath, currentInsertIndex)
            newIndex = currentInsertIndex
        } else {
            storeAddCommand(newCommand, currentActivePath)
            newIndex = targetCommands.length
        }

        // ループコマンドの場合はループ構築モードを開始
        if (type === 'loop') {
            const loopPath = [...currentActivePath, newIndex]
            startLoopBuilding(loopPath)
        }

        const label = COMMAND_LABELS[type]
        return createSuccessResult(`「${label}」を追加しました`)
    }, [storeAddCommand, storeInsertCommandAt, startLoopBuilding, endLoopBuilding])

    /**
     * QRコード文字列からコマンドをパースして追加
     */
    const addCommandFromQR = useCallback((qrData: string): ActionResult => {
        const trimmed = qrData.trim().toLowerCase()

        const typeMap: Record<string, CommandType> = {
            'forward': 'forward',
            'turnright': 'turnRight',
            'turnleft': 'turnLeft',
            'ifhole': 'ifHole',
            'loop': 'loop'
        }

        const commandType = typeMap[trimmed]
        if (!commandType) {
            return createErrorResult(`認識できないQRコード: ${qrData}`)
        }

        return addCommandToActivePath(commandType)
    }, [addCommandToActivePath])

    /**
     * 指定パスのループ回数を更新
     */
    const updateLoopCount = useCallback((path: number[], count: number): ActionResult => {
        // バリデーション (1-10)
        const validCount = Math.min(10, Math.max(1, count))
        storeUpdateCommand(path, { loopCount: validCount })
        return createSuccessResult(`ループ回数を${validCount}回に変更しました`)
    }, [storeUpdateCommand])

    /**
     * 指定パスのコマンドを削除
     */
    const removeCommand = useCallback((path: number[]): ActionResult => {
        // ループ構築中の場合は構築を終了
        // （ビルド中のループ自体、またはその親ループが削除される可能性があるため）
        const currentState = useCommandStore.getState()
        if (currentState.isBuildingLoop) {
            endLoopBuilding()
        }
        
        storeRemoveCommand(path)
        return createSuccessResult(`コマンドを削除しました`)
    }, [storeRemoveCommand, endLoopBuilding])

    /**
     * スタックを全消去
     */
    const clearCommands = useCallback((): ActionResult => {
        if (commands.length === 0) {
            return createSuccessResult('スタックは既に空です')
        }

        // ループ構築中なら終了
        if (isBuildingLoop) {
            endLoopBuilding()
        }

        storeClearCommands()
        return createSuccessResult('すべてのコマンドを削除しました')
    }, [commands.length, storeClearCommands, isBuildingLoop, endLoopBuilding])

    return {
        commands,
        activePath,
        insertIndex,
        collapsedLoops,
        isBuildingLoop,
        buildingLoopPath,
        setActivePath,
        setInsertIndex,
        toggleLoopCollapsed,
        endLoopBuilding,
        addCommandToActivePath,
        addCommandFromQR,
        updateLoopCount,
        removeCommand,
        clearCommands,
        COMMAND_LABELS
    }
}

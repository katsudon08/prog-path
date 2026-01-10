"use client"

import { useCallback } from 'react'
import type { CommandType } from '@/_src/entities/command'
import { 
    type ActionResult, 
    createSuccessResult, 
    createErrorResult 
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
 * コマンドスタック操作用カスタムフック
 * ActionResultを返す形式でロジックを提供
 */
export function useCommandBuilder() {
    const { commands, addCommand: storeAddCommand, removeCommand: storeRemoveCommand, clearCommands: storeClearCommands } = useCommandStore()

    /**
     * コマンドをスタックに追加
     */
    const addCommand = useCallback((type: CommandType): ActionResult => {
        if (!isValidCommandType(type)) {
            return createErrorResult(`無効なコマンドタイプ: ${type}`)
        }

        storeAddCommand(type)
        const label = COMMAND_LABELS[type]
        return createSuccessResult(`${label}コマンドを追加しました`)
    }, [storeAddCommand])

    /**
     * QRコード文字列からコマンドをパースして追加
     */
    const addCommandFromQR = useCallback((qrData: string): ActionResult => {
        const trimmed = qrData.trim().toLowerCase()
        
        // QRデータをCommandTypeに変換
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

        return addCommand(commandType)
    }, [addCommand])

    /**
     * 指定位置のコマンドを削除
     */
    const removeCommand = useCallback((index: number): ActionResult => {
        if (index < 0 || index >= commands.length) {
            return createErrorResult(`無効なインデックス: ${index}`)
        }

        const removedType = commands[index]
        const label = COMMAND_LABELS[removedType]
        storeRemoveCommand(index)
        return createSuccessResult(`${label}コマンドを削除しました`)
    }, [commands, storeRemoveCommand])

    /**
     * スタックを全消去
     */
    const clearCommands = useCallback((): ActionResult => {
        if (commands.length === 0) {
            return createSuccessResult('スタックは既に空です')
        }

        storeClearCommands()
        return createSuccessResult('すべてのコマンドを削除しました')
    }, [commands.length, storeClearCommands])

    return {
        commands,
        addCommand,
        addCommandFromQR,
        removeCommand,
        clearCommands,
        COMMAND_LABELS
    }
}

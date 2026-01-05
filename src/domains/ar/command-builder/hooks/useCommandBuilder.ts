/**
 * コマンドスタック構築用カスタムフック
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type { Command } from "@/src/domains/ar/robot-3d/types"
import type { InsertionPoint, UseCommandBuilderReturn } from "../types"

/**
 * コマンドスタック構築用カスタムフック
 */
export function useCommandBuilder(): UseCommandBuilderReturn {
    const [commands, setCommands] = useState<Command[]>([])
    const [insertionPoint, setInsertionPoint] = useState<InsertionPoint>({
        parentIndex: null,
        childIndex: 0,
    })
    const [isBuildingLoop, setIsBuildingLoop] = useState(false)
    const [buildingLoopIndex, setBuildingLoopIndex] = useState<number | null>(null)
    const [tempLoopCommand, setTempLoopCommand] = useState<Command | null>(null)
    const [loopInputString, setLoopInputString] = useState<string>("2")
    const [loopPopupOpen, setLoopPopupOpen] = useState(false)

    // 安定したコールバック用のRef
    const isBuildingLoopRef = useRef(isBuildingLoop)
    const buildingLoopIndexRef = useRef<number | null>(null)

    useEffect(() => {
        isBuildingLoopRef.current = isBuildingLoop
    }, [isBuildingLoop])

    useEffect(() => {
        buildingLoopIndexRef.current = buildingLoopIndex
    }, [buildingLoopIndex])

    const addCommand = useCallback((newCommand: Command) => {
        setCommands((prevCommands) => {
            const newCommands = [...prevCommands]

            if (insertionPoint.parentIndex === null) {
                // ルートレベルへの挿入
                newCommands.splice(insertionPoint.childIndex, 0, newCommand)
            } else {
                // ループ内への挿入
                const parentCommand = newCommands[insertionPoint.parentIndex]
                if (parentCommand && parentCommand.children) {
                    const children = [...parentCommand.children]
                    children.splice(insertionPoint.childIndex, 0, newCommand)
                    newCommands[insertionPoint.parentIndex] = { ...parentCommand, children }
                }
            }

            return newCommands
        })

        // 挿入位置を次の位置に進める
        setInsertionPoint(prev => ({
            ...prev,
            childIndex: prev.childIndex + 1,
        }))
    }, [insertionPoint])

    const removeCommand = useCallback((index: number) => {
        setCommands((prevCommands) => {
            const newCommands = [...prevCommands]
            newCommands.splice(index, 1)
            return newCommands
        })
    }, [])

    const removeChildCommand = useCallback((parentIndex: number, childIndex: number) => {
        setCommands((prevCommands) => {
            const newCommands = [...prevCommands]
            const parent = newCommands[parentIndex]
            if (parent && parent.children) {
                const children = [...parent.children]
                children.splice(childIndex, 1)
                newCommands[parentIndex] = { ...parent, children }
            }
            return newCommands
        })
    }, [])

    const updateCommand = useCallback((index: number, command: Command) => {
        setCommands((prevCommands) => {
            const newCommands = [...prevCommands]
            newCommands[index] = command
            return newCommands
        })
    }, [])

    const startLoopBuilding = useCallback((command: Command) => {
        const initialCommand = {
            ...command,
            loopCount: command.loopCount || 2,
            children: [],
        }
        setTempLoopCommand(initialCommand)
        setLoopInputString(String(initialCommand.loopCount))
        setLoopPopupOpen(true)
    }, [])

    const confirmLoopBuilding = useCallback(() => {
        let count = Number.parseInt(loopInputString)

        if (isNaN(count) || count < 1) {
            count = 1
        } else if (count > 10) {
            count = 10
        }

        if (tempLoopCommand) {
            const updatedCommand = { ...tempLoopCommand, loopCount: count }
            setTempLoopCommand(updatedCommand)

            // loop コマンドを即座に追加
            setCommands(prev => {
                const newCommands = [...prev, updatedCommand]
                return newCommands
            })

            const loopIndex = commands.length // 追加されるloopのインデックス
            setBuildingLoopIndex(loopIndex)
            setIsBuildingLoop(true)

            // insertionPointをloop内の先頭に設定
            setInsertionPoint({
                parentIndex: loopIndex,
                childIndex: 0,
            })
        }
        setLoopPopupOpen(false)
    }, [loopInputString, tempLoopCommand, commands.length])

    const closeLoopPopup = useCallback(() => {
        setLoopPopupOpen(false)
        setTempLoopCommand(null)
    }, [])

    const endLoopBuilding = useCallback(() => {
        setIsBuildingLoop(false)
        setTempLoopCommand(null)
        setBuildingLoopIndex(null)

        // insertionPointをルートレベルに戻す
        setInsertionPoint({
            parentIndex: null,
            childIndex: commands.length,
        })
    }, [commands.length])

    const addChildToLoop = useCallback((command: Command) => {
        const loopIndex = buildingLoopIndexRef.current

        if (loopIndex !== null) {
            setCommands((prevCommands) => {
                const newCommands = [...prevCommands]
                if (newCommands[loopIndex]) {
                    const children = newCommands[loopIndex].children || []
                    newCommands[loopIndex] = {
                        ...newCommands[loopIndex],
                        children: [...children, command],
                    }
                }
                return newCommands
            })

            // 挿入位置を次に進める
            setInsertionPoint(prev => ({
                ...prev,
                childIndex: prev.childIndex + 1,
            }))
        }
    }, [])

    const resetCommands = useCallback(() => {
        setCommands([])
        setInsertionPoint({ parentIndex: null, childIndex: 0 })
        setIsBuildingLoop(false)
        setBuildingLoopIndex(null)
        setTempLoopCommand(null)
    }, [])

    return {
        commands,
        insertionPoint,
        isBuildingLoop,
        buildingLoopIndex,
        tempLoopCommand,
        loopInputString,
        loopPopupOpen,
        addCommand,
        removeCommand,
        removeChildCommand,
        updateCommand,
        setInsertionPoint,
        startLoopBuilding,
        confirmLoopBuilding,
        setLoopInputString,
        closeLoopPopup,
        endLoopBuilding,
        resetCommands,
        addChildToLoop,
        isBuildingLoopRef,
        buildingLoopIndexRef,
    }
}

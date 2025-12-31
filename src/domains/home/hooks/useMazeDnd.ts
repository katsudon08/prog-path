"use client"

import { useState, useCallback } from "react"
import type { MazeData } from "@/src/domains/maze/maze-data/lib/types"
import { saveMazes } from "@shared/lib"

interface UseMazeDndProps {
    mazes: MazeData[]
    setMazes: (mazes: MazeData[]) => void
    addToExpanded: (category: string) => void
}

/**
 * 迷路ドラッグ&ドロップ操作フック
 */
export function useMazeDnd({
    mazes,
    setMazes,
    addToExpanded,
}: UseMazeDndProps) {
    const [draggedMazeId, setDraggedMazeId] = useState<string | null>(null)
    const [dragOverCategory, setDragOverCategory] = useState<string | null>(null)

    // ドラッグ開始
    const dragStart = useCallback((mazeId: string) => {
        setDraggedMazeId(mazeId)
    }, [])

    // ドラッグオーバー
    const dragOver = useCallback((e: React.DragEvent, category: string) => {
        e.preventDefault()
        setDragOverCategory(category)
    }, [])

    // ドラッグ離脱
    const dragLeave = useCallback(() => {
        setDragOverCategory(null)
    }, [])

    // ドロップ
    const drop = useCallback((category: string) => {
        if (!draggedMazeId) return

        const updatedMazes = mazes.map(m =>
            m.id === draggedMazeId
                ? { ...m, category: category === "未分類" ? undefined : category }
                : m
        )
        setMazes(updatedMazes)
        saveMazes(updatedMazes)
        addToExpanded(category)

        setDraggedMazeId(null)
        setDragOverCategory(null)
    }, [draggedMazeId, mazes, setMazes, addToExpanded])

    return {
        draggedMazeId,
        dragOverCategory,
        dragStart,
        dragOver,
        dragLeave,
        drop,
    }
}

"use client"

import { useState } from "react"
import type { MazeData } from "@/src/entities/maze"
import { moveMazeToCategory } from "./dnd-operations"

interface UseMazeDndProps {
    mazes: MazeData[]
    setMazes: (mazes: MazeData[]) => void
    addToExpanded: (category: string) => void
}

/**
 * 迷路のD&D操作を担当するフック
 * FSD: features層 - 再利用可能なD&D機能
 */
export function useMazeDnd({
    mazes,
    setMazes,
    addToExpanded,
}: UseMazeDndProps) {
    const [draggedMazeId, setDraggedMazeId] = useState<string | null>(null)

    const dragStart = (e: React.DragEvent, mazeId: string) => {
        e.dataTransfer.setData("text/plain", mazeId)
        setDraggedMazeId(mazeId)
    }

    const dragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.currentTarget.classList.add("bg-neon-blue/20")
    }

    const dragLeave = (e: React.DragEvent) => {
        e.currentTarget.classList.remove("bg-neon-blue/20")
    }

    const drop = (e: React.DragEvent, targetCategory: string) => {
        e.preventDefault()
        e.currentTarget.classList.remove("bg-neon-blue/20")
        if (!draggedMazeId) return
        const updated = moveMazeToCategory(mazes, draggedMazeId, targetCategory)
        setMazes(updated)
        setDraggedMazeId(null)
        addToExpanded(targetCategory)
    }

    return {
        dragStart,
        dragOver,
        dragLeave,
        drop,
    }
}

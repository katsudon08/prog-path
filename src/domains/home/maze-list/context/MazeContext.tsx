"use client"

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import type { MazeData } from "@/src/entities/maze"
import { loadMazes, saveMazes } from "@shared/lib"

interface MazeContextType {
    mazes: MazeData[]
    setMazes: (mazes: MazeData[] | ((prev: MazeData[]) => MazeData[])) => void
    selectedMaze: MazeData | null
    selectMaze: (maze: MazeData | null) => void
    deleteMaze: (id: string) => void
    isLoaded: boolean
}

const MazeContext = createContext<MazeContextType | null>(null)

export function useMazeContext() {
    const context = useContext(MazeContext)
    if (!context) {
        throw new Error("useMazeContext must be used within MazeProvider")
    }
    return context
}

interface MazeProviderProps {
    children: ReactNode
}

/**
 * 迷路データを共有するContext Provider
 */
export function MazeProvider({ children }: MazeProviderProps) {
    const [mazes, setMazesState] = useState<MazeData[]>([])
    const [selectedMaze, setSelectedMaze] = useState<MazeData | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)
    const isFirstSave = useRef(true)

    // クライアントサイドでのみデータを読み込み
    useEffect(() => {
        const loaded = loadMazes()
        setMazesState(loaded)
        if (loaded.length > 0) {
            setSelectedMaze(loaded[0])
        }
        setIsLoaded(true)
    }, [])

    // mazesが変更されたときに自動保存
    useEffect(() => {
        if (!isLoaded) return
        if (isFirstSave.current) {
            isFirstSave.current = false
            return
        }
        saveMazes(mazes)
    }, [mazes, isLoaded])

    const setMazes = (update: MazeData[] | ((prev: MazeData[]) => MazeData[])) => {
        if (typeof update === "function") {
            setMazesState(update)
        } else {
            setMazesState(update)
        }
    }

    const selectMaze = (maze: MazeData | null) => setSelectedMaze(maze)

    const deleteMaze = (id: string) => {
        const updated = mazes.filter(m => m.id !== id)
        setMazesState(updated)
        if (selectedMaze?.id === id) {
            setSelectedMaze(updated.length > 0 ? updated[0] : null)
        }
    }

    return (
        <MazeContext.Provider value={{
            mazes,
            setMazes,
            selectedMaze,
            selectMaze,
            deleteMaze,
            isLoaded,
        }}>
            {children}
        </MazeContext.Provider>
    )
}

"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import type { MazeData } from "@/src/entities/maze"
import { loadCategories, saveCategories } from "@/src/features/maze-storage"

/**
 * カテゴリ管理を担当するフック
 * FSD: features層 - カテゴリ状態管理
 */
export function useCategoryState(mazes: MazeData[]) {
    const [customCategories, setCustomCategories] = useState<string[]>([])
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
    const [isCategoryLoaded, setIsCategoryLoaded] = useState(false)
    const isFirstCategorySave = useRef(true)
    const hasSyncedWithMazes = useRef(false)

    // カテゴリ初期読み込み
    useEffect(() => {
        const categories = loadCategories()
        setCustomCategories(categories)
        setExpandedCategories(new Set(categories))
        setIsCategoryLoaded(true)
    }, [])

    // カテゴリ保存
    useEffect(() => {
        if (!isCategoryLoaded) return
        if (isFirstCategorySave.current) {
            isFirstCategorySave.current = false
            return
        }
        saveCategories(customCategories)
    }, [customCategories, isCategoryLoaded])

    // mazesからカテゴリを展開
    useEffect(() => {
        if (!isCategoryLoaded || hasSyncedWithMazes.current || mazes.length === 0) return
        hasSyncedWithMazes.current = true
        setExpandedCategories(prev => {
            const next = new Set(prev)
            mazes.forEach(m => next.add(m.category || "未分類"))
            return next
        })
    }, [mazes, isCategoryLoaded])

    // グループ化
    const groupedMazes = useMemo(() => {
        return mazes.reduce((acc, maze) => {
            const category = maze.category || "未分類"
            if (!acc[category]) acc[category] = []
            acc[category].push(maze)
            return acc
        }, customCategories.reduce((acc, cat) => {
            acc[cat] = acc[cat] || []
            return acc
        }, {} as Record<string, MazeData[]>))
    }, [mazes, customCategories])

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev)
            if (next.has(category)) next.delete(category)
            else next.add(category)
            return next
        })
    }

    const addToExpanded = (category: string) => {
        setExpandedCategories(prev => new Set(prev).add(category))
    }

    const removeFromExpanded = (category: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev)
            next.delete(category)
            return next
        })
    }

    return {
        customCategories,
        setCustomCategories,
        expandedCategories,
        groupedMazes,
        toggleCategory,
        addToExpanded,
        removeFromExpanded,
    }
}

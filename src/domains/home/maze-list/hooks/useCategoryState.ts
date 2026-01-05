"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import type { MazeData } from "@/src/domains/maze/maze-data/lib/types"

const STORAGE_KEY_CATEGORIES = "progpath_categories"
const STORAGE_KEY_EXPANDED = "progpath_expanded"

/**
 * カテゴリ状態管理フック
 * 迷路のグルーピングと展開状態を管理
 */
export function useCategoryState(mazes: MazeData[]) {
    // SSR/クライアント初回レンダリングで一致させるため、初期値は空
    const [customCategories, setCustomCategories] = useState<string[]>([])
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set<string>())

    // クライアントサイドでマウント後にlocalStorageから読み込む
    useEffect(() => {
        const storedCategories = localStorage.getItem(STORAGE_KEY_CATEGORIES)
        if (storedCategories) {
            setCustomCategories(JSON.parse(storedCategories))
        }
        const storedExpanded = localStorage.getItem(STORAGE_KEY_EXPANDED)
        if (storedExpanded) {
            setExpandedCategories(new Set(JSON.parse(storedExpanded)))
        }
    }, [])

    // カテゴリごとに迷路をグループ化
    const groupedMazes = useMemo(() => {
        const groups: Record<string, MazeData[]> = {}
        
        // カスタムカテゴリを初期化
        for (const category of customCategories) {
            groups[category] = []
        }
        
        // 迷路を振り分け
        for (const maze of mazes) {
            const category = maze.category || "未分類"
            if (!groups[category]) {
                groups[category] = []
            }
            groups[category].push(maze)
        }
        
        return groups
    }, [mazes, customCategories])

    // カテゴリの展開/折りたたみ切り替え
    const toggleCategory = useCallback((category: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev)
            if (next.has(category)) {
                next.delete(category)
            } else {
                next.add(category)
            }
            localStorage.setItem(STORAGE_KEY_EXPANDED, JSON.stringify([...next]))
            return next
        })
    }, [])

    // 展開カテゴリに追加
    const addToExpanded = useCallback((category: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev)
            next.add(category)
            localStorage.setItem(STORAGE_KEY_EXPANDED, JSON.stringify([...next]))
            return next
        })
    }, [])

    // 展開カテゴリから削除
    const removeFromExpanded = useCallback((category: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev)
            next.delete(category)
            localStorage.setItem(STORAGE_KEY_EXPANDED, JSON.stringify([...next]))
            return next
        })
    }, [])

    return {
        groupedMazes,
        customCategories,
        setCustomCategories,
        expandedCategories,
        toggleCategory,
        addToExpanded,
        removeFromExpanded,
    }
}

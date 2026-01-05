"use client"

import { useRouter } from "next/navigation"

/**
 * メインコンテンツのロジックフック
 * - 迷路作成画面へ遷移
 */
export function useMainContent() {
    const router = useRouter()

    // 迷路作成画面へ遷移
    const createNew = () => router.push("/editor")

    return {
        createNew,
    }
}

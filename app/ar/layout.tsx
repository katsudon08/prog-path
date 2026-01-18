"use client"

import type React from "react"

/**
 * AR画面専用レイアウト
 * グローバルNavbarを表示しない
 */
export default function ARLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}

"use client"

import { Suspense } from "react"
import { ARPage } from "@/_src/pages/ar"

export default function ARPageWrapper() {
    return (
        <Suspense
            fallback={
                <div className="flex h-screen items-center justify-center bg-space-darker">
                    <p className="text-neon-cyan">迷路を読み込んでいます...</p>
                </div>
            }
        >
            <ARPage />
        </Suspense>
    )
}

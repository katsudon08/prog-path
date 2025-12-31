"use client"

import { Suspense } from "react"
import { ARExecutionWidget } from "@domains/ar"

export default function ARPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-background pt-16">
                    <p className="text-neon-cyan">迷路を読み込んでいます...</p>
                </div>
            }
        >
            <ARExecutionWidget />
        </Suspense>
    )
}

"use client"

import { Suspense } from "react"
import { EditorPage } from "@/src/pages/editor"

export default function EditorPageWrapper() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-background pt-16">
                    <p className="text-neon-cyan">迷路を読み込んでいます...</p>
                </div>
            }
        >
            <EditorPage />
        </Suspense>
    )
}

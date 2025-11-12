"use client";

import { Suspense } from "react";
import { ARExecutionScreen } from "@/components/ar-execution-screen";

export default function ARPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-background pt-16">
                    <p className="text-neon-cyan">迷路を読み込んでいます...</p>
                </div>
            }
        >
            <ARExecutionScreen />
        </Suspense>
    );
}

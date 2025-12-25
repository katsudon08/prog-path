"use client"

import { Button } from "@shared/ui"
import { Card } from "@shared/ui"
import { Download, ArrowLeft, Zap, Shield, Lightbulb } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import {
    fetchLatestRelease,
    isElectronApp,
    startDownload,
    type ReleaseInfo,
} from "@features/app-download"

const features = [
    {
        icon: Zap,
        title: "高速動作",
        description: "Webアプリより高速でレスポンシブ",
    },
    {
        icon: Shield,
        title: "安定性",
        description: "より安定した環境でご利用可能",
    },
    {
        icon: Lightbulb,
        title: "フル機能",
        description: "すべての機能を活用できます",
    },
]

/**
 * ダウンロードページWidget
 */
export function DownloadWidget() {
    const [isElectron, setIsElectron] = useState<boolean | null>(null)
    const [releaseInfo, setReleaseInfo] = useState<ReleaseInfo | null>(null)

    useEffect(() => {
        setIsElectron(isElectronApp())

        fetchLatestRelease().then(setReleaseInfo)
    }, [])

    const handleDownload = () => {
        if (isElectron || !releaseInfo) return
        startDownload(releaseInfo.downloadUrl)
    }

    return (
        <div className="fixed inset-0 top-16 bg-background overflow-y-auto">
            <div className="container mx-auto px-4 py-8 min-h-full flex flex-col">
                {/* Header */}
                <div className="mb-12 flex items-center gap-4">
                    <Link
                        href="/"
                        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-neon-blue/10 hover:text-neon-cyan"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <div>
                        <h1 className="text-4xl font-bold text-neon-cyan mb-2">
                            ProgPath デスクトップ版
                        </h1>
                        <p className="text-muted-foreground">
                            より快適な体験のために、デスクトップ版をダウンロード
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
                    {/* Left: Features */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {features.map((feature, index) => {
                                const Icon = feature.icon
                                return (
                                    <Card
                                        key={index}
                                        className="border-neon-blue/30 bg-space-dark/50 p-6 hover:border-neon-cyan/50 transition-colors"
                                    >
                                        <Icon className="h-8 w-8 text-neon-cyan mb-3" />
                                        <h3 className="font-semibold text-foreground mb-2">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {feature.description}
                                        </p>
                                    </Card>
                                )
                            })}
                        </div>

                        {/* Version Info */}
                        <Card className="border-neon-blue/30 bg-space-dark/50 p-6">
                            <h3 className="text-lg font-semibold text-neon-cyan mb-4">
                                バージョン情報
                            </h3>
                            <div className="space-y-3 text-sm text-muted-foreground">
                                <div className="flex justify-between">
                                    <span>バージョン:</span>
                                    <span className="text-neon-cyan">
                                        {releaseInfo?.version ?? "読み込み中..."}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>ファイルサイズ:</span>
                                    <span className="text-neon-cyan">
                                        {releaseInfo?.fileSize ?? "読み込み中..."}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>対応OS:</span>
                                    <span className="text-neon-cyan">
                                        Windows 10 以上
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right: Download Card */}
                    <div className="lg:col-span-1">
                        <Card className="border-neon-cyan/50 bg-space-dark/50 p-8 sticky top-24 h-fit">
                            <div className="text-center mb-6">
                                <Download className="h-12 w-12 text-neon-cyan mx-auto mb-3" />
                                <h2 className="text-2xl font-bold text-neon-cyan">
                                    今すぐ
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    ダウンロード開始
                                </p>
                            </div>

                            {isElectron === null ? (
                                <div className="w-full rounded bg-neon-blue/10 px-4 py-3 text-center text-muted-foreground text-sm">
                                    読み込み中...
                                </div>
                            ) : !isElectron ? (
                                <>
                                    <Button
                                        onClick={handleDownload}
                                        className="w-full bg-neon-green text-space-dark hover:bg-neon-green/70 mb-3 font-semibold"
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        ダウンロード
                                    </Button>
                                    <p className="text-xs text-muted-foreground text-center">
                                        prog-path Setup {releaseInfo?.version ?? "0.1.0"}.exe
                                    </p>
                                </>
                            ) : (
                                <div className="w-full rounded-lg bg-neon-blue/10 px-4 py-4 text-center border border-neon-blue/30">
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Webアプリからのダウンロードのみサポートされています
                                    </p>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

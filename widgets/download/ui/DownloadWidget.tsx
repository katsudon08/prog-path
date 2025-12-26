"use client"

import { Button } from "@shared/ui"
import { Download, ArrowLeft, Zap, Shield, Lightbulb, Monitor } from "lucide-react"
import { useEffect, useState } from "react"
import {
    fetchLatestRelease,
    isElectronApp,
    startDownload,
    type ReleaseInfo,
} from "@features/app-download"

/**
 * ダウンロードページWidget
 * Notion/Slack/Discord風のシンプルな中央配置レイアウト
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
            <div className="min-h-full flex flex-col">
                {/* 戻るボタン */}
                <div className="container mx-auto px-4 pt-6">
                    <Button
                        onClick={() => window.location.href = "/"}
                        variant="outline"
                        className="border-neon-blue text-neon-blue"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        戻る
                    </Button>
                </div>

                {/* メインコンテンツ - 中央配置 */}
                <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
                    {/* ヒーローセクション */}
                    <div className="text-center max-w-2xl mx-auto mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-blue/20 border border-neon-cyan/30 mb-6">
                            <Monitor className="w-10 h-10 text-neon-cyan" />
                        </div>
                        
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                            <span className="text-neon-cyan">ProgPath</span> デスクトップ版
                        </h1>
                        
                        <p className="text-lg text-muted-foreground">
                            迷路を作って、ARでプログラミングを学ぼう。
                        </p>
                    </div>

                    {/* ダウンロードセクション */}
                    <div className="w-full max-w-md mx-auto mb-12">
                        {isElectron === null ? (
                            <div className="w-full rounded-xl bg-neon-blue/10 px-6 py-4 text-center text-muted-foreground border border-neon-blue/20">
                                読み込み中...
                            </div>
                        ) : !isElectron ? (
                            <div className="space-y-4">
                                <Button
                                    onClick={handleDownload}
                                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-neon-green to-neon-cyan text-space-dark hover:opacity-90 transition-all duration-200 hover:scale-[1.05] shadow-lg shadow-neon-green/20"
                                >
                                    <Download className="mr-3 h-5 w-5" />
                                    Windows版をダウンロード
                                </Button>
                                
                                {/* バージョン情報 - 1行で簡潔に */}
                                <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                                    <span>v{releaseInfo?.version ?? "..."}</span>
                                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                    <span>{releaseInfo?.fileSize ?? "..."}</span>
                                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                    <span>Windows 10+</span>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full rounded-xl bg-neon-blue/10 px-6 py-5 text-center border border-neon-blue/20">
                                <p className="text-muted-foreground">
                                    Webアプリからのダウンロードのみサポートされています
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

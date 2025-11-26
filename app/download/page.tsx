"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DownloadPage() {
    const [isElectron, setIsElectron] = useState(false);

    useEffect(() => {
        // Electronアプリかどうかを判定
        setIsElectron(
            typeof window !== "undefined" && !!(window as any).electron
        );
    }, []);

    const handleDownload = async () => {
        if (isElectron && (window as any).electron) {
            // Electronアプリの場合、メインプロセスに処理を委譲
            try {
                await (window as any).electron.downloadApp();
            } catch (err) {
                console.error("ダウンロードエラー:", err);
            }
        }
    };

    return (
        <div className="min-h-screen bg-background pt-24 pb-12 px-4">
            <div className="container mx-auto max-w-2xl">
                {/* Back Button */}
                <Link
                    href="/"
                    className="mb-8 inline-flex items-center gap-2 text-neon-cyan hover:text-neon-cyan/80 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    戻る
                </Link>

                {/* Main Content */}
                <Card className="border-neon-blue/30 bg-space-dark/50 p-8">
                    <div className="text-center">
                        <h1 className="mb-4 text-3xl font-bold text-neon-cyan">
                            ProgPath デスクトップ版
                        </h1>
                        <p className="mb-8 text-lg text-muted-foreground">
                            デスクトップアプリケーションでより快適に ProgPath
                            をご利用いただけます。
                        </p>

                        <div className="mb-8 rounded-lg border border-neon-blue/30 bg-space-blue/20 p-6">
                            <p className="text-foreground mb-4">
                                以下のボタンからデスクトップ版アプリケーションをダウンロードしてください。
                            </p>
                            <ul className="text-left text-muted-foreground space-y-2">
                                <li>✓ AR機能による迷路実行</li>
                                <li>✓ リアルタイムロボット制御</li>
                                <li>✓ オフライン対応</li>
                            </ul>
                        </div>

                        {isElectron ? (
                            <Button
                                onClick={handleDownload}
                                size="lg"
                                className="bg-neon-green text-space-dark hover:bg-neon-cyan/90"
                            >
                                <Download className="mr-2 h-5 w-5" />
                                ダウンロード
                            </Button>
                        ) : (
                            <div className="rounded-lg bg-neon-blue/10 p-6 border border-neon-blue/30">
                                <p className="text-neon-blue">
                                    このページはデスクトップアプリケーション内からのみアクセスできます。
                                </p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* System Requirements */}
                <Card className="mt-8 border-neon-blue/30 bg-space-dark/50 p-6">
                    <h2 className="mb-4 text-xl font-semibold text-neon-blue">
                        システム要件
                    </h2>
                    <ul className="space-y-2 text-muted-foreground">
                        <li>OS: Windows 7 以上</li>
                        <li>メモリ: 4GB 以上推奨</li>
                        <li>ストレージ: 500MB 以上の空き容量</li>
                    </ul>
                </Card>
            </div>
        </div>
    );
}

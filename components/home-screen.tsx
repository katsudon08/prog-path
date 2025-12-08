"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Play, ChevronRight, QrCode, Upload, X, AlertTriangle } from "lucide-react";
import { MazePreview } from "@/components/maze-preview";
import { useRouter } from "next/navigation";
import type { MazeData } from "@/lib/types";
import { getInitialMazes } from "@/lib/initial-mazes";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { encodeMazeToQR, decodeMazeFromQR, isMazeQRCode } from "@/lib/maze-encoder";
import jsQR from "jsqr";

export function HomeScreen() {
    const [mazes, setMazes] = useState<MazeData[]>([]);
    const [selectedMaze, setSelectedMaze] = useState<MazeData | null>(null);
    const router = useRouter();
    const [showQRDialog, setShowQRDialog] = useState(false);
    const [qrData, setQRData] = useState("");
    
    // QR読み込み用のstate
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [isStreamReady, setIsStreamReady] = useState(false);
    const [cameraError, setCameraError] = useState<string>("");
    const videoElementRef = useRef<HTMLVideoElement | null>(null);
    const scanCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const scanIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        // --- 修正箇所：localStorage が空配列の場合も初期化 ---
        const stored = localStorage.getItem("progpath_mazes");
        let loadedMazes: MazeData[] = [];

        if (stored) {
            try {
                loadedMazes = JSON.parse(stored);
            } catch (e) {
                console.error("Failed to parse mazes from localStorage", e);
                loadedMazes = []; // パース失敗時も初期化
            }
        }

        if (loadedMazes.length > 0) {
            // 既存データがある場合
            setMazes(loadedMazes);
            setSelectedMaze(loadedMazes[0]);
        } else {
            // localStorage がない、または空配列の場合
            const initialMazes = getInitialMazes();
            setMazes(initialMazes);
            localStorage.setItem(
                "progpath_mazes",
                JSON.stringify(initialMazes)
            );
            if (initialMazes.length > 0) {
                setSelectedMaze(initialMazes[0]);
            }
        }
        // --- 修正終了 ---
    }, []);

    const handleCreateNew = () => {
        router.push("/editor");
    };

    const handleEditMaze = (id: string) => {
        router.push(`/editor?id=${id}`);
    };

    const handleRunAR = (id: string) => {
        router.push(`/ar?id=${id}`);
    };

    const handleImportMaze = () => {
        setShowImportDialog(true);
    };
    const handleShareMaze = (maze: MazeData) => {
        try {
            const encoded = encodeMazeToQR(maze);
            setQRData(encoded);
            setShowQRDialog(true);
        } catch (error) {
            alert("QRコードの生成に失敗しました");
        }
    };

    // カメラ起動ロジック
    useEffect(() => {
        if (!showImportDialog) {
            return; // ダイアログが閉じている場合は何もしない
        }

        let stream: MediaStream | null = null;

        // ダイアログがマウントされるのを待つ
        const timer = setTimeout(() => {
            const video = videoElementRef.current;
            if (!video) {
                console.warn("Video element not found");
                return;
            }

            const startWebcam = async () => {
                try {
                    console.log("📹 Starting webcam...");
                    stream = await navigator.mediaDevices.getUserMedia({
                        audio: false,
                        video: {
                            facingMode: "environment",
                            width: { ideal: 640 },
                            height: { ideal: 480 },
                        },
                    });
                    video.srcObject = stream;
                    console.log("✅ Webcam stream attached.");

                    video.onloadedmetadata = () => {
                        console.log("✅ Video metadata loaded.");
                        video
                            .play()
                            .then(() => {
                                console.log("✅ Video playback started.");
                            })
                            .catch((err) => {
                                console.error("❌ Video play failed:", err);
                            });
                    };

                    video.onplaying = () => {
                        console.log("✅ Video stream is now playing.");
                        if (video.readyState >= 2) {
                            setIsStreamReady(true);
                        }
                    };

                    video.oncanplay = () => {
                        console.log("✅ Video can play (readyState >= 2).");
                        setIsStreamReady(true);
                    };
                } catch (err) {
                    console.error("❌ Failed to get webcam stream:", err);
                    const errorMessage =
                        err instanceof Error ? err.message : String(err);
                    alert(`カメラの起動に失敗: ${errorMessage}`);
                }
            };

            startWebcam();
        }, 100); // 100ms待ってからカメラ起動

        return () => {
            clearTimeout(timer);
            
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
                console.log("🛑 Webcam stream stopped.");
            }
            const video = videoElementRef.current;
            if (video && video.srcObject) {
                video.srcObject = null;
                video.onplaying = null;
                video.oncanplay = null;
            }
            setIsStreamReady(false);
        };
    }, [showImportDialog]);

    // QRコードスキャンロジック
    useEffect(() => {
        if (!isStreamReady || !videoElementRef.current || !scanCanvasRef.current) {
            return;
        }

        const video = videoElementRef.current;
        const canvas = scanCanvasRef.current;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            console.error("Failed to get 2D context for scanning");
            return;
        }

        console.log("🚀 Starting QR scanner loop...");

        const scanLoop = () => {
            scanIntervalRef.current = window.setTimeout(scanLoop, 300);

            if (video.readyState < 2) {
                return;
            }

            try {
                const videoWidth = video.videoWidth;
                const videoHeight = video.videoHeight;

                if (videoWidth === 0 || videoHeight === 0) {
                    return;
                }

                canvas.width = videoWidth;
                canvas.height = videoHeight;

                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });

                if (code && code.data) {
                    const qrCodeData = code.data;
                    console.log("🔍 QR Code detected:", qrCodeData);
                    
                    // 迷路QRコードのチェック
                    if (isMazeQRCode(qrCodeData)) {
                        console.log("✅ Valid maze QR code");
                        const decodedMaze = decodeMazeFromQR(qrCodeData);
                        if (decodedMaze) {
                            console.log("✅ Maze decoded:", decodedMaze.name);
                            // 既存の迷路と重複チェック
                            if (!mazes.find(m => m.id === decodedMaze.id)) {
                                const newMazes = [...mazes, decodedMaze];
                                setMazes(newMazes);
                                localStorage.setItem("progpath_mazes", JSON.stringify(newMazes));
                                console.log("✅ 迷路をインポート:", decodedMaze.name);
                                alert(`迷路「${decodedMaze.name}」を読み込みました！`);
                            } else {
                                alert("この迷路は既に読み込まれています");
                            }
                            setShowImportDialog(false);
                        } else {
                            console.warn("❌ Failed to decode maze");
                        }
                    } else {
                        console.log("ℹ️ Not a maze QR code:", qrCodeData);
                    }
                }
            } catch (err) {
                console.error("Error drawing video to canvas:", err);
            }
        };

        scanLoop();

        return () => {
            console.log("🛑 Stopping QR scanner loop...");
            if (scanIntervalRef.current) {
                clearTimeout(scanIntervalRef.current);
            }
        };
    }, [isStreamReady, mazes]);

    return (
        <div className="fixed inset-0 top-16 bg-background">
            <div className="flex h-full">
                {/* Left Sidebar - Maze List */}
                <div className="flex flex-col w-80 border-r border-neon-blue/30">
                    {/* Fixed Header */}
                    <div className="sticky top-0 bg-space-dark">
                        <div className="p-6 border-b border-neon-blue/30">
                            <h2 className="mb-4 text-2xl font-bold text-neon-cyan">
                                迷路一覧
                            </h2>
                            <Button
                                onClick={handleCreateNew}
                                className="w-full bg-neon-cyan text-space-dark hover:bg-neon-cyan/90"
                            >
                                <Plus className="mr-2 h-5 w-5" />
                                新規作成
                            </Button>
                            <Button
                                onClick={handleImportMaze}
                                variant="outline"
                                className="w-full mt-2 border-neon-purple text-neon-purple hover:bg-neon-purple/10"
                            >
                                <Upload className="mr-2 h-5 w-5" />
                                迷路を読み込む
                            </Button>
                        </div>
                    </div>

                    {/* Scrollable List */}
                    <div className="flex-1 overflow-y-auto bg-space-dark">
                        <div>
                            {mazes.map((maze) => (
                                <button
                                    key={maze.id}
                                    onClick={() => setSelectedMaze(maze)}
                                    className={`w-full border-b border-neon-blue/20 p-4 text-left transition-all hover:bg-neon-blue/10 ${
                                        selectedMaze?.id === maze.id
                                            ? "bg-neon-blue/20 border-l-4 border-l-neon-cyan"
                                            : ""
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-neon-cyan">
                                            {maze.name}
                                        </span>
                                        <ChevronRight className="h-5 w-5 text-neon-blue" />
                                    </div>
                                    <div className="mt-1 text-sm text-muted-foreground">
                                        {maze.grid.length}×
                                        {maze.grid[0]?.length || 0} グリッド
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side - Maze Details */}
                <div className="flex-1 overflow-y-auto">
                    <div className="min-h-screen bg-background">
                        {selectedMaze ? (
                            <div className="container mx-auto px-8 py-4">
                                <h2 className="mb-6 text-3xl font-bold text-neon-cyan">
                                    {selectedMaze.name}
                                </h2>

                                {/* Maze Preview */}
                                <Card className="mb-6 border-neon-blue/30 bg-space-dark/50 backdrop-blur-sm p-8">
                                    <h3 className="mb-4 text-xl font-semibold text-neon-blue">
                                        迷路プレビュー
                                    </h3>
                                    <div className="flex justify-center">
                                        <div className="max-w-2xl">
                                            <MazePreview
                                                grid={selectedMaze.grid}
                                            />
                                        </div>
                                    </div>
                                </Card>

                                {/* Maze Info */}
                                <Card className="mb-6 border-neon-blue/30 bg-space-dark/50 backdrop-blur-sm p-6">
                                    <h3 className="mb-4 text-xl font-semibold text-neon-blue">
                                        迷路情報
                                    </h3>
                                    <div className="space-y-2 text-muted-foreground">
                                        <div className="flex justify-between">
                                            <span>グリッドサイズ:</span>
                                            <span className="text-neon-cyan">
                                                {selectedMaze.grid.length} ×{" "}
                                                {selectedMaze.grid[0]?.length ||
                                                    0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>迷路ID:</span>
                                            <span className="font-mono text-sm text-neon-cyan">
                                                {selectedMaze.id}
                                            </span>
                                        </div>
                                    </div>
                                </Card>

                                {/* Action Buttons */}
                                <div className="flex gap-4">
                                    <Button
                                        onClick={() => handleShareMaze(selectedMaze)}
                                        variant="outline"
                                        size="lg"
                                        className="border-neon-purple text-neon-purple hover:bg-neon-purple/10"
                                    >
                                        <QrCode className="mr-2 h-5 w-5" />
                                        QRコード
                                    </Button>
                                    <Button
                                        onClick={() =>
                                            handleEditMaze(selectedMaze.id)
                                        }
                                        variant="outline"
                                        size="lg"
                                        className="flex-1 border-neon-blue text-neon-blue hover:bg-neon-blue/10"
                                    >
                                        編集
                                    </Button>
                                    <Button
                                        onClick={() =>
                                            handleRunAR(selectedMaze.id)
                                        }
                                        size="lg"
                                        className="flex-1 bg-neon-green text-space-dark hover:bg-neon-green/80"
                                    >
                                        <Play className="mr-2 h-5 w-5" />
                                        AR実行
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <p className="text-muted-foreground">
                                    迷路を選択してください
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* QRコード共有ダイアログ */}
            <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
                <DialogContent className="sm:max-w-md border-neon-purple/30 bg-space-dark">
                    <DialogHeader>
                        <DialogTitle className="text-neon-cyan">
                            迷路を共有
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-4 p-4">
                        <div className="rounded-lg bg-white p-4">
                            <QRCodeSVG
                                value={qrData}
                                size={320}
                                level="L"
                                includeMargin={true}
                            />
                        </div>
                        <p className="text-center text-sm text-muted-foreground">
                            このQRコードをスキャンして迷路を共有
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
            
            {/* QRコード読み込みダイアログ */}
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogContent className="sm:max-w-2xl border-neon-purple/30 bg-space-dark">
                    <DialogHeader>
                        <DialogTitle className="text-neon-cyan">
                            迷路のQRコードを読み込む
                        </DialogTitle>
                    </DialogHeader>
                    <div className="relative">
                        <canvas ref={scanCanvasRef} style={{ display: "none" }} />
                        {cameraError ? (
                            <div className="w-full h-64 flex items-center justify-center bg-red-900/20 border-2 border-red-500 rounded-lg">
                                <div className="text-center p-4">
                                    <AlertTriangle className="mx-auto mb-2 h-12 w-12 text-red-500" />
                                    <p className="text-red-400 font-bold mb-2">カメラエラー</p>
                                    <p className="text-sm text-red-300">{cameraError}</p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        ブラウザでカメラの使用を許可してください
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <video
                                    ref={videoElementRef}
                                    autoPlay
                                    playsInline
                                    webkit-playsinline="true"
                                    muted
                                    className="w-full h-auto rounded-lg"
                                    style={{
                                        transform: "scaleX(-1)",
                                    }}
                                />
                                {/* QRコードスキャン用の枠線 */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div 
                                        className="border-4 border-neon-cyan rounded-lg shadow-lg"
                                        style={{
                                            width: '60%',
                                            aspectRatio: '1 / 1',
                                            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                                        }}
                                    >
                                        {/* コーナーマーカー */}
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-neon-green -translate-x-1 -translate-y-1"></div>
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-neon-green translate-x-1 -translate-y-1"></div>
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-neon-green -translate-x-1 translate-y-1"></div>
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-neon-green translate-x-1 translate-y-1"></div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                        迷路のQRコードをカメラに映すと自動的に読み込まれます
                    </p>
                </DialogContent>
            </Dialog>
        </div>
    );
}
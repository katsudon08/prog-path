"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import type { MazeData } from "@entities/maze"
import { encodeMazeToQR } from "@features/maze-serialization"
import { loadMazes, saveMazes, loadCategories, saveCategories } from "@features/maze-storage"
import { createFolder, deleteFolder, renameFolder } from "@features/folder-management"
import { moveMazeToCategory } from "@features/maze-dnd"
import { importMazeFromQRCode } from "@features/maze-qr-management"
import { useCameraQRScanner } from "@features/camera-qr-scanner"

/**
 * ホームポータルの状態とハンドラーを管理するカスタムフック
 */
export function useHomePortalState() {
    const router = useRouter()

    // 迷路データ
    const [mazes, setMazes] = useState<MazeData[]>([])
    const [selectedMaze, setSelectedMaze] = useState<MazeData | null>(null)

    // カテゴリ管理
    const [customCategories, setCustomCategories] = useState<string[]>([])
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
    const [isCategoriesLoaded, setIsCategoriesLoaded] = useState(false)

    // フォルダ編集
    const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
    const [newFolderName, setNewFolderName] = useState("")
    const [editingCategory, setEditingCategory] = useState<string | null>(null)
    const [editingName, setEditingName] = useState("")

    // D&D
    const [draggedMazeId, setDraggedMazeId] = useState<string | null>(null)

    // QRダイアログ
    const [showQRDialog, setShowQRDialog] = useState(false)
    const [qrData, setQRData] = useState("")
    const [showImportDialog, setShowImportDialog] = useState(false)

    // 初期データ読み込み
    useEffect(() => {
        const categories = loadCategories()
        setCustomCategories(categories)
        setIsCategoriesLoaded(true)
    }, [])

    useEffect(() => {
        if (!isCategoriesLoaded) return
        saveCategories(customCategories)
    }, [customCategories, isCategoriesLoaded])

    useEffect(() => {
        const loadedMazes = loadMazes()
        setMazes(loadedMazes)
        if (loadedMazes.length > 0) {
            setSelectedMaze(loadedMazes[0])
        }
        const categories = new Set(loadedMazes.map(m => m.category || "未分類"))
        loadCategories().forEach(c => categories.add(c))
        setExpandedCategories(categories)
    }, [])

    // カテゴリごとにグループ化
    const groupedMazes = useMemo(() => {
        return mazes.reduce((acc, maze) => {
            const category = maze.category || "未分類"
            if (!acc[category]) acc[category] = []
            acc[category].push(maze)
            return acc
        }, customCategories.reduce((acc, cat) => {
            acc[cat] = acc[cat] || []
            return acc
        }, {} as Record<string, MazeData[]>))
    }, [mazes, customCategories])

    // QRコード検出コールバック
    const handleQRCodeDetected = useCallback((qrCodeData: string) => {
        const result = importMazeFromQRCode(qrCodeData, mazes)
        if (result.success && result.maze) {
            setMazes(result.mazes)
            alert(`迷路「${result.maze.name}」を読み込みました！`)
            setShowImportDialog(false)
            stopCamera()
        } else if (result.error && result.error !== "迷路のQRコードではありません") {
            alert(result.error)
            setShowImportDialog(false)
            stopCamera()
        }
    }, [mazes])

    // カメラフック
    const {
        videoRef,
        canvasRef,
        isStreamReady,
        cameraError,
        startCamera,
        stopCamera,
    } = useCameraQRScanner({ onQRCodeDetected: handleQRCodeDetected })

    // カメラダイアログ連動
    useEffect(() => {
        if (showImportDialog) {
            const timer = setTimeout(() => startCamera(), 100)
            return () => clearTimeout(timer)
        } else {
            stopCamera()
        }
    }, [showImportDialog, startCamera, stopCamera])

    // ハンドラー
    const handlers = {
        // ナビゲーション
        createNew: () => router.push("/editor"),
        editMaze: (id: string) => router.push(`/editor?id=${id}`),
        runAR: (id: string) => router.push(`/ar?id=${id}`),

        // 迷路選択
        selectMaze: (maze: MazeData) => setSelectedMaze(maze),

        // カテゴリ開閉
        toggleCategory: (category: string) => {
            setExpandedCategories(prev => {
                const next = new Set(prev)
                if (next.has(category)) next.delete(category)
                else next.add(category)
                return next
            })
        },

        // QR共有
        shareMaze: (maze: MazeData) => {
            try {
                const encoded = encodeMazeToQR(maze)
                setQRData(encoded)
                setShowQRDialog(true)
            } catch {
                alert("QRコードの生成に失敗しました")
            }
        },
        closeQRDialog: () => setShowQRDialog(false),

        // QRインポート
        openImportDialog: () => setShowImportDialog(true),
        closeImportDialog: () => {
            setShowImportDialog(false)
            stopCamera()
        },

        // フォルダ作成
        openNewFolderDialog: () => setShowNewFolderDialog(true),
        closeNewFolderDialog: () => {
            setShowNewFolderDialog(false)
            setNewFolderName("")
        },
        setNewFolderName,
        createFolder: () => {
            const result = createFolder(customCategories, newFolderName)
            if (!result.success) {
                if (result.error) alert(result.error)
                return
            }
            setCustomCategories(result.categories)
            setExpandedCategories(prev => new Set(prev).add(newFolderName.trim()))
            setShowNewFolderDialog(false)
            setNewFolderName("")
        },

        // フォルダ削除
        deleteFolder: (category: string) => {
            if (!confirm(`フォルダ「${category}」を削除しますか？\n中にある迷路は「未分類」に移動されます。`)) return
            const result = deleteFolder(customCategories, mazes, category)
            setCustomCategories(result.categories)
            setMazes(result.mazes)
            setExpandedCategories(prev => {
                const next = new Set(prev)
                next.delete(category)
                return next
            })
        },

        // フォルダリネーム
        startRename: (category: string) => {
            setEditingCategory(category)
            setEditingName(category)
        },
        setEditingName,
        saveRename: () => {
            if (!editingCategory) {
                setEditingCategory(null)
                return
            }
            const result = renameFolder(customCategories, mazes, editingCategory, editingName)
            if (!result.success) {
                if (result.error) alert(result.error)
                setEditingCategory(null)
                return
            }
            setCustomCategories(result.categories)
            setMazes(result.mazes)
            const oldName = editingCategory
            const newName = editingName.trim()
            setExpandedCategories(prev => {
                const next = new Set(prev)
                if (next.has(oldName)) {
                    next.delete(oldName)
                    next.add(newName)
                }
                return next
            })
            setEditingCategory(null)
        },
        cancelRename: () => setEditingCategory(null),

        // D&D
        dragStart: (e: React.DragEvent, mazeId: string) => {
            e.dataTransfer.setData("text/plain", mazeId)
            setDraggedMazeId(mazeId)
        },
        dragOver: (e: React.DragEvent) => {
            e.preventDefault()
            e.currentTarget.classList.add("bg-neon-blue/20")
        },
        dragLeave: (e: React.DragEvent) => {
            e.currentTarget.classList.remove("bg-neon-blue/20")
        },
        drop: (e: React.DragEvent, targetCategory: string) => {
            e.preventDefault()
            e.currentTarget.classList.remove("bg-neon-blue/20")
            if (!draggedMazeId) return
            const updated = moveMazeToCategory(mazes, draggedMazeId, targetCategory)
            setMazes(updated)
            setDraggedMazeId(null)
            setExpandedCategories(prev => new Set(prev).add(targetCategory))
        },
    }

    return {
        // 状態
        mazes,
        selectedMaze,
        groupedMazes,
        customCategories,
        expandedCategories,
        editingCategory,
        editingName,
        newFolderName,
        showNewFolderDialog,
        showQRDialog,
        qrData,
        showImportDialog,
        videoRef,
        canvasRef,
        isStreamReady,
        cameraError,
        // ハンドラー
        handlers,
    }
}

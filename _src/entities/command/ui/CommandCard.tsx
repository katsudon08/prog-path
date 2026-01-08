"use client"

import type { CommandType } from '../model/types'

interface CommandCardProps {
    /** コマンドタイプ */
    type: CommandType
    /** ラベル */
    label: string
    /** アイコン（ReactNode） */
    icon: React.ReactNode
    /** 背景色クラス */
    colorClass?: string
    /** 実行中かどうか */
    isActive?: boolean
    /** 削除ハンドラー */
    onRemove?: () => void
    /** 無効化 */
    disabled?: boolean
    /** ループ回数（loopコマンド用） */
    loopCount?: number
    /** ループ回数変更ハンドラー */
    onLoopCountChange?: (count: number) => void
    /** 追加のCSSクラス */
    className?: string
    /** 子コンテンツ（ループの子コマンド等） */
    children?: React.ReactNode
}

/**
 * コマンドカードコンポーネント
 * コマンドスタックで使用される純粋なUIコンポーネント
 * ビジネスロジック（コマンド実行等）は含まない
 */
export function CommandCard({
    type,
    label,
    icon,
    colorClass = "bg-neon-cyan",
    isActive = false,
    onRemove,
    disabled = false,
    loopCount,
    onLoopCountChange,
    className = "",
    children
}: CommandCardProps) {
    return (
        <div className={`space-y-1 ${className}`}>
            <div
                className={`
                    flex items-center gap-2 rounded-lg border-2 p-3 transition-all
                    ${isActive
                        ? "border-neon-cyan bg-neon-cyan/20 shadow-lg shadow-neon-cyan/20"
                        : "border-neon-blue/30 bg-space-blue/20"
                    }
                `}
            >
                {/* アイコン */}
                <div
                    className={`flex h-8 w-8 items-center justify-center rounded ${colorClass} text-space-dark`}
                >
                    {icon}
                </div>
                
                {/* ラベルとループ回数入力 */}
                <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                        {label}
                    </p>
                    {type === "loop" && loopCount !== undefined && (
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={loopCount}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value, 10)
                                    if (!isNaN(value) && onLoopCountChange) {
                                        onLoopCountChange(Math.min(10, Math.max(1, value)))
                                    }
                                }}
                                className="h-6 w-16 border border-neon-blue/30 bg-space-dark text-xs rounded px-2"
                                disabled={disabled}
                            />
                            <span className="text-xs text-muted-foreground">
                                回
                            </span>
                        </div>
                    )}
                </div>
                
                {/* 削除ボタン */}
                {onRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="p-1 text-neon-red hover:bg-neon-red/10 rounded"
                        disabled={disabled}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                    </button>
                )}
            </div>
            
            {/* 子コンテンツ（ループの子コマンド等） */}
            {children && (
                <div className="ml-8 space-y-1 border-l-2 border-neon-purple/30 pl-4">
                    {children}
                </div>
            )}
        </div>
    )
}

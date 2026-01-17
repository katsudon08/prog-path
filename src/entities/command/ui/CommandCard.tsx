"use client"

import { ChevronRight, ChevronDown } from 'lucide-react'
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
    /** 選択中かどうか */
    isActive?: boolean
    /** 実行中かどうか（パルスアニメーション） */
    isExecuting?: boolean
    /** 削除ハンドラー */
    onRemove?: () => void
    /** 無効化 */
    disabled?: boolean
    /** ループ回数（loopコマンド用） */
    loopCount?: number
    /** ループ回数変更ハンドラー */
    onLoopCountChange?: (count: number) => void
    /** ループ折りたたみ状態 */
    isCollapsed?: boolean
    /** ループ折りたたみトグルハンドラー */
    onToggleCollapsed?: () => void
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
    isExecuting = false,
    onRemove,
    disabled = false,
    loopCount,
    onLoopCountChange,
    isCollapsed = false,
    onToggleCollapsed,
    className = "",
    children
}: CommandCardProps) {
    const isLoop = type === "loop"
    
    return (
        <div className={`space-y-1 min-w-0 ${className}`}>
            <div
                className={`
                    flex items-center gap-1.5 rounded-lg border-2 p-2.5 transition-all min-w-0
                    ${isExecuting
                        ? "border-neon-cyan bg-neon-cyan/30 shadow-lg shadow-neon-cyan/40 animate-pulse"
                        : isActive
                            ? "border-neon-cyan bg-neon-cyan/20 shadow-lg shadow-neon-cyan/20"
                            : "border-neon-blue/30 bg-space-blue/20"
                    }
                `}
            >
                {/* ループ開閉ボタン */}
                {isLoop && onToggleCollapsed && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            onToggleCollapsed()
                        }}
                        className="p-0.5 text-muted-foreground hover:text-neon-cyan transition-colors flex-shrink-0"
                        disabled={disabled}
                    >
                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    </button>
                )}
                
                {/* アイコン */}
                <div
                    className={`flex h-7 w-7 items-center justify-center rounded ${colorClass} text-space-dark flex-shrink-0`}
                >
                    {icon}
                </div>
                
                {/* ラベル */}
                <p className="text-sm font-semibold text-foreground truncate min-w-0">
                    {label}
                </p>
                
                {/* ループ回数入力（インライン） */}
                {isLoop && loopCount !== undefined && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <input
                            type="number"
                            min="1"
                            max="10"
                            defaultValue={loopCount}
                            onBlur={(e) => {
                                let value = parseInt(e.target.value, 10)
                                if (isNaN(value) || value < 1) {
                                    value = 1
                                    e.target.value = '1'
                                } else if (value > 10) {
                                    value = 10
                                    e.target.value = '10'
                                }
                                if (onLoopCountChange) {
                                    onLoopCountChange(value)
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.currentTarget.blur()
                                }
                            }}
                            className="h-5 w-8 border border-neon-blue/30 bg-space-dark text-xs rounded px-1 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            disabled={disabled}
                        />
                        <span className="text-xs text-muted-foreground">回</span>
                    </div>
                )}
                
                {/* スペーサー */}
                <div className="flex-1 min-w-0" />
                
                {/* 削除ボタン */}
                {onRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="p-1 text-neon-red hover:bg-neon-red/10 rounded flex-shrink-0"
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
            
            {/* 子コンテンツ（ループの子コマンド等） - 折りたたまれていない場合のみ表示 */}
            {children && !isCollapsed && (
                <div className="ml-2 space-y-1 border-l-2 border-neon-purple/30 pl-2">
                    {children}
                </div>
            )}
        </div>
    )
}

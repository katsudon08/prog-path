"use client"

import type { TileType } from '../../model/types'
import { getTileColor } from '../../lib/tile-colors'
import { getTileIcon } from '../../lib/tile-icons'

interface MazeTile2DProps {
    /** タイルタイプ */
    type: TileType
    /** サイズ（px） */
    size?: number
    /** 選択中かどうか */
    isSelected?: boolean
    /** クリックハンドラー */
    onClick?: () => void
    /** ラベル表示（オプション） */
    label?: string
    /** 追加のCSSクラス */
    className?: string
}

/**
 * タイル単体表示コンポーネント（2D）
 * タイルパレットやエディタで使用される純粋なUIコンポーネント
 * ビジネスロジックは含まない
 */
export function MazeTile2D({
    type,
    size = 32,
    isSelected = false,
    onClick,
    label,
    className = ""
}: MazeTile2DProps) {
    const colorClass = getTileColor(type)
    const icon = getTileIcon(type, size * 0.5)
    
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                flex flex-col items-center justify-center gap-1 rounded border-2
                transition-all origin-center hover:scale-[1.05]
                ${isSelected
                    ? "border-neon-cyan bg-neon-cyan/10"
                    : "border-neon-blue/30 bg-space-blue/20"
                }
                ${className}
            `}
            style={{ width: size + 16, height: size + 16 }}
        >
            <div
                className={`rounded shrink-0 flex items-center justify-center ${colorClass}`}
                style={{ width: size, height: size }}
            >
                {icon}
            </div>
            {label && (
                <span className="text-foreground text-xs">{label}</span>
            )}
        </button>
    )
}

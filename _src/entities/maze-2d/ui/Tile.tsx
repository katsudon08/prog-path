"use client"

import type { TileType } from '../model/types'
import { getTileColor } from '../lib/tile-colors'
import { getTileIcon } from '../lib/tile-icons'

interface TileProps {
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
 * タイル単体表示コンポーネント
 * タイルパレットやエディタで使用される純粋なUIコンポーネント
 * ビジネスロジックは含まない
 */
export function Tile({
    type,
    size = 32,
    isSelected = false,
    onClick,
    label,
    className = ""
}: TileProps) {
    const colorClass = getTileColor(type)
    const icon = getTileIcon(type, size * 0.5)
    
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                flex items-center gap-2 rounded border-2 px-2 py-1
                transition-all origin-center hover:scale-[1.05]
                ${isSelected
                    ? "border-neon-cyan bg-neon-cyan/10"
                    : "border-neon-blue/30 bg-space-blue/20"
                }
                ${className}
            `}
            style={{ minHeight: size }}
        >
            <div
                className={`rounded shrink-0 flex items-center justify-center ${colorClass}`}
                style={{ width: size * 0.75, height: size * 0.75 }}
            >
                {icon}
            </div>
            {label && (
                <span className="text-foreground text-sm">{label}</span>
            )}
        </button>
    )
}

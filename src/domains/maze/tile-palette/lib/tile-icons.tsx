"use client"

import React from "react"
import type { TileType } from "@/src/domains/maze/maze-data/lib/types"
import { Key, ArrowUp, ArrowDown } from "lucide-react"

interface TileIconProps {
    size?: number
    className?: string
}

/**
 * スタートタイルアイコン（発光する緑色S）
 */
export function StartIcon({ size = 16, className = "" }: TileIconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className={className}
        >
            <defs>
                <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <text
                x="12"
                y="17"
                textAnchor="middle"
                fontSize="16"
                fontWeight="bold"
                fill="#4ade80"
                filter="url(#glow-green)"
            >
                S
            </text>
        </svg>
    )
}

/**
 * ゴールタイルアイコン（発光する赤色G）
 */
export function GoalIcon({ size = 16, className = "" }: TileIconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className={className}
        >
            <defs>
                <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <text
                x="12"
                y="17"
                textAnchor="middle"
                fontSize="16"
                fontWeight="bold"
                fill="#ef4444"
                filter="url(#glow-red)"
            >
                G
            </text>
        </svg>
    )
}

/**
 * 鍵アイコン（発光する黄色）
 */
export function KeyIcon({ size = 16, className = "" }: TileIconProps) {
    return (
        <Key
            size={size}
            className={`text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.8)] ${className}`}
        />
    )
}

/**
 * 上へテレポートアイコン（発光する水色）
 */
export function TeleportUpIcon({ size = 16, className = "" }: TileIconProps) {
    return (
        <ArrowUp
            size={size}
            className={`text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.8)] ${className}`}
        />
    )
}

/**
 * 下へテレポートアイコン（発光する紫色）
 */
export function TeleportDownIcon({ size = 16, className = "" }: TileIconProps) {
    return (
        <ArrowDown
            size={size}
            className={`text-purple-400 drop-shadow-[0_0_4px_rgba(192,132,252,0.8)] ${className}`}
        />
    )
}

/**
 * 穴アイコン（宇宙テーマのブラックホール風）
 */
export function HoleIcon({ size = 16, className = "" }: TileIconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className={className}
        >
            <defs>
                <filter id="glow-hole" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <radialGradient id="hole-gradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#000000" />
                    <stop offset="50%" stopColor="#1a1a1a" />
                    <stop offset="100%" stopColor="#f97316" />
                </radialGradient>
            </defs>
            {/* 外側の発光リング（降着円盤） */}
            <circle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                stroke="#f97316"
                strokeWidth="2"
                opacity="0.7"
                filter="url(#glow-hole)"
            />
            {/* ブラックホールの中心 */}
            <circle
                cx="12"
                cy="12"
                r="6"
                fill="url(#hole-gradient)"
            />
            {/* 内側の暗いリング */}
            <circle
                cx="12"
                cy="12"
                r="4"
                fill="#000000"
            />
        </svg>
    )
}

/**
 * タイルタイプに対応するアイコンコンポーネントを取得
 */
export function getTileIcon(tile: TileType, size?: number): React.ReactNode | null {
    switch (tile) {
        case "start":
            return <StartIcon size={size} />
        case "goal":
            return <GoalIcon size={size} />
        case "key":
            return <KeyIcon size={size} />
        case "teleportUp":
            return <TeleportUpIcon size={size} />
        case "teleportDown":
            return <TeleportDownIcon size={size} />
        case "hole":
            return <HoleIcon size={size} />
        default:
            return null
    }
}

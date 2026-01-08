"use client"

import { useState } from 'react'

interface FolderCardProps {
    /** カテゴリ名 */
    category: string
    /** 展開されているかどうか */
    isExpanded?: boolean
    /** カスタムカテゴリかどうか（削除可能） */
    isCustomCategory?: boolean
    /** フォルダ内のアイテム数 */
    itemCount?: number
    /** 展開/折りたたみハンドラー */
    onToggle?: () => void
    /** 削除ハンドラー */
    onDelete?: () => void
    /** リネーム編集中かどうか */
    isEditing?: boolean
    /** 編集中の名前 */
    editingName?: string
    /** 編集開始ハンドラー */
    onStartRename?: () => void
    /** 編集中の名前変更ハンドラー */
    onSetEditingName?: (name: string) => void
    /** リネーム保存ハンドラー */
    onSaveRename?: () => void
    /** リネームキャンセルハンドラー */
    onCancelRename?: () => void
    /** D&D イベントハンドラー */
    onDragOver?: (e: React.DragEvent) => void
    onDragLeave?: (e: React.DragEvent) => void
    onDrop?: (e: React.DragEvent) => void
    /** 子コンテンツ（迷路カード等） */
    children?: React.ReactNode
    /** 追加のCSSクラス */
    className?: string
}

/**
 * フォルダカードコンポーネント
 * フォルダリストで使用される純粋なUIコンポーネント
 * ビジネスロジック（削除確認ダイアログ等）は含まない
 */
export function FolderCard({
    category,
    isExpanded = false,
    isCustomCategory = false,
    itemCount = 0,
    onToggle,
    onDelete,
    isEditing = false,
    editingName = "",
    onStartRename,
    onSetEditingName,
    onSaveRename,
    onCancelRename,
    onDragOver,
    onDragLeave,
    onDrop,
    children,
    className = ""
}: FolderCardProps) {
    const isUncategorized = category === "未分類"
    
    return (
        <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`transition-colors duration-200 ${className}`}
        >
            {/* フォルダヘッダー */}
            <div
                className="flex items-center gap-2 px-6 py-2 cursor-pointer bg-space-darker border-b border-neon-blue/20 hover:bg-space-dark/50"
                onClick={onToggle}
            >
                {/* 展開/折りたたみアイコン */}
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
                    className={`text-neon-cyan transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
                
                {/* フォルダアイコン */}
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
                    className="text-neon-green"
                >
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                
                {/* カテゴリ名（編集モード/通常モード） */}
                {isEditing ? (
                    <input
                        type="text"
                        value={editingName}
                        onChange={(e) => onSetEditingName?.(e.target.value)}
                        onBlur={onSaveRename}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") onSaveRename?.()
                            if (e.key === "Escape") onCancelRename?.()
                        }}
                        className="h-6 py-0 px-1 text-sm bg-space-dark border border-neon-blue/50 rounded"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span
                        className="flex-1 text-sm font-medium text-neon-cyan"
                        onDoubleClick={(e) => {
                            e.stopPropagation()
                            if (!isUncategorized) onStartRename?.()
                        }}
                    >
                        {category}
                    </span>
                )}
                
                {/* アイテム数 */}
                <span className="text-xs text-muted-foreground">
                    {itemCount}
                </span>
                
                {/* 削除ボタン（カスタムカテゴリのみ） */}
                {!isUncategorized && isCustomCategory && onDelete && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete()
                        }}
                        className="p-1 hover:bg-red-500/20 rounded"
                        title="フォルダを削除"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-red-400 hover:text-red-300"
                        >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                    </button>
                )}
            </div>
            
            {/* 子コンテンツ（展開時のみ表示） */}
            {isExpanded && children && (
                <div className="p-2 space-y-2">
                    {children}
                </div>
            )}
        </div>
    )
}

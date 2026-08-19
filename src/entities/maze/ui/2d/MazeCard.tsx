"use client"

interface MazeCardProps {
    /** 迷路ID */
    id: string
    /** 迷路名 */
    name: string
    /** 迷路サイズ（幅x高さの文字列表記） */
    sizeLabel: string
    /** 選択中かどうか */
    isSelected?: boolean
    /** クリックハンドラー */
    onSelect?: () => void
    /** 削除ハンドラー */
    onDelete?: () => void
    /** ドラッグ可能かどうか */
    draggable?: boolean
    /** ドラッグ開始ハンドラー */
    onDragStart?: (e: React.DragEvent) => void
    /** プレビュー用のReactNode（MazePreview2Dを渡す） */
    preview?: React.ReactNode
    /** 追加のCSSクラス */
    className?: string
}

/**
 * 迷路カードコンポーネント
 * 迷路リストで使用される純粋なUIコンポーネント
 * ビジネスロジック（削除確認ダイアログ等）は含まない
 */
export function MazeCard({
    id,
    name,
    sizeLabel,
    isSelected = false,
    onSelect,
    onDelete,
    draggable = false,
    onDragStart,
    preview,
    className = ""
}: MazeCardProps) {
    return (
        <div
            className={`
                p-3 cursor-pointer border rounded-lg transition-all
                hover:border-neon-cyan/50 group
                ${isSelected
                    ? "border-neon-cyan bg-neon-cyan/10"
                    : "border-neon-blue/30 bg-space-dark/50"
                }
                ${className}
            `}
            onClick={onSelect}
            draggable={draggable}
            onDragStart={onDragStart}
        >
            <div className="flex items-center gap-3">
                {/* プレビューエリア */}
                <div className="w-16 h-16 rounded bg-space-darker flex items-center justify-center overflow-hidden shrink-0">
                    {preview}
                </div>
                
                {/* 情報エリア */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-neon-cyan truncate">
                        {name}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                        {sizeLabel}
                    </p>
                </div>
                
                {/* 削除ボタン */}
                {onDelete && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete()
                        }}
                        className="p-2 hover:bg-red-500/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="迷路を削除"
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
                            className="text-red-500"
                        >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    )
}

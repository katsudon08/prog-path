"use client"

import { useRef, useEffect } from 'react'
import { 
    ArrowUp, 
    CornerUpRight, 
    CornerUpLeft, 
    RotateCcw, 
    Sparkles,
} from 'lucide-react'
import type { CommandType, Command } from '@/_src/entities/command'
import { CommandCard } from '@/_src/entities/command'
import { useCommandBuilder } from '../model/useCommandBuilder'

interface CommandStackProps {
    /** カスタムスタイルクラス */
    className?: string
    /** 削除ボタンを表示するか（デフォルト: true） */
    showRemoveButton?: boolean
    /** 無効化 */
    disabled?: boolean
    /** 実行中のコマンドパス（ハイライト用） */
    executionPath?: number[]
}

/** コマンドタイプごとのアイコン */
const COMMAND_ICONS: Record<CommandType, React.ReactNode> = {
    forward: <ArrowUp size={16} />,
    turnRight: <CornerUpRight size={16} />,
    turnLeft: <CornerUpLeft size={16} />,
    ifHole: <Sparkles size={16} />,
    loop: <RotateCcw size={16} />
}

/** コマンドタイプごとのカラークラス */
const COMMAND_COLORS: Record<CommandType, string> = {
    forward: 'bg-neon-cyan',
    turnRight: 'bg-neon-cyan',
    turnLeft: 'bg-neon-cyan',
    ifHole: 'bg-neon-cyan',
    loop: 'bg-neon-purple'
}

/**
 * パス配列が等しいか判定
 */
function isPathEqual(pathA: number[], pathB: number[]): boolean {
    return pathA.length === pathB.length && pathA.every((val, i) => val === pathB[i])
}

/**
 * 再帰表示用コマンドリストコンポーネント
 */
interface RecursiveCommandListProps {
    commands: Command[]
    parentPath: number[]
    activePath: number[]
    executionPath: number[]
    onSelectPath: (path: number[]) => void
    onUpdateLoop: (path: number[], count: number) => void
    onRemove: (path: number[]) => void
    labels: Record<CommandType, string>
    disabled: boolean
    showRemoveButton: boolean
    executingRef: React.RefObject<HTMLDivElement | null>
}

function RecursiveCommandList({
    commands,
    parentPath,
    activePath,
    executionPath,
    onSelectPath,
    onUpdateLoop,
    onRemove,
    labels,
    disabled,
    showRemoveButton,
    executingRef
}: RecursiveCommandListProps) {
    if (commands.length === 0) return null

    return (
        <div className="space-y-1">
            {commands.map((cmd, index) => {
                const currentPath = [...parentPath, index]
                const isSelected = isPathEqual(activePath, currentPath)
                const isExecuting = isPathEqual(executionPath, currentPath)
                
                return (
                    <div 
                        key={`cmd-${currentPath.join('-')}`}
                        ref={isExecuting ? executingRef : undefined}
                    >
                        <CommandCard
                            type={cmd.type}
                            label={labels[cmd.type]}
                            icon={COMMAND_ICONS[cmd.type]}
                            colorClass={COMMAND_COLORS[cmd.type]}
                            loopCount={cmd.loopCount}
                            isActive={isSelected}
                            isExecuting={isExecuting}
                            onLoopCountChange={(count) => onUpdateLoop(currentPath, count)}
                            onRemove={showRemoveButton ? () => onRemove(currentPath) : undefined}
                            disabled={disabled}
                        >
                            {cmd.type === 'loop' && (
                                <div className="space-y-1">
                                    <RecursiveCommandList 
                                        commands={cmd.children || []}
                                        parentPath={currentPath}
                                        activePath={activePath}
                                        executionPath={executionPath}
                                        onSelectPath={onSelectPath}
                                        onUpdateLoop={onUpdateLoop}
                                        onRemove={onRemove}
                                        labels={labels}
                                        disabled={disabled}
                                        showRemoveButton={showRemoveButton}
                                        executingRef={executingRef}
                                    />
                                    
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onSelectPath(currentPath)
                                        }}
                                        className={`
                                            w-full text-xs py-1 px-2 rounded border border-dashed text-left
                                            ${isSelected 
                                                ? "border-neon-cyan text-neon-cyan bg-neon-cyan/10" 
                                                : "border-muted-foreground/30 text-muted-foreground hover:bg-white/5"
                                            }
                                        `}
                                    >
                                        {isSelected ? "選択中: ここに追加されます" : "このループ内に追加"}
                                    </button>
                                </div>
                            )}
                        </CommandCard>
                    </div>
                )
            })}
        </div>
    )
}

/**
 * コマンドスタック表示コンポーネント
 * 現在のコマンドスタック一覧を表示
 */
export function CommandStack({ 
    className = '',
    showRemoveButton = true,
    disabled = false,
    executionPath = []
}: CommandStackProps) {
    const executingRef = useRef<HTMLDivElement>(null)
    const { 
        commands, 
        activePath,
        removeCommand, 
        updateLoopCount, 
        clearCommands, 
        setActivePath,
        COMMAND_LABELS 
    } = useCommandBuilder()

    // 実行中のコマンドへオートスクロール
    useEffect(() => {
        if (executionPath.length > 0 && executingRef.current) {
            executingRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }, [executionPath])

    if (commands.length === 0) {
        return (
            <div className={`text-center text-muted-foreground py-8 ${className}`}>
                <p className="text-sm">コマンドがありません</p>
                <p className="text-xs mt-1">QRコードをスキャンしてコマンドを追加</p>
            </div>
        )
    }

    const isRootActive = activePath.length === 0

    return (
        <div className={`space-y-2 ${className}`}>
            {/* ヘッダー */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                    コマンドスタック
                </h3>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setActivePath([])}
                        disabled={disabled}
                        className={`text-xs px-2 py-0.5 rounded border ${
                            isRootActive 
                                ? "bg-neon-cyan/20 border-neon-cyan text-neon-cyan" 
                                : "border-transparent text-muted-foreground hover:bg-white/5"
                        }`}
                    >
                        Topへ追加
                    </button>

                    <button
                        type="button"
                        onClick={() => clearCommands()}
                        disabled={disabled}
                        className="text-xs text-neon-red hover:text-neon-red/80 disabled:opacity-50"
                    >
                        すべて削除
                    </button>
                </div>
            </div>
            
            {/* コマンド一覧（再帰） */}
            <RecursiveCommandList 
                commands={commands}
                parentPath={[]}
                activePath={activePath}
                executionPath={executionPath}
                onSelectPath={setActivePath}
                onUpdateLoop={updateLoopCount}
                onRemove={removeCommand}
                labels={COMMAND_LABELS}
                disabled={disabled}
                showRemoveButton={showRemoveButton}
                executingRef={executingRef}
            />
        </div>
    )
}

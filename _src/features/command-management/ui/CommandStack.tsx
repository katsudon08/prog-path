import { useRef, useEffect, useCallback } from 'react'
import { 
    ArrowUp, 
    CornerUpRight, 
    CornerUpLeft, 
    RotateCcw, 
    Sparkles,
    Plus,
} from 'lucide-react'
import type { CommandType, Command } from '@/_src/entities/command'
import { CommandCard } from '@/_src/entities/command'
import { useCommandBuilder } from '../model/useCommandBuilder'
import { useToast } from '@/_src/shared/ui/toast/useToast'

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
 * 挿入位置ボタンコンポーネント
 */
interface InsertPointButtonProps {
    isSelected: boolean
    onClick: () => void
    disabled: boolean
}

function InsertPointButton({ isSelected, onClick, disabled }: InsertPointButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`
                group relative w-full h-4 flex items-center justify-center
                transition-all duration-200 ease-out
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            `}
        >
            {/* 挿入ライン */}
            <div className={`
                absolute inset-x-0 h-0.5 rounded-full
                transition-all duration-200
                ${isSelected 
                    ? 'bg-gradient-to-r from-transparent via-neon-green to-transparent shadow-[0_0_8px_rgba(74,222,128,0.5)]'
                    : 'bg-transparent group-hover:bg-gradient-to-r group-hover:from-transparent group-hover:via-neon-cyan/50 group-hover:to-transparent'
                }
            `} />
            
            {/* プラスボタン */}
            <div className={`
                absolute z-10 w-5 h-5 rounded-full flex items-center justify-center
                transition-all duration-200 transform
                ${isSelected 
                    ? 'bg-neon-green text-space-darker scale-110 shadow-[0_0_12px_rgba(74,222,128,0.6)]'
                    : 'bg-space-dark border border-muted-foreground/30 text-muted-foreground scale-0 group-hover:scale-100 group-hover:border-neon-cyan/50 group-hover:text-neon-cyan'
                }
            `}>
                <Plus size={12} strokeWidth={3} />
            </div>
        </button>
    )
}

/**
 * 再帰表示用コマンドリストコンポーネント
 */
interface RecursiveCommandListProps {
    commands: Command[]
    parentPath: number[]
    activePath: number[]
    executionPath: number[]
    insertIndex: number | null
    onSelectPath: (path: number[]) => void
    onSelectInsertPosition: (index: number | null) => void
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
    insertIndex,
    onSelectPath,
    onSelectInsertPosition,
    onUpdateLoop,
    onRemove,
    labels,
    disabled,
    showRemoveButton,
    executingRef
}: RecursiveCommandListProps) {
    // このリストがアクティブパスと一致するかどうか
    const isThisLevelActive = isPathEqual(activePath, parentPath)

    if (commands.length === 0) {
        // コマンドがない場合は先頭への挿入ポイントのみ表示
        if (isThisLevelActive) {
            return (
                <InsertPointButton
                    isSelected={insertIndex === 0}
                    onClick={() => onSelectInsertPosition(insertIndex === 0 ? null : 0)}
                    disabled={disabled}
                />
            )
        }
        return null
    }

    return (
        <div className="space-y-0">
            {commands.map((cmd, index) => {
                const currentPath = [...parentPath, index]
                const isSelected = isPathEqual(activePath, currentPath)
                const isExecuting = isPathEqual(executionPath, currentPath)
                
                return (
                    <div key={`cmd-${currentPath.join('-')}`}>
                        {/* このコマンドの前に挿入するポイント */}
                        {isThisLevelActive && (
                            <InsertPointButton
                                isSelected={insertIndex === index}
                                onClick={() => onSelectInsertPosition(insertIndex === index ? null : index)}
                                disabled={disabled}
                            />
                        )}

                        <div ref={isExecuting ? executingRef : undefined}>
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
                                    <div className="space-y-0">
                                        <RecursiveCommandList 
                                            commands={cmd.children || []}
                                            parentPath={currentPath}
                                            activePath={activePath}
                                            executionPath={executionPath}
                                            insertIndex={insertIndex}
                                            onSelectPath={onSelectPath}
                                            onSelectInsertPosition={onSelectInsertPosition}
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
                                                w-full text-xs py-1 px-2 rounded border border-dashed text-left mt-1
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
                    </div>
                )
            })}
            
            {/* 最後のコマンドの後に挿入するポイント */}
            {isThisLevelActive && (
                <InsertPointButton
                    isSelected={insertIndex === commands.length}
                    onClick={() => onSelectInsertPosition(insertIndex === commands.length ? null : commands.length)}
                    disabled={disabled}
                />
            )}
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
    const { addToast } = useToast()
    const { 
        commands, 
        activePath,
        insertIndex,
        removeCommand, 
        updateLoopCount, 
        clearCommands, 
        setActivePath,
        setInsertIndex,
        COMMAND_LABELS 
    } = useCommandBuilder()

    // コマンド削除ハンドラー（トースト通知付き）
    const handleRemoveCommand = useCallback((path: number[]) => {
        // 削除前にコマンド名を取得
        const getCommandByPath = (cmds: Command[], p: number[]): Command | null => {
            if (p.length === 0) return null
            const [head, ...rest] = p
            const cmd = cmds[head]
            if (!cmd) return null
            if (rest.length === 0) return cmd
            return getCommandByPath(cmd.children || [], rest)
        }
        const command = getCommandByPath(commands, path)
        const label = command ? COMMAND_LABELS[command.type] : 'コマンド'
        
        removeCommand(path)
        addToast({ success: true, type: 'info', message: `「${label}」を削除しました` })
    }, [commands, removeCommand, addToast, COMMAND_LABELS])

    // 全削除ハンドラー（トースト通知付き）
    const handleClearCommands = useCallback(() => {
        clearCommands()
        addToast({ success: true, type: 'info', message: 'すべてのコマンドを削除しました' })
    }, [clearCommands, addToast])

    // 実行中のコマンドへオートスクロール
    useEffect(() => {
        if (executionPath.length > 0 && executingRef.current) {
            executingRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }, [executionPath])

    const isRootActive = activePath.length === 0

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* ヘッダー（固定） */}
            <div className="flex items-center justify-between pb-2 flex-shrink-0">
                <h3 className="text-sm font-semibold text-foreground">
                    コマンドスタック
                </h3>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleClearCommands}
                        disabled={disabled || commands.length === 0}
                        className="text-xs text-neon-red hover:text-neon-red/80 disabled:opacity-50"
                    >
                        すべて削除
                    </button>
                </div>
            </div>
            
            {/* コンテンツ（スクロール可能） */}
            <div className="flex-1 overflow-y-auto min-h-0 pt-2">
                {/* コマンドが空の場合のメッセージ */}
                {commands.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        <p className="text-sm">コマンドがありません</p>
                        <p className="text-xs mt-1">QRコードをスキャンしてコマンドを追加</p>
                    </div>
                ) : (
                    /* コマンド一覧（再帰） */
                    <RecursiveCommandList 
                        commands={commands}
                        parentPath={[]}
                        activePath={activePath}
                        executionPath={executionPath}
                        insertIndex={insertIndex}
                        onSelectPath={setActivePath}
                        onSelectInsertPosition={setInsertIndex}
                        onUpdateLoop={updateLoopCount}
                        onRemove={handleRemoveCommand}
                        labels={COMMAND_LABELS}
                        disabled={disabled}
                        showRemoveButton={showRemoveButton}
                        executingRef={executingRef}
                    />
                )}
            </div>
        </div>
    )
}

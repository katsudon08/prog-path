"use client"

import { 
    ArrowUp, 
    CornerUpRight, 
    CornerUpLeft, 
    RotateCcw, 
    Sparkles,
} from 'lucide-react'
import type { CommandType } from '@/_src/entities/command'
import { CommandCard } from '@/_src/entities/command'
import { useCommandBuilder } from '../model/useCommandBuilder'

interface CommandStackProps {
    /** カスタムスタイルクラス */
    className?: string
    /** 削除ボタンを表示するか（デフォルト: true） */
    showRemoveButton?: boolean
    /** 無効化 */
    disabled?: boolean
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
    commands: import('@/_src/entities/command').Command[]
    parentPath: number[]
    activePath: number[]
    onSelectPath: (path: number[]) => void
    onUpdateLoop: (path: number[], count: number) => void
    onRemove: (path: number[]) => void
    labels: Record<CommandType, string>
    disabled: boolean
    showRemoveButton: boolean
}

function RecursiveCommandList({
    commands,
    parentPath,
    activePath,
    onSelectPath,
    onUpdateLoop,
    onRemove,
    labels,
    disabled,
    showRemoveButton
}: RecursiveCommandListProps) {
    if (commands.length === 0) return null

    return (
        <div className="space-y-1">
            {commands.map((cmd, index) => {
                const currentPath = [...parentPath, index]
                // 自身の中に挿入する場合のパス（子要素末尾に追加）
                // ただし、追加ターゲットとして「このコマンドの内部」を選択する場合の表現が必要
                // ここでは単純に「このコマンドがアクティブ」かどうかで判定するが、
                // 厳密には activePath は「次の挿入位置」を示すものではない（activePath自体がコンテナを指す）
                // 仕様上、「ループ内」をactivePathにするため、ループコマンドを選択するとその内部がActiveになる
                
                // ループコマンド自身がActivePathと一致するか、あるいはその内部がActivePathか
                const isSelected = isPathEqual(activePath, currentPath)
                
                return (
                    <CommandCard
                        key={`cmd-${currentPath.join('-')}`}
                        type={cmd.type}
                        label={labels[cmd.type]}
                        icon={COMMAND_ICONS[cmd.type]}
                        colorClass={COMMAND_COLORS[cmd.type]}
                        loopCount={cmd.loopCount}
                        isActive={isSelected}
                        onLoopCountChange={(count) => onUpdateLoop(currentPath, count)}
                        onRemove={showRemoveButton ? () => onRemove(currentPath) : undefined}
                        disabled={disabled}
                        // ループの場合、クリックでその内部をActivePathに設定する（トグル動作など検討）
                        // ここではループアイコンクリック等を想定せず、カードクリック全体で処理したいところだが
                        // CommandCardの仕様上 onClick はないため、ループの場合のコンテナ選択ボタンが必要かも
                        // 仮実装: ループの場合、強制的に中身を表示
                        children={
                            cmd.type === 'loop' ? (
                                <div className="space-y-1">
                                    {/* 内部を表示 */}
                                    <RecursiveCommandList 
                                        commands={cmd.children || []}
                                        parentPath={currentPath}
                                        activePath={activePath}
                                        onSelectPath={onSelectPath}
                                        onUpdateLoop={onUpdateLoop}
                                        onRemove={onRemove}
                                        labels={labels}
                                        disabled={disabled}
                                        showRemoveButton={showRemoveButton}
                                    />
                                    
                                    {/* このループ内をアクティブにするボタン */}
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
                            ) : undefined
                        }
                    />
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
    disabled = false
}: CommandStackProps) {
    const { 
        commands, 
        activePath,
        removeCommand, 
        updateLoopCount, 
        clearCommands, 
        setActivePath,
        COMMAND_LABELS 
    } = useCommandBuilder()

    if (commands.length === 0) {
        return (
            <div className={`text-center text-muted-foreground py-8 ${className}`}>
                <p className="text-sm">コマンドがありません</p>
                <p className="text-xs mt-1">QRコードをスキャンしてコマンドを追加</p>
            </div>
        )
    }

    // ルートを選択するボタン
    const isRootActive = activePath.length === 0

    return (
        <div className={`space-y-2 ${className}`}>
            {/* ヘッダー */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                    コマンドスタック
                </h3>
                <div className="flex gap-2">
                    {/* ルート選択ボタン */}
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
                onSelectPath={setActivePath}
                onUpdateLoop={updateLoopCount}
                onRemove={removeCommand}
                labels={COMMAND_LABELS}
                disabled={disabled}
                showRemoveButton={showRemoveButton}
            />
        </div>
    )
}

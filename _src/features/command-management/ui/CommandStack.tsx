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
 * コマンドスタック表示コンポーネント
 * 現在のコマンドスタック一覧を表示
 */
export function CommandStack({ 
    className = '',
    showRemoveButton = true,
    disabled = false
}: CommandStackProps) {
    const { commands, removeCommand, clearCommands, COMMAND_LABELS } = useCommandBuilder()

    if (commands.length === 0) {
        return (
            <div className={`text-center text-muted-foreground py-8 ${className}`}>
                <p className="text-sm">コマンドがありません</p>
                <p className="text-xs mt-1">QRコードをスキャンしてコマンドを追加</p>
            </div>
        )
    }

    return (
        <div className={`space-y-2 ${className}`}>
            {/* ヘッダー */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                    コマンドスタック ({commands.length})
                </h3>
                <button
                    type="button"
                    onClick={() => clearCommands()}
                    disabled={disabled}
                    className="text-xs text-neon-red hover:text-neon-red/80 disabled:opacity-50"
                >
                    すべて削除
                </button>
            </div>
            
            {/* コマンド一覧 */}
            <div className="space-y-1">
                {commands.map((type, index) => (
                    <CommandCard
                        key={`command-${index}-${type}`}
                        type={type}
                        label={COMMAND_LABELS[type]}
                        icon={COMMAND_ICONS[type]}
                        colorClass={COMMAND_COLORS[type]}
                        onRemove={showRemoveButton ? () => removeCommand(index) : undefined}
                        disabled={disabled}
                    />
                ))}
            </div>
        </div>
    )
}

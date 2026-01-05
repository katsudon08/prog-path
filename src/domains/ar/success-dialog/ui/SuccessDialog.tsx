import { Trophy } from "lucide-react"

interface SuccessDialogProps {
    moveCount: number
}

/**
 * ゴール達成時に表示される成功ダイアログ
 * features.md: success-dialog
 */
export function SuccessDialog({ moveCount }: SuccessDialogProps) {
    return (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="max-w-2xl w-full mx-4 animate-bounce-in rounded-lg border-2 border-neon-green bg-neon-green/10 px-8 py-6 text-center shadow-lg shadow-neon-green/20 backdrop-blur-md pointer-events-auto">
                <Trophy className="mx-auto mb-3 h-12 w-12 text-neon-green" />
                <p className="text-2xl font-bold text-neon-green">ゴール達成！</p>
                <p className="text-base text-neon-green/80">{moveCount}回の移動でクリア</p>
            </div>
        </div>
    )
}

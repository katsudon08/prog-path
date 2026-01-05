import { AlertTriangle } from "lucide-react"

interface FailureDialogProps {
    errorMessage: string
}

/**
 * 失敗時に表示されるエラーダイアログ
 * features.md: failure-dialog
 */
export function FailureDialog({ errorMessage }: FailureDialogProps) {
    return (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="max-w-2xl w-full mx-4 animate-shake rounded-lg border-2 border-neon-red bg-neon-red/10 px-8 py-6 text-center shadow-lg shadow-neon-red/20 backdrop-blur-md pointer-events-auto">
                <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-neon-red" />
                <p className="text-2xl font-bold text-neon-red">失敗！</p>
                <p className="text-base text-neon-red/80">{errorMessage}</p>
            </div>
        </div>
    )
}

"use client"

import { X, CheckCircle, AlertCircle, Info } from "lucide-react"
import { useToast } from "./useToast"
import type { ActionResultType } from "../../model"

/**
 * トースト通知コンテナ
 * 画面右下に通知を表示
 */
export function ToastContainer() {
    const { toasts, removeToast } = useToast()

    if (toasts.length === 0) return null

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
            {toasts.map((toast) => (
                <ToastItem
                    key={toast.id}
                    id={toast.id}
                    type={toast.type}
                    message={toast.message}
                    errors={toast.errors}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    )
}

interface ToastItemProps {
    id: string
    type: ActionResultType
    message: string
    errors?: string[]
    onClose: () => void
}

function ToastItem({ type, message, errors, onClose }: ToastItemProps) {
    const styles = getToastStyles(type)
    const Icon = styles.icon

    return (
        <div
            className={`
                flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg
                bg-space-dark backdrop-blur-sm
                animate-in slide-in-from-right-5 fade-in duration-300
                ${styles.borderColor}
            `}
        >
            <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${styles.iconColor}`} />
            <div className="flex-1 min-w-0">
                {/* メッセージ（複数行対応） */}
                <p className="text-sm text-foreground whitespace-pre-line">
                    {message}
                </p>
                {/* エラー詳細リスト */}
                {errors && errors.length > 0 && (
                    <ul className="mt-2 text-xs text-muted-foreground list-disc list-inside">
                        {errors.map((error, index) => (
                            <li key={index}>{error}</li>
                        ))}
                    </ul>
                )}
            </div>
            <button
                onClick={onClose}
                className="shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
            >
                <X className="h-4 w-4 text-muted-foreground" />
            </button>
        </div>
    )
}

function getToastStyles(type: ActionResultType) {
    switch (type) {
        case 'success':
            return {
                borderColor: 'border-neon-green/50',
                iconColor: 'text-neon-green',
                icon: CheckCircle,
            }
        case 'error':
            return {
                borderColor: 'border-red-500/50',
                iconColor: 'text-red-500',
                icon: AlertCircle,
            }
        case 'info':
        default:
            return {
                borderColor: 'border-neon-blue/50',
                iconColor: 'text-neon-blue',
                icon: Info,
            }
    }
}

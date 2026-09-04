/**
 * アクション結果の通知タイプ
 */
export type ActionResultType = 'success' | 'error' | 'info'

/**
 * アクション結果（処理結果の統一型）
 * entities/features層で発生する処理結果を統一的に扱う
 */
export interface ActionResult {
    /** ロジック判定用（成功/失敗） */
    success: boolean
    /** UI表示スタイル用 */
    type: ActionResultType
    /** 通知用メッセージ */
    message: string
    /** 詳細なエラーリスト（オプション） */
    errors?: string[]
    /** 待機時間（ミリ秒、オプション） */
    wait?: number
}

/**
 * 成功結果を作成するヘルパー
 */
export function createSuccessResult(message: string, wait?: number): ActionResult {
    return {
        success: true,
        type: 'success',
        message,
        wait,
    }
}

/**
 * エラー結果を作成するヘルパー
 */
/**
 * エラー結果を作成するヘルパー
 */
export function createErrorResult(message: string, errors?: string[], wait?: number): ActionResult {
    return {
        success: false,
        type: 'error',
        message,
        errors,
        wait,
    }
}

/**
 * 情報結果を作成するヘルパー
 */
export function createInfoResult(message: string): ActionResult {
    return {
        success: true,
        type: 'info',
        message,
    }
}

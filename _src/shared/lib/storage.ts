/**
 * 汎用LocalStorageラッパー
 * 型安全なget/set/clear関数を提供
 */

/**
 * LocalStorageから値を取得
 * @param key ストレージキー
 * @returns パース済みの値、または取得に失敗した場合はnull
 */
export function getItem<T>(key: string): T | null {
    try {
        const data = localStorage.getItem(key)
        if (!data) {
            return null
        }
        return JSON.parse(data) as T
    } catch {
        console.error(`Failed to load from storage: ${key}`)
        return null
    }
}

/**
 * LocalStorageに値を保存
 * @param key ストレージキー
 * @param value 保存する値
 */
export function setItem<T>(key: string, value: T): void {
    try {
        localStorage.setItem(key, JSON.stringify(value))
    } catch {
        console.error(`Failed to save to storage: ${key}`)
    }
}

/**
 * LocalStorageから値を削除
 * @param key ストレージキー
 */
export function removeItem(key: string): void {
    try {
        localStorage.removeItem(key)
    } catch {
        console.error(`Failed to remove from storage: ${key}`)
    }
}

/**
 * カテゴリ情報
 */
export interface Category {
    id: string
    name: string
    order: number
}

/**
 * フォルダ関連の設定
 */
export interface FolderSettings {
    customCategories: string[]
    expandedCategories: string[]
}

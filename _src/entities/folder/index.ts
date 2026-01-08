// entities/folder public API (boundary)
// 内部構造（model, lib, ui）は隠蔽し、必要な公開APIのみをエクスポート

// Types
export type { Category, FolderSettings } from './model/types'

// Store
export { useCategoryStore } from './model/store'

// Storage utilities
export {
    loadCategoriesFromStorage,
    saveCategoriesToStorage,
    loadExpandedCategoriesFromStorage,
    saveExpandedCategoriesToStorage,
    loadFolderSettings,
    saveFolderSettings
} from './lib/storage'

// UI Components
export { FolderCard } from './ui/FolderCard'

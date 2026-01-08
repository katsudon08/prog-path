// entities/folder public API (boundary)
// 内部構造（model, lib, ui）は隠蔽し、必要な公開APIのみをエクスポート

// Types
export type { FolderSettings } from './model/types'

// Constants
export { DEFAULT_FOLDER_NAME } from './model/constants'

// Store
export { useFolderStore } from './model/store'

// Storage utilities
export {
    loadFoldersFromStorage,
    saveFoldersToStorage,
    loadExpandedFoldersFromStorage,
    saveExpandedFoldersToStorage,
    loadFolderSettings,
    saveFolderSettings
} from './lib/storage'

// UI Components
export { FolderCard } from './ui/FolderCard'

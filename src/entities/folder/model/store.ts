import { create } from 'zustand'

/**
 * フォルダ状態管理ストアのインターフェース
 */
interface FolderStore {
    // State
    folders: string[]
    expandedFolders: Set<string>

    // Actions
    setFolders: (folders: string[]) => void
    addFolder: (folder: string) => void
    removeFolder: (folder: string) => void
    toggleFolderExpanded: (folder: string) => void
    setExpandedFolders: (folders: Set<string>) => void

    // Utility
    isFolderExpanded: (folder: string) => boolean
}

/**
 * フォルダ状態管理Zustandストア
 */
export const useFolderStore = create<FolderStore>((set, get) => ({
    // Initial State
    folders: [],
    expandedFolders: new Set<string>(),

    // Actions
    setFolders: (folders) => set({ folders }),

    addFolder: (folder) => set((state) => ({
        folders: [...state.folders, folder],
        expandedFolders: new Set(state.expandedFolders).add(folder)
    })),

    removeFolder: (folder) => set((state) => {
        const next = new Set(state.expandedFolders)
        next.delete(folder)
        return {
            folders: state.folders.filter(f => f !== folder),
            expandedFolders: next
        }
    }),

    toggleFolderExpanded: (folder) => set((state) => {
        const next = new Set(state.expandedFolders)
        if (next.has(folder)) {
            next.delete(folder)
        } else {
            next.add(folder)
        }
        return { expandedFolders: next }
    }),

    setExpandedFolders: (folders) => set({ expandedFolders: folders }),

    // Utility
    isFolderExpanded: (folder) => get().expandedFolders.has(folder)
}))

import { create } from 'zustand'

/**
 * カテゴリ状態管理ストアのインターフェース
 */
interface CategoryStore {
    // State
    customCategories: string[]
    expandedCategories: Set<string>

    // Actions
    setCustomCategories: (categories: string[]) => void
    addCategory: (category: string) => void
    removeCategory: (category: string) => void
    toggleCategoryExpanded: (category: string) => void
    setExpandedCategories: (categories: Set<string>) => void

    // Utility
    isCategoryExpanded: (category: string) => boolean
}

/**
 * カテゴリ状態管理Zustandストア
 */
export const useCategoryStore = create<CategoryStore>((set, get) => ({
    // Initial State
    customCategories: [],
    expandedCategories: new Set<string>(),

    // Actions
    setCustomCategories: (categories) => set({ customCategories: categories }),

    addCategory: (category) => set((state) => ({
        customCategories: [...state.customCategories, category],
        expandedCategories: new Set(state.expandedCategories).add(category)
    })),

    removeCategory: (category) => set((state) => {
        const next = new Set(state.expandedCategories)
        next.delete(category)
        return {
            customCategories: state.customCategories.filter(c => c !== category),
            expandedCategories: next
        }
    }),

    toggleCategoryExpanded: (category) => set((state) => {
        const next = new Set(state.expandedCategories)
        if (next.has(category)) {
            next.delete(category)
        } else {
            next.add(category)
        }
        return { expandedCategories: next }
    }),

    setExpandedCategories: (categories) => set({ expandedCategories: categories }),

    // Utility
    isCategoryExpanded: (category) => get().expandedCategories.has(category)
}))

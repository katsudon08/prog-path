import { create } from 'zustand';
import type { CommandHistoryRepository } from './repository';

type CommandHistoryRepositoryStore = {
    repository: CommandHistoryRepository | null;
    setRepository: (repo: CommandHistoryRepository) => void;
};

export const useCommandHistoryRepositoryStore =
    create<CommandHistoryRepositoryStore>((set) => ({
        repository: null,
        setRepository: (repo) => set({ repository: repo }),
    }));

import { create } from 'zustand';
import type { MazeRepository } from './repository';

type MazeRepositoryStore = {
    repository: MazeRepository | null;
    setRepository: (repo: MazeRepository) => void;
};

export const useMazeRepositoryStore = create<MazeRepositoryStore>((set) => ({
    repository: null,
    setRepository: (repo) => set({ repository: repo }),
}));

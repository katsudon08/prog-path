import { useMazeRepositoryStore } from './maze-repository-store';
import type { MazeRepository } from './repository';

export const useMazeRepository = (): MazeRepository => {
    const repo = useMazeRepositoryStore((state) => state.repository);
    if (!repo) {
        throw new Error(
            'MazeRepository not initialized. app/db.ts を確認してください。',
        );
    }
    return repo;
};

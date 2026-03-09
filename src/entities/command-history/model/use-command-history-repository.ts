import { useCommandHistoryRepositoryStore } from './command-history-repository-store';
import type { CommandHistoryRepository } from './repository';

export const useCommandHistoryRepository =
    (): CommandHistoryRepository => {
        const repo = useCommandHistoryRepositoryStore(
            (state) => state.repository,
        );
        if (!repo) {
            throw new Error(
                'CommandHistoryRepository not initialized. app/db.ts を確認してください。',
            );
        }
        return repo;
    };

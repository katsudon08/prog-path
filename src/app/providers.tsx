import type { ReactNode } from 'react';

type AppProviderProps = {
    children: ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
    // 将来的に ErrorBoundary, ThemeProvider 等を追加する拡張ポイント
    return <>{children}</>;
};

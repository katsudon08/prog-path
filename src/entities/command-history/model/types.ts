export type CommandHistory = {
    id?: number;
    mazeId: number;
    commands: string; // コマンドツリーの JSON 文字列
    result: boolean;
    createdAt: number; // Date.now()
};

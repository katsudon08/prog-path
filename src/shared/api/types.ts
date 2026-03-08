export type Maze = {
    id?: number;
    name: string;
    data: string; // RLE圧縮済み迷路データ（M:プレフィックス付き）
    createdAt: Date;
};

export type CommandHistoryResult = 'success' | 'failure';

export type CommandHistory = {
    id?: number;
    mazeId: number;
    commands: string; // コマンドツリーの JSON 文字列
    result: CommandHistoryResult;
    createdAt: Date;
};

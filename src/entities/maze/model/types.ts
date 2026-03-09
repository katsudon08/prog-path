export type Maze = {
    id?: number;
    name: string;
    data: string; // RLE圧縮済み迷路データ（M:プレフィックス付き）
    createdAt: number; // Date.now()
};

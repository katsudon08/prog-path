"use client";

import { FolderList } from "@domains/home/folder-list";
import { useMazeList } from "../hooks";

/**
 * 迷路リスト
 * maze-dataを一覧表示する迷路リスト
 * 内部でFolderListを使用してフォルダ構造を表示
 */
export function MazeList() {
    const {
        data,
        onSelectMaze,
        onDeleteMaze,
        categoryHandlers,
        renameState,
        dndHandlers,
    } = useMazeList();

    return (
        <FolderList
            data={data}
            onSelectMaze={onSelectMaze}
            onDeleteMaze={onDeleteMaze}
            categoryHandlers={categoryHandlers}
            renameState={renameState}
            dndHandlers={dndHandlers}
        />
    );
}

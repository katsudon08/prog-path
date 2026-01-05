"use client"

/**
 * 迷路編集ドメインのページコンポーネント
 * App Routerのpage.tsxからexportされるエントリポイント
 */
import { MazeEditorWidget } from "./editor/ui/MazeEditorWidget"

export function MazePage() {
    return <MazeEditorWidget />
}

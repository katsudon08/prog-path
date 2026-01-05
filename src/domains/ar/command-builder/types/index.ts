// domains/ar/command-builder/types public API
import type { Command } from "@/src/domains/ar/robot-3d/types"

/**
 * 挿入位置
 */
export interface InsertionPoint {
    parentIndex: number | null
    childIndex: number
}

/**
 * コマンドビルダーの状態と操作
 */
export interface UseCommandBuilderReturn {
    /** コマンドリスト */
    commands: Command[]
    /** 挿入位置 */
    insertionPoint: InsertionPoint
    /** ループ構築中フラグ */
    isBuildingLoop: boolean
    /** 構築中のloopコマンドのインデックス */
    buildingLoopIndex: number | null
    /** 一時的なloopコマンドデータ */
    tempLoopCommand: Command | null
    /** ループ回数入力文字列 */
    loopInputString: string
    /** ループポップアップ表示フラグ */
    loopPopupOpen: boolean
    /** コマンドを追加 */
    addCommand: (command: Command) => void
    /** コマンドを削除 */
    removeCommand: (index: number) => void
    /** 子コマンドを削除 */
    removeChildCommand: (parentIndex: number, childIndex: number) => void
    /** コマンドを更新 */
    updateCommand: (index: number, command: Command) => void
    /** 挿入位置を設定 */
    setInsertionPoint: (point: InsertionPoint) => void
    /** ループ構築を開始 */
    startLoopBuilding: (command: Command) => void
    /** ループ構築を確定 */
    confirmLoopBuilding: () => void
    /** ループ回数を変更 */
    setLoopInputString: (value: string) => void
    /** ループポップアップを閉じる */
    closeLoopPopup: () => void
    /** ループ構築を終了 */
    endLoopBuilding: () => void
    /** コマンドをリセット */
    resetCommands: () => void
    /** ループ構築中に子コマンドを追加 */
    addChildToLoop: (command: Command) => void
    /** Refs for stable callbacks */
    isBuildingLoopRef: React.MutableRefObject<boolean>
    buildingLoopIndexRef: React.MutableRefObject<number | null>
}

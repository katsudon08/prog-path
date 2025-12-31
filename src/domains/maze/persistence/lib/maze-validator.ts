import type { TileType } from "@/src/entities/maze"

export interface MazeValidationResult {
    valid: boolean
    errorMessage?: string
}

/**
 * 迷路保存前のバリデーション
 * スタート・ゴールが各1つずつ存在するか検証
 */
export function validateMazeForSave(layers: TileType[][][]): MazeValidationResult {
    // 全階層を結合してスタートとゴールの数をチェック
    const allTiles = layers.flat(2)
    const startCount = allTiles.filter((tile) => tile === "start").length
    const goalCount = allTiles.filter((tile) => tile === "goal").length

    if (startCount !== 1) {
        return {
            valid: false,
            errorMessage: startCount === 0
                ? "スタートタイルを1つ配置してください。"
                : "スタートタイルは1つだけ配置してください。（全階層合計）"
        }
    }

    if (goalCount !== 1) {
        return {
            valid: false,
            errorMessage: goalCount === 0
                ? "ゴールタイルを1つ配置してください。"
                : "ゴールタイルは1つだけ配置してください。（全階層合計）"
        }
    }

    return { valid: true }
}

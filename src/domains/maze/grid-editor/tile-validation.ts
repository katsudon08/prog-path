import type { TileType } from "@/src/domains/maze/maze-data/lib/types"

/**
 * 無効な配置先となるタイルタイプ
 */
const INVALID_DESTINATION_TILES: TileType[] = ["wall", "hole", "teleportUp", "teleportDown"]

/**
 * 指定のタイルが無効な移動先かどうか判定
 */
export function isInvalidDestination(type: TileType): boolean {
    return INVALID_DESTINATION_TILES.includes(type)
}

export interface TileValidationResult {
    valid: boolean
    errorMessage?: string
}

/**
 * テレポートタイル配置時のバリデーション
 */
export function validateTeleportPlacement(
    selectedTile: TileType,
    row: number,
    col: number,
    currentLayer: number,
    layers: TileType[][][]
): TileValidationResult {
    // 上へテレポートの配置検証
    if (selectedTile === "teleportUp") {
        if (currentLayer >= layers.length - 1) {
            return { valid: false, errorMessage: "上の階層が存在しません。階層を追加してください。" }
        }
        const upperTile = layers[currentLayer + 1][row][col]
        if (isInvalidDestination(upperTile)) {
            return { valid: false, errorMessage: "真上のマスに壁や穴、テレポートがあるため、上へのテレポートは設置できません。" }
        }
    }

    // 下へテレポートの配置検証
    if (selectedTile === "teleportDown") {
        if (currentLayer <= 0) {
            return { valid: false, errorMessage: "下の階層が存在しません。" }
        }
        const lowerTile = layers[currentLayer - 1][row][col]
        if (isInvalidDestination(lowerTile)) {
            return { valid: false, errorMessage: "真下のマスに壁や穴、テレポートがあるため、下へのテレポートは設置できません。" }
        }
    }

    return { valid: true }
}

/**
 * 他階層からのテレポート先として使用されていないか検証
 */
export function validateNotTeleportDestination(
    selectedTile: TileType,
    row: number,
    col: number,
    currentLayer: number,
    layers: TileType[][][]
): TileValidationResult {
    // 壁、穴、テレポートを置く場合のみチェック
    if (!isInvalidDestination(selectedTile)) {
        return { valid: true }
    }

    // 下からのテレポート先になっていないか
    if (currentLayer > 0) {
        const lowerTile = layers[currentLayer - 1][row][col]
        if (lowerTile === "teleportUp") {
            return { valid: false, errorMessage: "下の階層に上へのテレポートがあるため、この場所には設置できません。" }
        }
    }

    // 上からのテレポート先になっていないか
    if (currentLayer < layers.length - 1) {
        const upperTile = layers[currentLayer + 1][row][col]
        if (upperTile === "teleportDown") {
            return { valid: false, errorMessage: "上の階層に下へのテレポートがあるため、この場所には設置できません。" }
        }
    }

    return { valid: true }
}

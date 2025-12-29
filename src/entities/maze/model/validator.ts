import type { MazeData, TileType } from './types'

/**
 * バリデーション結果
 */
export interface ValidationResult {
    valid: boolean
    errors: string[]
}

/**
 * 迷路の整合性をバリデーション
 */
export function validateMaze(maze: MazeData): ValidationResult {
    const errors: string[] = []
    const allTiles = maze.layers.flat(2)

    const startCount = allTiles.filter(t => t === 'start').length
    const goalCount = allTiles.filter(t => t === 'goal').length

    if (startCount === 0) {
        errors.push('スタートタイルを1つ配置してください')
    } else if (startCount > 1) {
        errors.push('スタートタイルは1つだけ配置してください（全階層合計）')
    }

    if (goalCount === 0) {
        errors.push('ゴールタイルを1つ配置してください')
    } else if (goalCount > 1) {
        errors.push('ゴールタイルは1つだけ配置してください（全階層合計）')
    }

    return { valid: errors.length === 0, errors }
}

/**
 * テレポート配置のバリデーション
 */
export function validateTeleportPlacement(
    layers: TileType[][][],
    currentLayer: number,
    row: number,
    col: number,
    tileType: TileType
): { valid: boolean; error?: string } {
    const invalidDestinations: TileType[] = ["wall", "hole", "teleportUp", "teleportDown"]

    if (tileType === "teleportUp") {
        if (currentLayer >= layers.length - 1) {
            return { valid: false, error: "上の階層が存在しません。階層を追加してください。" }
        }
        const upperTile = layers[currentLayer + 1][row][col]
        if (invalidDestinations.includes(upperTile)) {
            return { valid: false, error: "真上のマスに壁や穴、テレポートがあるため、上へのテレポートは設置できません。" }
        }
    }

    if (tileType === "teleportDown") {
        if (currentLayer <= 0) {
            return { valid: false, error: "下の階層が存在しません。" }
        }
        const lowerTile = layers[currentLayer - 1][row][col]
        if (invalidDestinations.includes(lowerTile)) {
            return { valid: false, error: "真下のマスに壁や穴、テレポートがあるため、下へのテレポートは設置できません。" }
        }
    }

    // 壁、穴、テレポートを置く場合、他の階層からのテレポート先になっていないかチェック
    if (invalidDestinations.includes(tileType)) {
        if (currentLayer > 0) {
            const lowerTile = layers[currentLayer - 1][row][col]
            if (lowerTile === "teleportUp") {
                return { valid: false, error: "下の階層に上へのテレポートがあるため、この場所には設置できません。" }
            }
        }
        if (currentLayer < layers.length - 1) {
            const upperTile = layers[currentLayer + 1][row][col]
            if (upperTile === "teleportDown") {
                return { valid: false, error: "上の階層に下へのテレポートがあるため、この場所には設置できません。" }
            }
        }
    }

    return { valid: true }
}

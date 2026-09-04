import type { MazeData, TileType } from '../model/types'
import type { ActionResult } from '@/legacy/shared/model'

/**
 * 迷路の整合性をバリデーション
 * @returns ActionResult形式の結果
 */
export function validateMaze(maze: MazeData): ActionResult {
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

    if (errors.length > 0) {
        return {
            success: false,
            type: 'error',
            message: errors.join('\n'),
            errors,
        }
    }

    return {
        success: true,
        type: 'success',
        message: 'バリデーションに成功しました',
    }
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
): ActionResult {
    const invalidDestinations: TileType[] = ["wall", "hole", "teleportUp", "teleportDown"]

    if (tileType === "teleportUp") {
        if (currentLayer >= layers.length - 1) {
            return {
                success: false,
                type: 'error',
                message: "上の階層が存在しません。階層を追加してください。",
            }
        }
        const upperTile = layers[currentLayer + 1][row][col]
        if (invalidDestinations.includes(upperTile)) {
            return {
                success: false,
                type: 'error',
                message: "真上のマスに壁や穴、テレポートがあるため、上へのテレポートは設置できません。",
            }
        }
    }

    if (tileType === "teleportDown") {
        if (currentLayer <= 0) {
            return {
                success: false,
                type: 'error',
                message: "下の階層が存在しません。",
            }
        }
        const lowerTile = layers[currentLayer - 1][row][col]
        if (invalidDestinations.includes(lowerTile)) {
            return {
                success: false,
                type: 'error',
                message: "真下のマスに壁や穴、テレポートがあるため、下へのテレポートは設置できません。",
            }
        }
    }

    // 壁、穴、テレポートを置く場合、他の階層からのテレポート先になっていないかチェック
    if (invalidDestinations.includes(tileType)) {
        if (currentLayer > 0) {
            const lowerTile = layers[currentLayer - 1][row][col]
            if (lowerTile === "teleportUp") {
                return {
                    success: false,
                    type: 'error',
                    message: "下の階層に上へのテレポートがあるため、この場所には設置できません。",
                }
            }
        }
        if (currentLayer < layers.length - 1) {
            const upperTile = layers[currentLayer + 1][row][col]
            if (upperTile === "teleportDown") {
                return {
                    success: false,
                    type: 'error',
                    message: "上の階層に下へのテレポートがあるため、この場所には設置できません。",
                }
            }
        }
    }

    return {
        success: true,
        type: 'success',
        message: 'テレポート配置可能です',
    }
}

/**
 * データがMazeData型かどうかを判定する型ガード
 */
export function isMazeData(data: any): data is MazeData {
    return (
        typeof data === 'object' &&
        data !== null &&
        typeof data.id === 'string' &&
        typeof data.name === 'string' &&
        // size, layers などの必須プロパティチェック
        typeof data.size === 'number' &&
        Array.isArray(data.layers)
    )
}

/**
 * データがMazeData配列かどうかを判定する型ガード
 */
export function isMazeDataArray(data: any): data is MazeData[] {
    return Array.isArray(data) && data.every(isMazeData)
}

import type { MazeData, TileType } from '../../entities/maze'

const TILE_MAP: Record<TileType, string> = {
    wall: 'w',
    floor: 'f',
    hole: 'h',
    start: 's',
    goal: 'g',
    teleportUp: 'u',
    teleportDown: 'd',
    key: 'k',
}

const REVERSE_TILE_MAP: Record<string, TileType> = Object.entries(TILE_MAP).reduce(
    (acc, [key, value]) => ({ ...acc, [value]: key as TileType }),
    {} as Record<string, TileType>
)

/**
 * 迷路データを圧縮文字列に変換
 */
function compressMaze(maze: MazeData): string {
    const layersStr = maze.layers.map(layer => {
        return layer.map(row => {
            let rle = ''
            let count = 0
            let currentChar = ''

            for (const tile of row) {
                const char = TILE_MAP[tile] || 'f' // defaut to floor
                if (char === currentChar) {
                    count++
                } else {
                    if (currentChar) {
                        rle += currentChar + (count > 1 ? count : '')
                    }
                    currentChar = char
                    count = 1
                }
            }
            if (currentChar) {
                rle += currentChar + (count > 1 ? count : '')
            }
            return rle
        }).join('^') // 行の区切り
    }).join('|') // レイヤーの区切り

    // 配列としてシリアライズ: [version, id, name, size, layers, folder?]
    const data = [2, maze.id, maze.name, maze.size, layersStr, maze.folder || '']
    return JSON.stringify(data)
}

/**
 * 圧縮文字列から迷路データを復元
 */
function decompressMaze(jsonStr: string): MazeData | null {
    try {
        const data = JSON.parse(jsonStr)
        if (!Array.isArray(data) || data[0] !== 2) return null

        const [version, id, name, size, layersStr, folder] = data

        const layers: TileType[][][] = (layersStr as string).split('|').map(layerStr => {
            return layerStr.split('^').map(rowStr => {
                const row: TileType[] = []
                let i = 0
                while (i < rowStr.length) {
                    const char = rowStr[i]
                    i++
                    let countStr = ''
                    while (i < rowStr.length && /\d/.test(rowStr[i])) {
                        countStr += rowStr[i]
                        i++
                    }
                    const count = countStr ? parseInt(countStr) : 1
                    const tile = REVERSE_TILE_MAP[char] || 'floor'
                    for (let k = 0; k < count; k++) {
                        row.push(tile)
                    }
                }
                return row
            })
        })

        return {
            id,
            name,
            layers,
            size,
            folder: folder || undefined,
            // currentLayerは保存されないので0とする
            currentLayer: 0
        }
    } catch (e) {
        console.error("Decompression failed", e)
        return null
    }
}

/**
 * 迷路データをBase64文字列にエンコード
 * @param maze 迷路データ
 * @returns "maze:"プレフィックス付きのBase64文字列
 */
export function encodeMazeToQR(maze: MazeData): string {
    try {
        // v2形式 (圧縮) だがプレフィックスは maze: を使用
        const compressed = compressMaze(maze)
        const base64 = btoa(unescape(encodeURIComponent(compressed)))
        return `maze:${base64}`
    } catch (error) {

        console.error("Failed to encode maze:", error)
        throw new Error("迷路のエンコードに失敗しました")
    }
}

/**
 * QRコードの文字列から迷路データをデコード
 * @param qrData QRコードから読み取った文字列
 * @returns デコードされた迷路データ、失敗時はnull
 */
export function decodeMazeFromQR(qrData: string): MazeData | null {
    try {
        if (!isMazeQRCode(qrData)) {
            return null
        }

        const base64 = qrData.substring(5) // "maze:"を削除
        const json = decodeURIComponent(escape(atob(base64))) // UTF-8対応
        const data = JSON.parse(json)

        // データ形式による分岐
        // 配列でかつ最初の要素が数値の2なら圧縮形式
        if (Array.isArray(data) && data[0] === 2) {
             // decompressMazeは文字列を受け取る仕様なので、再度文字列化して渡すか、
             // decompressMazeをオブジェクトを受け取るようにリファクタリングする方が綺麗だが
             // ここでは既存のdecompressMaze (JSON.parseを含む) を活かすため、
             // 少し非効率だが文字列のまま判定するか、decompressMazeを修正する。
             // 今回は decompressMaze が JSON.parse から始める実装なので、
             // パース済みデータ判定ロジックをここに書く。
             return decompressMaze(json)
        }
        
        // オブジェクトならレガシー形式
        const maze = data as MazeData

        // 基本的なバリデーション
        if (!maze.id || !maze.name || !maze.layers || !maze.size) {
            console.error("Invalid maze data structure")
            return null
        }

        return maze
    } catch (error) {
        console.error("Failed to decode maze:", error)
        return null
    }
}

/**
 * QRコードデータが迷路データかどうかを判定
 * @param qrData QRコードから読み取った文字列
 * @returns 迷路データの場合true
 */
export function isMazeQRCode(qrData: string): boolean {
    return qrData.startsWith("maze:")
}

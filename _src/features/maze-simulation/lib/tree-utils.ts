import type { Command } from '@/_src/entities/command'

/**
 * getNextPathの戻り値
 */
export interface NextPathResult {
    /** 次に実行すべきパス、またはnull（終了） */
    nextPath: number[] | null
    /** リセットすべきループのパスキー（ループ脱出時） */
    shouldResetPath?: string
}

/**
 * パスからコマンドを取得
 */
export function getCommandByPath(commands: Command[], path: number[]): Command | undefined {
    if (path.length === 0) return undefined
    
    let current = commands
    for (let i = 0; i < path.length; i++) {
        const index = path[i]
        if (!current[index]) return undefined
        if (i === path.length - 1) return current[index]
        current = current[index].children || []
    }
    return undefined
}

/**
 * 親コマンドを取得（ループ判定用）
 */
export function getParentCommand(commands: Command[], path: number[]): Command | undefined {
    if (path.length <= 1) return undefined
    return getCommandByPath(commands, path.slice(0, -1))
}

/**
 * 兄弟コマンドの配列を取得
 */
function getSiblings(commands: Command[], path: number[]): Command[] {
    if (path.length === 0) return []
    if (path.length === 1) return commands
    const parent = getCommandByPath(commands, path.slice(0, -1))
    return parent?.children || []
}

/**
 * 次に実行すべきパスを計算
 * 
 * @param commands コマンドツリー
 * @param currentPath 現在実行中のパス
 * @param loopCounters ループカウンタ（キー: path.join(',')）
 * @param incrementLoopCounter ループカウンタをインクリメントする関数
 * @returns 次のパス情報
 */
export function getNextPath(
    commands: Command[],
    currentPath: number[],
    loopCounters: Record<string, number>,
    incrementLoopCounter: (pathKey: string) => void
): NextPathResult {
    // 空パスの場合は最初のコマンドへ
    if (currentPath.length === 0) {
        return { nextPath: commands.length > 0 ? [0] : null }
    }

    const currentCommand = getCommandByPath(commands, currentPath)
    if (!currentCommand) return { nextPath: null }

    // ループコマンドの場合: 子要素の先頭へ進む
    if (currentCommand.type === 'loop' && currentCommand.children && currentCommand.children.length > 0) {
        return { nextPath: [...currentPath, 0] }
    }

    // 次の兄弟を探す（再帰的に親へ遡る）
    return findNextSibling(commands, currentPath, loopCounters, incrementLoopCounter)
}

/**
 * 次の兄弟要素を再帰的に探す
 */
function findNextSibling(
    commands: Command[],
    path: number[],
    loopCounters: Record<string, number>,
    incrementLoopCounter: (pathKey: string) => void
): NextPathResult {
    if (path.length === 0) return { nextPath: null }

    const currentIndex = path[path.length - 1]
    const siblings = getSiblings(commands, path)

    // 次の兄弟がある場合
    if (currentIndex + 1 < siblings.length) {
        return { nextPath: [...path.slice(0, -1), currentIndex + 1] }
    }

    // 兄弟がいない場合、親へ遡る
    const parentPath = path.slice(0, -1)
    
    // ルートに到達した場合は終了
    if (parentPath.length === 0) {
        return { nextPath: null }
    }

    // 親がループの場合、ループ継続判定
    const parent = getCommandByPath(commands, parentPath)
    if (parent?.type === 'loop' && parent.loopCount) {
        const loopKey = parentPath.join(',')
        const currentCount = loopCounters[loopKey] || 0

        if (currentCount + 1 < parent.loopCount) {
            // ループ継続: カウンタをインクリメントしてループ先頭へ
            incrementLoopCounter(loopKey)
            return { nextPath: [...parentPath, 0] }
        }
        // ループ終了: このループをリセット対象としてマークし、親の次の兄弟へ
        const result = findNextSibling(commands, parentPath, loopCounters, incrementLoopCounter)
        return { ...result, shouldResetPath: loopKey }
    }

    // 親の次の兄弟を探す
    return findNextSibling(commands, parentPath, loopCounters, incrementLoopCounter)
}

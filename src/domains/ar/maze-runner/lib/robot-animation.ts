/**
 * アニメーション関連のユーティリティ
 */

import type { Command } from "@/src/domains/ar/robot-3d/types"

/**
 * コマンドタイプに応じたアニメーション時間を取得（ミリ秒）
 */
export function getAnimationDuration(command: Command, isTeleporting: boolean): number {
    if (isTeleporting) {
        return 1100
    }

    switch (command.type) {
        case 'turnRight':
        case 'turnLeft':
            return 300
        default:
            return 500
    }
}

/**
 * コマンド間の待機時間（ミリ秒）
 */
export const COMMAND_DELAY = 500

"use client"

import React, { useState } from 'react'
import { Plus, X } from 'lucide-react'

export interface FloatingAction {
  /** アクションのアイコン */
  icon: React.ReactNode
  /** アクションのラベル（ツールチップ用） */
  label: string
  /** クリック時のハンドラー */
  onClick: () => void
  /** ボタンのスタイルバリアント */
  variant?: 'default' | 'success' | 'danger' | 'info'
}

interface FloatingActionButtonProps {
  /** アクションボタンの配列 */
  actions: FloatingAction[]
  /** メインボタンのアイコン（オプション、デフォルトは+） */
  mainIcon?: React.ReactNode
  /** 閉じる時のアイコン（オプション、デフォルトはX） */
  closeIcon?: React.ReactNode
}

const variantStyles = {
  default: 'bg-neon-blue hover:bg-neon-blue/90',
  success: 'bg-neon-green hover:bg-neon-green/90 text-space-darker',
  danger: 'bg-red-500 hover:bg-red-600',
  info: 'bg-neon-cyan hover:bg-neon-cyan/90 text-space-darker',
}

/**
 * フローティングアクションボタン
 * 右下に固定表示され、クリックでリボルバー型メニューが展開
 */
export function FloatingActionButton({
  actions,
  mainIcon,
  closeIcon,
}: FloatingActionButtonProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)

  const handleActionClick = (action: FloatingAction) => {
    action.onClick()
    setIsOpen(false)
  }

  // リボルバー型配置の角度計算（1/4円＝90度範囲を常に維持）
  const getActionPosition = (index: number, total: number) => {
    // 1/4円（90度）の範囲で均等配置
    // -180度（真左）から -90度（真上）の範囲
    const startAngle = -180 // 開始角度（真左）
    const endAngle = -90    // 終了角度（真上）
    const angleRange = endAngle - startAngle // 90度
    
    // ボタン数に応じて角度を割り当て
    const angleStep = total > 1 ? angleRange / (total - 1) : 0
    const angle = startAngle + angleStep * index
    const radian = (angle * Math.PI) / 180
    
    // ボタン数が多い場合は半径を縮小して画面に収まるようにする
    const baseRadius = 70
    const radius = total > 4 ? baseRadius * (4 / total) : baseRadius

    return {
      x: Math.cos(radian) * radius,
      y: Math.sin(radian) * radius,
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* アクションボタン（リボルバー型展開） */}
      {actions.map((action, index) => {
        const pos = getActionPosition(index, actions.length)
        const variant = action.variant || 'default'

        return (
          <button
            key={action.label}
            onClick={() => handleActionClick(action)}
            className={`
              absolute bottom-0 right-0 w-12 h-12 rounded-full
              flex items-center justify-center shadow-lg
              transition-all duration-300 ease-out
              ${variantStyles[variant]}
              ${isOpen 
                ? 'opacity-100 scale-100' 
                : 'opacity-0 scale-0 pointer-events-none'
              }
            `}
            style={{
              transform: isOpen 
                ? `translate(${pos.x}px, ${pos.y}px)`
                : 'translate(0, 0)',
            }}
            title={action.label}
          >
            {action.icon}
          </button>
        )
      })}

      {/* メインボタン */}
      <button
        onClick={toggleMenu}
        className={`
          relative w-14 h-14 rounded-full
          flex items-center justify-center shadow-xl
          transition-all duration-300 ease-out
          ${isOpen 
            ? 'bg-space-dark border-2 border-neon-cyan rotate-45' 
            : 'bg-neon-cyan hover:bg-neon-cyan/90'
          }
        `}
      >
        {isOpen 
          ? (closeIcon || <X className="w-6 h-6 text-neon-cyan rotate-[-45deg]" />)
          : (mainIcon || <Plus className="w-6 h-6" />)
        }
      </button>

      {/* 背景オーバーレイ（メニュー展開時） */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[-1]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

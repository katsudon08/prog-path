/**
 * エディタコントロール
 * 迷路サイズと階層数の変更UI
 */

'use client';

import React from 'react';
import { Grid3X3, Layers } from 'lucide-react';

interface EditorControlsProps {
  /** 現在の迷路サイズ（N x N） */
  size: number;
  /** 現在の階層数 */
  layerCount: number;
  /** サイズ変更コールバック */
  onSizeChange: (size: number) => void;
  /** 階層数変更コールバック */
  onLayerCountChange: (count: number) => void;
  /** 最小サイズ */
  minSize?: number;
  /** 最大サイズ */
  maxSize?: number;
  /** 最小階層数 */
  minLayers?: number;
  /** 最大階層数 */
  maxLayers?: number;
  className?: string;
}

/**
 * エディタコントロール
 * 迷路サイズ（5x5〜10x10）と階層数（1〜5）を変更するUI
 */
export function EditorControls({
  size,
  layerCount,
  onSizeChange,
  onLayerCountChange,
  minSize = 5,
  maxSize = 10,
  minLayers = 1,
  maxLayers = 5,
  className = '',
}: EditorControlsProps): React.ReactElement {
  const sizeOptions = Array.from(
    { length: maxSize - minSize + 1 },
    (_, i) => minSize + i
  );

  const layerOptions = Array.from(
    { length: maxLayers - minLayers + 1 },
    (_, i) => minLayers + i
  );

  return (
    <div
      className={`flex flex-wrap items-center gap-4 p-3 rounded-lg bg-space-dark/50 border border-neon-blue/30 ${className}`}
    >
      {/* サイズ変更 */}
      <div className="flex items-center gap-2">
        <Grid3X3 className="w-4 h-4 text-neon-cyan" />
        <span className="text-sm text-muted-foreground">サイズ:</span>
        <select
          value={size}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          className="px-2 py-1 rounded bg-space-dark border border-neon-blue/30 text-foreground text-sm focus:border-neon-cyan focus:outline-none"
        >
          {sizeOptions.map((s) => (
            <option key={s} value={s}>
              {s} x {s}
            </option>
          ))}
        </select>
      </div>

      {/* 階層数変更 */}
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-neon-purple" />
        <span className="text-sm text-muted-foreground">階層:</span>
        <select
          value={layerCount}
          onChange={(e) => onLayerCountChange(Number(e.target.value))}
          className="px-2 py-1 rounded bg-space-dark border border-neon-blue/30 text-foreground text-sm focus:border-neon-cyan focus:outline-none"
        >
          {layerOptions.map((l) => (
            <option key={l} value={l}>
              {l}階
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

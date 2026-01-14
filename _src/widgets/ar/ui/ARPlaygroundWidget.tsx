/**
 * AR実行プレイグラウンドウィジェット
 * 3Dビュー、コマンドスタック、HUD、ダイアログを統合
 */

'use client';

import React from 'react';
import { Play, Square, RotateCcw, Home } from 'lucide-react';
import { CommandStack } from '@/_src/features/command-management/ui/CommandStack';
import { useSimulationStore } from '@/_src/features/maze-simulation/model/useSimulationStore';
import { useSimulationRunner } from '@/_src/features/maze-simulation/model/useSimulationRunner';
import { useMazeStore } from '@/_src/entities/maze';
import { useRouter } from 'next/navigation';

interface ARPlaygroundWidgetProps {
  /** 3Dビューを描画するコンポーネント/要素 */
  view3D: React.ReactNode;
  /** 迷路名 */
  mazeName?: string;
  className?: string;
}

export function ARPlaygroundWidget({
  view3D,
  mazeName,
  className = '',
}: ARPlaygroundWidgetProps): React.ReactElement {
  const router = useRouter();
  const { status, currentPath, error } = useSimulationStore();
  const { run, pause, reset } = useSimulationRunner();
  const { selectedMaze } = useMazeStore();

  const isRunning = status === 'running';
  const isFinished = status === 'finished' || status === 'error';

  const handleExecuteToggle = () => {
    if (isRunning) {
      pause();
    } else {
      run();
    }
  };

  const handleReset = () => {
    reset();
  };

  const handleHome = () => {
    reset();
    router.push('/');
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* ヘッダー */}
      <header className="flex items-center justify-between p-4 border-b border-neon-blue/30 bg-space-dark/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleHome}
            className="p-2 rounded-lg text-muted-foreground hover:text-neon-cyan hover:bg-neon-cyan/10 transition-colors"
            title="ホームに戻る"
          >
            <Home className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-neon-cyan">
            {mazeName || selectedMaze?.name || 'AR Mode'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={status === 'idle'}
            className="p-2 rounded-lg text-muted-foreground hover:text-neon-purple hover:bg-neon-purple/10 transition-colors disabled:opacity-50"
            title="リセット"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleExecuteToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isRunning
                ? 'bg-neon-red/20 text-neon-red hover:bg-neon-red/30'
                : 'bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30'
            }`}
          >
            {isRunning ? (
              <>
                <Square className="w-4 h-4" />
                <span>停止</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>実行</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="flex flex-1 overflow-hidden">
        {/* 3Dビュー */}
        <div className="flex-1 relative">
          {view3D}

          {/* エラー/完了オーバーレイ */}
          {isFinished && (
            <div className="absolute inset-0 flex items-center justify-center bg-space-dark/80 backdrop-blur-sm">
              <div className={`text-center p-6 rounded-xl border ${
                status === 'finished'
                  ? 'border-neon-green/50 bg-neon-green/10'
                  : 'border-neon-red/50 bg-neon-red/10'
              }`}>
                <p className={`text-lg font-bold ${
                  status === 'finished' ? 'text-neon-green' : 'text-neon-red'
                }`}>
                  {status === 'finished' ? 'ゴール到達！🎉' : error || 'エラー'}
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-4 px-4 py-2 rounded-lg bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30"
                >
                  リセット
                </button>
              </div>
            </div>
          )}
        </div>

        {/* サイドパネル（コマンドスタック） */}
        <aside className="w-72 border-l border-neon-blue/30 bg-space-dark/50 overflow-y-auto p-4">
          <CommandStack
            disabled={isRunning}
            executionPath={currentPath}
            showRemoveButton={!isRunning}
          />
        </aside>
      </div>
    </div>
  );
}

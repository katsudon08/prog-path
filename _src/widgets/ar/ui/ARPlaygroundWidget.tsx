/**
 * AR実行プレイグラウンドウィジェット
 * 3Dビュー、コマンドスタック、HUD、ダイアログを統合
 */

'use client';

import React, { useMemo } from 'react';
import { Play, Square, RotateCcw } from 'lucide-react';
import { CommandStack, useCommandStore } from '@/_src/features/command-management';
import { useSimulationStore } from '@/_src/features/maze-simulation/model/useSimulationStore';
import { useSimulationRunner } from '@/_src/features/maze-simulation/model/useSimulationRunner';
import { useMazeStore } from '@/_src/entities/maze';
import { FloatingActionButton, type FloatingAction, Navbar, ToastContainer, useToast } from '@/_src/shared/ui';

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
  const { status, currentPath, error } = useSimulationStore();
  const { run, pause, reset } = useSimulationRunner();
  const { selectedMaze } = useMazeStore();
  const commands = useCommandStore((state) => state.commands);
  const { addToast } = useToast();

  const isRunning = status === 'running';
  const isFinished = status === 'finished' || status === 'error';

  const handleExecuteToggle = () => {
    if (isRunning) {
      pause();
    } else {
      // コマンドが空のとき実行できない
      if (commands.length === 0) {
        addToast({ success: false, type: 'error', message: 'コマンドがありません。QRコードをスキャンしてコマンドを追加してください' });
        return;
      }
      run();
    }
  };

  const handleReset = () => {
    reset();
  };

  // FABアクション（リボルバー型メニュー用）
  const fabActions: FloatingAction[] = useMemo(() => [
    {
      icon: isRunning ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />,
      label: isRunning ? '停止' : '実行',
      variant: 'success' as const,
      onClick: handleExecuteToggle,
    },
    {
      icon: <RotateCcw className="w-5 h-5" />,
      label: 'リセット',
      variant: 'info' as const,
      onClick: handleReset,
    },
  ], [isRunning, handleExecuteToggle, handleReset]);

  return (
    <div className={`flex flex-col h-screen bg-space-darker ${className}`}>
      {/* Navbar */}
      <Navbar />

      {/* メインコンテンツ */}
      <div className="flex flex-1 min-h-0 p-6 gap-6 pt-24">
        {/* 3Dビュー（左側・固定高さ） */}
        <div className="flex-1 relative rounded-lg overflow-hidden">
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

        {/* サイドパネル（コマンドスタック・右側・固定高さ） */}
        <aside className="w-72 bg-space-dark/50 rounded-lg p-4">
          <CommandStack
            disabled={isRunning}
            executionPath={currentPath}
            showRemoveButton={!isRunning}
          />
        </aside>
      </div>

      {/* FAB: リボルバー型メニュー */}
      <FloatingActionButton actions={fabActions} />

      {/* トースト通知 */}
      <ToastContainer />
    </div>
  );
}

/**
 * AR実行プレイグラウンドウィジェット
 * 3Dビュー、コマンドスタック、HUD、ダイアログを統合
 */

'use client';

import React, { useMemo } from 'react';
import { Play, Square, RotateCcw } from 'lucide-react';
import { CommandStack, useCommandStore } from '@/src/features/command-management';
import { useSimulationStore } from '@/src/features/maze-simulation/model/useSimulationStore';
import { useSimulationRunner } from '@/src/features/maze-simulation/model/useSimulationRunner';
import { useMazeStore } from '@/src/entities/maze';
import { FloatingActionButton, type FloatingAction, Navbar, ToastContainer, useToast } from '@/src/shared/ui';
import { ARMinimap } from './ARMinimap';
import { useRobotStore } from '@/src/entities/robot';

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
  const { status, currentPath, forwardStepCount } = useSimulationStore();
  const { run, pause, reset } = useSimulationRunner();
  const { selectedMaze } = useMazeStore();
  const { robotState, animationState } = useRobotStore();
  const commands = useCommandStore((state) => state.commands);
  const { addToast } = useToast();

  const isRunning = status === 'running';
  const isFinished = status === 'finished' || status === 'error';

  const handleExecuteToggle = () => {
    if (isRunning) return;

    // コマンドが空のとき実行できない
    if (commands.length === 0) {
      addToast({ success: false, type: 'error', message: 'コマンドがありません。QRコードをスキャンしてコマンドを追加してください' });
      return;
    }
    run();
  };

  const handleReset = () => {
    reset();
  };

  // FABアクション（リボルバー型メニュー用）
  const fabActions: FloatingAction[] = useMemo(() => [
    {
      icon: <Play className="w-5 h-5" />,
      label: '実行',
      variant: 'success' as const,
      onClick: handleExecuteToggle,
      disabled: isRunning,
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

      {/* メインコンテンツ - 7:3 ratio grid */}
      <div className="grid grid-cols-[7fr_3fr] flex-1 min-h-0 p-6 gap-6 pt-24">
        {/* 3Dビュー（左側・カメラ領域） */}
        <div className="relative rounded-lg overflow-hidden border-2 border-neon-cyan shadow-lg shadow-neon-cyan/30">
          {view3D}
          
          {/* コマンドカウント表示 (左上) */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <div className="bg-space-darker/80 backdrop-blur-md border border-neon-cyan/50 rounded-lg px-4 py-2 shadow-lg shadow-neon-cyan/20">
              <span className="text-gray-300 text-sm font-bold mr-2">前に進む:</span>
              <span className="text-neon-cyan text-xl font-black font-mono">{forwardStepCount}</span>
              <span className="text-gray-400 text-xs ml-1">回</span>
            </div>
          </div>

          {/* 迷路名 (中央上) */}
          {mazeName && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <div className="bg-space-darker/80 backdrop-blur-md border border-neon-cyan/50 rounded-lg px-6 py-2 shadow-lg shadow-neon-cyan/20">
                <span className="text-neon-cyan font-bold text-lg tracking-wider drop-shadow-md">
                  {mazeName}
                </span>
              </div>
            </div>
          )}

          {/* ミニマップ (右上) */}
          {selectedMaze && (
            <div className="absolute top-4 right-4 z-10 pointer-events-none">
               <ARMinimap maze={selectedMaze} robotState={robotState} animationState={animationState} />
            </div>
          )}
        </div>

        {/* サイドパネル（コマンドスタック・右側） */}
        <aside className="bg-space-dark/50 rounded-lg p-4 overflow-hidden">
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

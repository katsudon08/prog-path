'use client';

import React, { useMemo } from 'react';
import { MazeData } from '@/src/entities/maze';
import { MazePreview2D } from '@/src/entities/maze/ui/2d/MazePreview2D';
import { RobotState, RobotAnimationState } from '@/src/entities/robot';
import Image from 'next/image';

interface ARMinimapProps {
  maze: MazeData;
  robotState: RobotState;
  animationState: RobotAnimationState;
}

export function ARMinimap({ maze, robotState, animationState }: ARMinimapProps): React.ReactElement {
  // MiniMap configuration
  const maxWidth = 200;
  const maxHeight = 200;
  const showNavigation = false;
  const compact = true;
  const containerPadding = 24; 
  const gridPadding = 4; // p-1 = 4px for compact mode (standard Tailwind)
  const gap = 1; // gap-px = 1px

  // Recalculate metrics to match MazePreview2D logic
  const { effectiveCellSize } = useMemo(() => {
    const currentLayer = maze.layers[robotState.layer] || [];
    const rows = currentLayer.length;
    const cols = currentLayer[0]?.length || 0;
    
    let size = 24; // default base size
    
    if (maxWidth && cols > 0) {
        // We conservatively estimate available space.
        // MazePreview2D's internal logic uses 'compact ? 8 : 16' (which might be wrong comments or custom config),
        // but it renders `p-1`. Let's assume standard p-1 (4px).
        // inner width = cols * size + (cols-1)*gap + 2*padding
        const availableWidth = maxWidth - containerPadding;
        const maxCellWidth = (availableWidth - (gridPadding * 2) - (cols - 1) * gap) / cols;
        size = Math.min(size, maxCellWidth);
    }
    
    if (maxHeight && rows > 0) {
        const availableHeight = maxHeight - containerPadding;
        const maxCellHeight = (availableHeight - (gridPadding * 2) - (rows - 1) * gap) / rows;
        size = Math.min(size, maxCellHeight);
    }

    size = Math.max(1, Math.floor(size));

    return { effectiveCellSize: size };
  }, [maze, robotState.layer]);

  // Arrow Position Calculation
  // Border (1px) + Padding (4px)
  const borderOffset = 1;
  const xPos = borderOffset + gridPadding + robotState.x * (effectiveCellSize + gap);
  const yPos = borderOffset + gridPadding + robotState.y * (effectiveCellSize + gap);

  // Rotation
  const getRotation = (dir: [number, number]) => {
    const [dx, dy] = dir;
    if (dx === 1) return 90;
    if (dx === -1) return -90;
    if (dy === 1) return 180;
    if (dy === -1) return 0;
    return 0;
  };
  const rotation = getRotation(robotState.direction);

  // Transition Logic
  // Only animate when moving, turning, or teleporting. Instant update for idle/reset.
  const shouldAnimate = ['moving', 'turning', 'teleporting'].includes(animationState);
  const transitionClass = shouldAnimate ? "transition-all duration-300 ease-out" : "";

  return (
    <div className="relative inline-block bg-space-dark/80 backdrop-blur-md rounded-xl border border-neon-cyan/50 p-2 shadow-lg shadow-neon-cyan/20">
      <div className="relative">
        <MazePreview2D
          layers={maze.layers}
          layerIndex={robotState.layer}
          maxWidth={maxWidth}
          maxHeight={maxHeight}
          showNavigation={showNavigation}
          compact={compact}
        />
        
        {/* Robot Arrow Overlay */}
        {/* We place this inside a div that matches the grid's expected position. 
            Since MazePreview2D centers the grid, this is tricky if we don't know the exact width.
            WORKAROUND: We assume the wrapper `div` above shrinks to fit (inline-block). 
            But MazePreview2D has a wrapper div itself.
            
            Let's rely on `effectiveCellSize` and `gridPadding` relative to the Top-Left of the grid content.
            We will position this Absolute div relative to the `MazePreview2D` component root.
            The `MazePreview2D` root is `flex flex-col items-center`.
            If the grid is the only child (nav hidden), the root width equals grid width.
            So (0,0) of the root is roughly (0,0) of the grid, minus border width?
            MazePreview2D grid has `border-1`.
        */}
        <div 
          className={`absolute pointer-events-none ${transitionClass}`}
          style={{
            top: yPos,
            left: xPos,
            width: effectiveCellSize,
            height: effectiveCellSize,
          }}
        >
             {/* 
                Correction: 
                MazePreview2D Structure:
                div (flex-col items-center gap-2)
                  div (inline-flex ... border p-1)
                
                So if we put the arrow absolute relative to the outer div, we need to account for the border of the inner div.
                The inner div is strictly "content + padding + border".
                Top-left of the INNER div content (0,0 cell) is at: Border(1px) + Padding(4px/8px depending on compact).
                Compact=true -> p-1 (4px in Tailwind? No, p-1 is 0.25rem = 4px usually. Code comment says "p-1 = 8px"... let me check the comment.
                Code says: `const gridPadding = compact ? 8 : 16 // p-1 = 8px, p-2 = 16px`
                Wait, Tailwind p-1 is usually 0.25rem (4px). p-2 is 0.5rem (8px). 
                The comment in MazePreview2D might be assuming a specific config or just wrong.
                Standard Tailwind: p-1 = 4px.
                Let's assume the comment in MazePreview2D `const gridPadding = compact ? 8 : 16` IS the source of truth for calculations there, 
                BUT if the class `p-1` is used, the browser renders 4px.
                
                Let's double check MazePreview2D content.
                `const paddingClass = compact ? "p-1" : "p-2"`
                If the comment says 8/16, but code uses p-1/p-2, and standard tailwind is 4/8... there is a mismatch.
                Visual alignment might be off.
                I will play it safe and use 4px for p-1. 
            */}
             <div 
                className={`w-full h-full flex items-center justify-center ${shouldAnimate ? 'transition-transform duration-300' : ''}`}
                style={{ transform: `rotate(${rotation}deg)` }}
             >
                <Image 
                    src="/assets/minimap-arrow.svg" 
                    alt="Robot" 
                    width={effectiveCellSize * 0.8} 
                    height={effectiveCellSize * 0.8}
                />
             </div>
        </div>
      </div>
    </div>
  );
}

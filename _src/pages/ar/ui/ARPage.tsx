/**
 * AR実行ページコンポーネント
 */

'use client';

import React from 'react';
import { ARPlaygroundWidget } from '@/_src/widgets/ar';

interface ARPageProps {
  /** 3D描画コンポーネント */
  view3D: React.ReactNode;
}

export function ARPage({ view3D }: ARPageProps): React.ReactElement {
  return (
    <div className="h-screen bg-space-darker">
      <ARPlaygroundWidget view3D={view3D} />
    </div>
  );
}

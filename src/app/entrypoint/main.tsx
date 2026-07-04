import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { StrictMode, useRef } from "react";
import { createRoot } from "react-dom/client";
import type { Mesh } from "three";

import { Switch } from "@/shared/ui";

import "../styles/global.css";

// R3F 導入スモーク(#170)。回転する箱を最小シーンで描画確認する使い捨てサンプル。
// #189 の app ルート本格構築時に App ごと差し替えられて消える。
const RotatingBox = (): React.JSX.Element => {
  const meshRef = useRef<Mesh>(null);

  // 高頻度更新は useFrame 内で ref を直接操作し setState を避ける(→ CLAUDE.md R3F 規約)。
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
};

// UI 基盤(Tailwind + Radix)の動作確認用の暫定コンポーネント(#169)。
// 本格的な app ルート(providers/routing)は #189 で構築し、この App は差し替える。
const App = (): React.JSX.Element => {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-slate-50 text-slate-900">
      <h1 className="text-3xl font-bold tracking-tight">ProgPath</h1>
      <p className="text-sm text-slate-500">UI 基盤（Tailwind + Radix）動作確認</p>
      <div className="flex items-center gap-3 text-base">
        <span>スイッチ</span>
        <Switch defaultChecked aria-label="動作確認用スイッチ" />
      </div>

      {/* 3D 描画基盤(Three.js / R3F / drei)の動作確認(#170)。 */}
      <div className="size-64 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <Canvas camera={{ position: [3, 3, 3] }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <RotatingBox />
          <OrbitControls />
        </Canvas>
      </div>
      <p className="text-xs text-slate-400">3D 動作確認（Three.js / R3F / drei）</p>
    </main>
  );
};

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("ルート要素(#root)が見つかりません");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ArrowUp,
  BrickWall,
  CircleArrowDown,
  CircleArrowUp,
  CircleDashed,
  Flag,
  Key,
  Monitor,
  Moon,
  Repeat,
  RotateCcw,
  RotateCw,
  Shovel,
  Square,
  Sun,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { StrictMode, useRef } from "react";
import { createRoot } from "react-dom/client";
import type { Mesh } from "three";

import { initTheme, useTheme, type ThemeMode } from "@/shared/theme";
import { Switch } from "@/shared/ui";

import "../styles/global.css";

// テーマ機構を起動（DOM 反映 + OS 変更監視）。FOUC 防止は index.html のスクリプトが先行実施済み。
initTheme();

interface Swatch {
  readonly label: string;
  readonly Icon: LucideIcon;
  /** 完全なクラス名リテラル（Tailwind の content 走査に載せるため文字列連結しない）。 */
  readonly bg: string;
  readonly fg: string;
}

const TILES: readonly Swatch[] = [
  { label: "床", Icon: Square, bg: "bg-tile-floor", fg: "text-tile-floor-foreground" },
  { label: "壁", Icon: BrickWall, bg: "bg-tile-wall", fg: "text-tile-wall-foreground" },
  { label: "穴", Icon: CircleDashed, bg: "bg-tile-hole", fg: "text-tile-hole-foreground" },
  { label: "スタート", Icon: Flag, bg: "bg-tile-start", fg: "text-tile-start-foreground" },
  { label: "ゴール", Icon: Trophy, bg: "bg-tile-goal", fg: "text-tile-goal-foreground" },
  {
    label: "テレポート↑",
    Icon: CircleArrowUp,
    bg: "bg-tile-teleport-up",
    fg: "text-tile-teleport-up-foreground",
  },
  {
    label: "テレポート↓",
    Icon: CircleArrowDown,
    bg: "bg-tile-teleport-down",
    fg: "text-tile-teleport-down-foreground",
  },
  { label: "カギ", Icon: Key, bg: "bg-tile-key", fg: "text-tile-key-foreground" },
];

const COMMANDS: readonly Swatch[] = [
  { label: "前にすすむ", Icon: ArrowUp, bg: "bg-cmd-move", fg: "text-cmd-move-foreground" },
  { label: "右にまがる", Icon: RotateCw, bg: "bg-cmd-turn", fg: "text-cmd-turn-foreground" },
  { label: "左にまがる", Icon: RotateCcw, bg: "bg-cmd-turn", fg: "text-cmd-turn-foreground" },
  { label: "穴をうめる", Icon: Shovel, bg: "bg-cmd-fill", fg: "text-cmd-fill-foreground" },
  { label: "ループ", Icon: Repeat, bg: "bg-cmd-loop", fg: "text-cmd-loop-foreground" },
];

const THEME_OPTIONS: readonly { mode: ThemeMode; label: string; Icon: LucideIcon }[] = [
  { mode: "light", label: "ライト", Icon: Sun },
  { mode: "dark", label: "ダーク", Icon: Moon },
  { mode: "system", label: "自動", Icon: Monitor },
];

// R3F 導入スモーク(#170)。回転する箱を最小シーンで描画確認する使い捨てサンプル。
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

// テーマ切替トグル（#174 の動作確認用）。正式な UI/プロバイダは #189 で構築する。
const ThemeToggle = (): React.JSX.Element => {
  const { mode, resolved, setMode } = useTheme();
  return (
    <div className="flex flex-col items-center gap-2">
      {/* 単一選択のグループとして fieldset/legend で提示。選択は「隆起したカード＋太字」で表し、
         ラベルは foreground on background/card（高コントラスト）を保つ（solid+白文字の低コントラストを回避）。 */}
      <fieldset className="m-0 flex gap-1 rounded-button bg-muted p-1">
        <legend className="sr-only">テーマ</legend>
        {THEME_OPTIONS.map((option) => {
          const active = mode === option.mode;
          return (
            <button
              key={option.mode}
              type="button"
              aria-pressed={active}
              onClick={() => setMode(option.mode)}
              className={`inline-flex min-h-tap min-w-tap items-center gap-1.5 rounded-tile px-3 text-base outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                active
                  ? "bg-card font-bold text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <option.Icon aria-hidden className="size-5" />
              {option.label}
            </button>
          );
        })}
      </fieldset>
      <p className="text-sm text-muted-foreground">
        選択: {mode} / 実効: {resolved}
      </p>
    </div>
  );
};

const SwatchRow = ({ items }: { items: readonly Swatch[] }): React.JSX.Element => {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {items.map((item) => (
        <div key={item.label} className="flex w-20 flex-col items-center gap-1">
          <span
            className={`inline-flex size-tap items-center justify-center rounded-tile ${item.bg} ${item.fg}`}
          >
            <item.Icon aria-hidden className="size-6" />
          </span>
          <span className="text-center text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

// デザイントークン(#174)＋UI 基盤(Tailwind + Radix)＋3D(R3F) の動作確認用の暫定コンポーネント。
// 本格的な app ルート(providers/routing)は #189 で構築し、この App は差し替える。
const App = (): React.JSX.Element => {
  return (
    <main className="flex min-h-dvh flex-col items-center gap-8 bg-background px-4 py-10 text-foreground">
      <header className="flex flex-col items-center gap-1">
        <h1 className="text-3xl font-bold tracking-tight">ProgPath</h1>
        <p className="text-sm text-muted-foreground">
          デザイントークン動作確認（Radix Colors / 明暗）
        </p>
      </header>

      <ThemeToggle />

      <div className="flex items-center gap-3 text-base">
        <span>スイッチ</span>
        <Switch defaultChecked aria-label="動作確認用スイッチ" />
      </div>

      <section className="flex flex-col items-center gap-3">
        <h2 className="text-lg font-bold">タイル種別</h2>
        <SwatchRow items={TILES} />
      </section>

      <section className="flex flex-col items-center gap-3">
        <h2 className="text-lg font-bold">コマンド種別</h2>
        <SwatchRow items={COMMANDS} />
      </section>

      {/* 3D 描画基盤(Three.js / R3F / drei)の動作確認(#170)。 */}
      <section className="flex flex-col items-center gap-2">
        <div className="size-64 overflow-hidden rounded-card border border-border bg-card">
          <Canvas camera={{ position: [3, 3, 3] }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <RotatingBox />
            <OrbitControls />
          </Canvas>
        </div>
        <p className="text-xs text-muted-foreground">3D 動作確認（Three.js / R3F / drei）</p>
      </section>
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

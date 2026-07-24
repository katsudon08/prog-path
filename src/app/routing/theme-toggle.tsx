import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";

import { useTheme, type ThemeMode } from "@/shared/theme";

const THEME_OPTIONS: readonly { mode: ThemeMode; label: string; Icon: LucideIcon }[] = [
  { mode: "light", label: "ライト", Icon: Sun },
  { mode: "dark", label: "ダーク", Icon: Moon },
  { mode: "system", label: "じどう", Icon: Monitor },
];

/**
 * テーマ切替 UI（ライト / ダーク / じどう）。
 *
 * `shared/theme` の `useTheme` を購読し、単一選択のグループ（fieldset/legend）として提示する。
 * 選択は「隆起カード＋太字」で表し色のみに依存させない。暫定的に app/routing 直下に置く
 * （正式な navbar への収容・置き場所の判断は #198）。
 */
export const ThemeToggle = (): React.JSX.Element => {
  const { mode, setMode } = useTheme();
  return (
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
  );
};

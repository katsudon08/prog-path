/// <reference types="vite/client" />
import { useEffect } from "react";

import type { Decorator, Preview } from "@storybook/react-vite";

// Tailwind v4 + Radix Colors のトークン定義を読み込む（本番と同じ global.css）。
import "../src/app/styles/global.css";

/** ツールバーのテーマ切替に追従して `<html>` の `.dark` クラスを付け外しする（shared/theme と同じ方式）。 */
const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme === "dark" ? "dark" : "light";
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  return (
    <div className="bg-background text-foreground flex min-h-svh items-center justify-center p-6">
      <Story />
    </div>
  );
};

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
  // ツールバーに light/dark トグルを出す。既定は light。
  initialGlobals: { theme: "light" },
  globalTypes: {
    theme: {
      description: "テーマ（明暗）",
      toolbar: {
        title: "テーマ",
        icon: "contrast",
        items: [
          { value: "light", title: "ライト" },
          { value: "dark", title: "ダーク" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withTheme],
};

export default preview;

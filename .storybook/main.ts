import type { StorybookConfig } from "@storybook/react-vite";

/**
 * Storybook 設定（コンポーネントの見た目確認基盤）。
 *
 * 本プロジェクトの dev/build は Vite+（vp / Rolldown）だが、Storybook は Rolldown 版 Vite を
 * 公式サポートしないため、Storybook 専用に標準 Vite（7 系）パイプラインを併存させる。
 * root の `vite.config.ts`（vite-plus 設定）は Storybook が解釈できないので、`viteConfigPath` で
 * `.storybook/vite.config.ts`（標準 Vite の最小構成）を明示的に読み込ませて隔離する。
 */
const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [],
  core: {
    builder: {
      name: "@storybook/builder-vite",
      options: { viteConfigPath: ".storybook/vite.config.ts" },
    },
  },
};

export default config;

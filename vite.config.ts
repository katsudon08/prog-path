import { defineConfig } from "vite-plus";

// フォーマット/リント対象から外すパス（手書きの日本語ドキュメント・生成物・ロックファイル等）。
// 手書きドキュメントを reformat させないための最小スコープ。型認識 lint・厳格ルール・
// fmt/lint の最終ポリシーは #166 で確定する。
const FORMAT_LINT_IGNORE = ["dist/**", "**/*.md", "public/**", "package.json", "pnpm-lock.yaml"];

// Vite+ の統合設定。標準 Vite 設定に加え test(Vitest) / lint(Oxlint) / fmt(Oxfmt) を集約する。
// 型チェック有効化(lint.options.typeCheck)と厳格 lint ルールは #166 で追加する。
// Tauri 向けの本格配線(build.target 等)は #171 で行う。
export default defineConfig({
  plugins: [],
  // tsconfig.json の paths を単一の正として解決に使う（Vite 8 ネイティブ・build/test 双方に適用）。
  resolve: {
    tsconfigPaths: true,
  },
  // dev サーバは固定ポート(後続の Tauri 連携を見据える)。
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
  },
  lint: {
    ignorePatterns: FORMAT_LINT_IGNORE,
  },
  fmt: {
    ignorePatterns: FORMAT_LINT_IGNORE,
    semi: true,
    singleQuote: false,
  },
});

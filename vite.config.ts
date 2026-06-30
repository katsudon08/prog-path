import { defineConfig } from "vite-plus";

// フォーマット/リント対象から外すパス（手書きの日本語ドキュメント・生成物・ロックファイル等）。
// 手書きドキュメントを reformat させないための最小スコープ。
// src-tauri/** は Tauri(Rust/設定)側で FSD の外。フロントの Oxlint/Oxfmt 規約の対象外とする。
const FORMAT_LINT_IGNORE = [
  "dist/**",
  "**/*.md",
  "public/**",
  "package.json",
  "pnpm-lock.yaml",
  "src-tauri/**",
];

// Vite+ の統合設定。標準 Vite 設定に加え test(Vitest) / lint(Oxlint) / fmt(Oxfmt) を集約する。
// lint は type-aware を有効化し、コーディング規約(any 禁止 / 型明示 / 命名 等)をルール化する(#166)。
// Tauri(Desktop) との接続は src-tauri/tauri.conf.json 側で行う。dev は固定ポート 5173 /
// clearScreen:false を Tauri が利用する(#171)。WebView 向け build.target 等の最適化は bundle 着手時(#175/M4)。
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
    // 既定は node 環境（純粋ロジック中心）。DOM が要るテストはファイル先頭に
    // `// @vitest-environment jsdom`(or happy-dom) を付けて opt-in する（規約は CLAUDE.md）。
    // DOM テスト基盤の本格導入は最初のコンポーネント着手時（#187 等）。
    environment: "node",
    // グローバル注入は使わない。各テストで `import { describe, it, expect } from "vitest"` を明示する。
    globals: false,
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      // v8（高速・追加ビルド不要）。閾値(thresholds)は設けない＝計測のみ。
      // 合格ラインの本格運用はドメインのテスト方針（#209）で決める。
      provider: "v8",
      reporter: ["text", "html"], // text=コンソール要約 / html=詳細（coverage/ は .gitignore 済）
      // include で指定したファイルは未テストでも 0% として報告される（v4 既定。「どこが未チェックか」の地図になる）。
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}", // テスト自身
        "src/**/*.d.ts", // 型宣言
        "src/**/index.ts", // Public API（再エクスポートのみでロジックなし）
        "src/main.tsx", // アプリのエントリ
        "src/vite-env.d.ts",
      ],
    },
  },
  lint: {
    ignorePatterns: FORMAT_LINT_IGNORE,
    options: {
      typeAware: true,
      typeCheck: true,
    },
    // plugins は「上書き」= 許可リスト。新たに promise/* 等のルールを使うときは、
    // ここに該当プラグインを追加すること（未追加だと rules に書いても黙って無効化される）。
    plugins: ["typescript", "unicorn", "react", "jsx-a11y", "import", "oxc"],
    rules: {
      // CLAUDE.md のコーディング規約を強制（すべて error で CI ゲートにする）。
      "typescript/no-explicit-any": "error", // any 禁止（unknown + 型ガードを使う）
      "typescript/explicit-function-return-type": [
        "error",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],
      // ファイル名は kebab-case（例 maze-preview.tsx）。識別子(コンポーネント/型)の
      // PascalCase とは別で、ファイル名は kebab が本プロジェクト規約（→ docs/directory-structure.md）。
      "unicorn/filename-case": ["error", { case: "kebabCase" }],
      "react/rules-of-hooks": "error",
      "react/exhaustive-deps": "error", // hook 依存配列の誤り(stale-closure バグ)を CI で止める
      "no-console": ["error", { allow: ["warn", "error"] }], // console.log 等は禁止。warn/error は許可
    },
    // テスト・型宣言ファイルは厳格ルールを緩める（実用上の慣習。テストの as any や
    // 戻り値型省略、.d.ts の any を許容する）。
    overrides: [
      {
        files: ["**/*.test.{ts,tsx}", "**/*.d.ts"],
        rules: {
          "typescript/no-explicit-any": "off",
          "typescript/explicit-function-return-type": "off",
        },
      },
    ],
  },
  fmt: {
    ignorePatterns: FORMAT_LINT_IGNORE,
    semi: true,
    singleQuote: false,
  },
});

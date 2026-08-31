import stylistic from "@stylistic/eslint-plugin";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier/flat";
import importPlugin from "eslint-plugin-import";
import tseslint from "typescript-eslint";

// max-len はコードの行長も見るが、そこは Prettier の printWidth に任せる
// off にはできないため、実質無効になる極端な値を入れる
const CODE_MAX_LEN_DISABLED = 1000;

export default defineConfig([
  // eslint-config-next が内包していた TypeScript 向けのルールを引き継ぐ
  ...tseslint.configs.recommended,
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      // 親ディレクトリへの相対パスインポートを禁止し、エイリアス使用を強制
      "import/no-relative-parent-imports": "warn",
    },
  },
  // 整形は Prettier に任せ、衝突する ESLint ルールを無効化する
  prettier,
  {
    // prettier は max-len も off にするため、必ずその後で有効化する
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      // 長文コメントを検知する。// と /* */ の両方が対象
      "@stylistic/max-len": [
        "warn",
        { code: CODE_MAX_LEN_DISABLED, comments: 60, ignoreUrls: true },
      ],
    },
  },
  globalIgnores([
    // 検査対象の範囲は docs/ci.md を参照。移行完了時にこの2行を消す
    "src/**",
    "main.js",
    // 生成物
    "out/**",
    "build/**",
  ]),
]);

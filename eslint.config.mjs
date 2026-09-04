import stylistic from "@stylistic/eslint-plugin";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier/flat";
import tseslint from "typescript-eslint";

// max-len はコードの行長も見るが、そこは Prettier の printWidth に任せる
// off にはできないため、実質無効になる極端な値を入れる
const CODE_MAX_LEN_DISABLED = 1000;

// 配列は後ろの要素が前の要素を上書きする。並び順に意味がある
export default defineConfig([
  // ESLint 単体では TypeScript の構文を読めないため、
  // 型注釈を解析できるパーサと TS 向けルールをまとめて入れる
  // 例: no-explicit-any / no-unused-vars / ban-ts-comment
  ...tseslint.configs.recommended,
  // ルールを足す設定ではなく、Prettier と衝突する整形系ルールを
  // すべて off にするだけの設定。整形は Prettier に任せる
  // 配列ではなくオブジェクト1個なので展開せずそのまま置く
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
  {
    // 新コードから旧コードへの逆流を止める。
    // Steiger は legacy を層として認識せず素通しするため、
    // この境界だけは ESLint が受け持つ
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              // patterns は glob ではなく gitignore 形式で当たる。
              // この1つで @/legacy/… も ../../legacy/… も塞がる
              group: ["**/legacy/*"],
              message:
                "src/legacy は移行元の旧コードです。新コードからは参照せず、必要な処理は FSD の層へ移してから使ってください。",
            },
          ],
        },
      ],
    },
  },
  {
    // ルーターだけは旧画面を差し込む口として例外にする。
    // ここが移行の入口で、画面を移すたびに import が減る
    files: ["src/app/routes/**"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  globalIgnores([
    // 検査対象の範囲は docs/ci.md を参照。
    // 旧コードは書き換えない前提なので検査もしない。
    // 移行が終わって legacy が消えたら src/legacy/** の行を消す
    "src/legacy/**",
    // Electron のエントリ。移行とは無関係にここへ残る
    "main.js",
    // 生成物。dist は electron-builder の出力先
    "out/**",
    "build/**",
    "dist/**",
  ]),
]);

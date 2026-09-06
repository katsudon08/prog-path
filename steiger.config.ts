import fsd from "@feature-sliced/steiger-plugin";
import { defineConfig } from "steiger";

// FSD の構造検査。層・スライス・セグメントの置き方だけを見る
export default defineConfig([
  ...fsd.configs.recommended,
  {
    // スライス内は相対、外はエイリアスに統一する。
    // recommended では off なのでここで点灯させる
    files: ["./src/**"],
    rules: {
      "fsd/import-locality": "error",
    },
  },
  {
    // ホーム画面の UI (#288〜#291) が使い始めるまで、このスライスはどこからも参照されない。
    // 参照が付いた時点でこの設定を外す
    files: ["./src/entities/maze/**"],
    rules: {
      "fsd/insignificant-slice": "off",
    },
  },
]);

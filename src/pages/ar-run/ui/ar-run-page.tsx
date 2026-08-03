/**
 * AR 実行画面（★中心価値）。
 *
 * URL クエリ `?mazeId=...` を読んで実行対象を解決し、4 状態（ピッカー / 見つからない /
 * 遊べない / 実行）へ振り分けるだけの薄い container。レイアウトも状態も持たず、
 * 見た目は presenter（ArRunSession → ArRunWorkspace / MazePicker / MazeUnavailable）が持つ。
 *
 * 迷路の受け渡しにクエリを使う理由: パスの単一の正は `app/routing/route-paths.ts` にあるが、
 * pages から app を import するのは FSD の逆流になる。`setSearchParams` なら現在パスを
 * 保ったままクエリだけ書き換えられるため、`app/routing` を無変更にできる。
 *
 * **テストも stories も書かない**。本ファイルは `useArRunTarget`（wa-sqlite WASM + OPFS）と
 * Router context に依存し、node / jsdom / Storybook のいずれでも動かせない。だから中身を
 * 「URL を読んで分岐するだけ」に薄くしてあり、
 *  - 判定ロジックは `lib/resolve-ar-run-target.test.ts`（node）
 *  - 見た目と配線は `ar-run-workspace.test.tsx` と 4 つの presenter の stories
 * が代わりに網羅する。分岐の中身が増えそうになったら presenter 側へ出すこと。
 */
import { useCallback } from "react";
import { useSearchParams } from "react-router";

import { useArRunTarget } from "../model/use-ar-run-target";
import { ArRunSession } from "./ar-run-session";
import { MazePicker } from "./maze-picker";
import { MazeUnavailable } from "./maze-unavailable";

/**
 * 実行対象の迷路を指す URL クエリのキー。
 *
 * 当面この画面だけが読み書きするため page ローカルに留める。ホーム（#199）から
 * `/ar-run?mazeId=...` へ遷移する導線ができた時点で「どこを単一の正にするか」を決める
 * （`app/routing` へ置くと pages から参照できないので、置き場所ごと #199 で判断する）。
 */
const MAZE_ID_SEARCH_PARAM = "mazeId";

/** AR 実行画面のルート要素（対象迷路の解決と画面の振り分け）。 */
export const ArRunPage = (): React.JSX.Element => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { target, selectableMazes } = useArRunTarget(searchParams.get(MAZE_ID_SEARCH_PARAM));

  const handleSelectMaze = useCallback(
    (mazeId: string): void => {
      setSearchParams({ [MAZE_ID_SEARCH_PARAM]: mazeId });
    },
    [setSearchParams],
  );

  // ピッカーへ戻すのは「選び直し」であって履歴に残す価値が無いため replace で置き換える
  // （戻るボタンで壊れた mazeId へ戻ってしまうのも防げる）。
  const handleBackToPicker = useCallback((): void => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  switch (target.kind) {
    case "unselected":
      // ArStage を描かない分岐。迷路を選ぶまでカメラ権限のダイアログを出さないための設計。
      return <MazePicker mazes={selectableMazes} onSelect={handleSelectMaze} />;
    case "not-found":
      return <MazeUnavailable reason="not-found" onBackToPicker={handleBackToPicker} />;
    case "unplayable":
      return (
        <MazeUnavailable
          reason="unplayable"
          mazeName={target.mazeName}
          onBackToPicker={handleBackToPicker}
        />
      );
    case "ready":
      // key は必須。`useArStage` は maze をマウント時に固定する（XState actor を useState の
      // 初期化子で生成）が、setSearchParams はアンマウントを起こさないため、key が無いと
      // 戻る/進む・URL 直編集で「前の迷路のまま実行」になる。切替のたびにカメラを取り直す
      // （約 1 秒の loading）が、授業中に迷路を切り替える場面は稀なので許容する。
      return <ArRunSession key={target.maze.id} maze={target.maze} />;
    default: {
      // 状態が増えたらここが型エラーになる（網羅性の強制）。
      const exhaustive: never = target;
      return exhaustive;
    }
  }
};

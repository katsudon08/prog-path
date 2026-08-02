/**
 * 実行対象迷路の取得（FSD: pages/ar-run/model）
 *
 * URL クエリの `mazeId` から実行対象の迷路を解決し、暫定ピッカー用の一覧と併せて返す。
 * DB へ触れるのは pages/ar-run 内でこのフックだけで、判定そのものは純粋関数
 * {@link resolveArRunTarget} に出してある（presenter からは絶対に呼ばないこと。
 * `use(initDb())` は Suspense 境界の内側でしか動かず、Storybook / jsdom では即死する）。
 *
 * **再サスペンドしない根拠**: `initDb()` は `databasePromise ??=` で同一 Promise を
 * モジュールキャッシュし、React の `use()` は fulfilled 済みの thenable を同期解決する。
 * 起動時に `DbGate`（app/providers）が同じ Promise を解決済みなので、ここでの `use()` は
 * fallback のちらつきも二重初期化も起こさない。失敗時も上位の `AsyncBoundary` が受けるため、
 * ページ独自の Suspense / Error 境界は要らない。
 *
 * **`useLiveQuery` を使わない理由**: `useArStage` は迷路をマウント時に固定する
 * （XState actor を `useState` の初期化子で作る）ため、live 更新はセッションを `key` で
 * 再マウントしない限り画面に反映されない。購読すると「リアクティブに見えて実際は違う」API に
 * なるので、ここでは意図的に同期スナップショットだけを読む。live 購読の出番は #196 / #199。
 *
 * **テストを書かない理由**: 本ファイルは `initDb()` 経由で wa-sqlite(WASM) + OPFS に依存し、
 * node / jsdom のどちらでも動かない。だから中身は「DB から引いて純粋関数へ渡すだけ」に薄くし、
 * 判定ロジックは `lib/resolve-ar-run-target.test.ts` が node 環境で網羅する。
 */
import { use, useMemo } from "react";

import { initDb } from "@/shared/db";
import type { Maze } from "@/shared/db";

import { resolveArRunTarget } from "../lib/resolve-ar-run-target";
import type { ArRunTarget } from "../lib/resolve-ar-run-target";

/** {@link useArRunTarget} が返す実行対象と選択肢。 */
export interface UseArRunTargetResult {
  /** `mazeId` から解決した実行対象の状態。 */
  readonly target: ArRunTarget;
  /** 暫定ピッカーに並べる迷路一覧（作成順）。 */
  readonly selectableMazes: readonly Maze[];
}

/**
 * URL の `mazeId` に対応する迷路を解決する。
 *
 * `selectableMazes` は **live ではない**（マウント時点のスナップショットを作成順に並べたもの）。
 * 迷路の追加・削除は画面を開き直すまで反映されないが、暫定ピッカー専用の暫定仕様として許容する
 * （`widgets/maze-library` #196 / `pages/home` #199 の本実装で本フックごと消える）。
 * 要素には TanStack DB の virtual props が付いたままだが、ピッカーは `id` と `name` しか
 * 読まないため剥離しない（実行に渡す迷路の剥離は {@link resolveArRunTarget} が担う）。
 *
 * @param mazeId URL クエリの `mazeId`（未指定なら null）
 * @returns 実行対象の状態とピッカー用の迷路一覧（{@link UseArRunTargetResult}）
 */
export const useArRunTarget = (mazeId: string | null): UseArRunTargetResult => {
  // 分割代入して deps には collection を入れる（`use(initDb())` の戻りを直接 deps に置くと
  // react/exhaustive-deps が解釈できない）。
  const { mazeCollection } = use(initDb());

  const target = useMemo(
    () => resolveArRunTarget(mazeId, mazeId === null ? undefined : mazeCollection.get(mazeId)),
    [mazeCollection, mazeId],
  );

  const selectableMazes = useMemo(
    () => [...mazeCollection.toArray].sort((a, b) => a.createdAt - b.createdAt),
    [mazeCollection],
  );

  return { target, selectableMazes };
};

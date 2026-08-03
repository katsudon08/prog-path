/**
 * 実行対象迷路の解決（FSD: pages/ar-run/lib）
 *
 * URL クエリの `mazeId` と、迷路コレクションから引いた行を、AR 実行画面が描く 4 状態
 * （{@link ArRunTarget}）へ写像する純粋関数。React にも DB にも依存しないため node 環境で
 * 単体テストできる（呼び出し側の `model/use-ar-run-target.ts` は OPFS 依存でテストできない）。
 *
 * もう一つの役割が **TanStack DB の virtual props（`$key` / `$synced` / `$origin` /
 * `$collectionId`）の剥離**。`collection.get()` はこれらを付けた行を返すので、そのまま
 * `Maze` として下流（XState の context・3D 描画・QR 共有）へ流すと DB 由来のメタが混ざる。
 * 本関数は `safeParse().data`（Zod object は未知キーを strip する）で得た plain な `Maze`
 * だけを `ready` に載せる。生の行でも動いてしまい気付きにくいので、剥離はここに一本化する。
 *
 * 実行不能な迷路（`unplayable`）を画面レベルで先に弾くのも本関数の役目。ar-stage 任せだと
 * 命令を組み終えて［じっこう］を押すまで分からず、45 分授業では行き止まりになる。
 * 判定に使う {@link PlayableMazeSchema} は `createExecutionSession` と同一なので、
 * ここを通った迷路が実行時チェックで落ちることはない（実行時チェックは防御の二段目として残る）。
 */
import { MazeSchema, PlayableMazeSchema } from "@/shared/db";
import type { Maze } from "@/shared/db";

/** AR 実行画面が描く 4 状態。 */
export type ArRunTarget =
  | { readonly kind: "unselected" }
  | { readonly kind: "not-found" }
  | { readonly kind: "unplayable"; readonly mazeName: string }
  | { readonly kind: "ready"; readonly maze: Maze };

/**
 * `mazeId` と取得行から実行対象の状態を決める。
 *
 * 判定順:
 * 1. `mazeId` が未指定（null / 空文字）→ `unselected`（ピッカーを出す＝カメラを要求しない）
 * 2. 行が無い → `not-found`
 * 3. {@link PlayableMazeSchema} を通る → `ready`（**parse 済みの値**を載せる＝virtual props 剥離）
 * 4. {@link MazeSchema} だけ通る → `unplayable`（構造は正しいがテレポート先が不正）
 * 5. どちらも通らない → `not-found`（壊れた行は「無い」と同じ扱い。起動時 purge の対象でもある）
 *
 * `row` を `unknown` で受けるのは、`collection.get()` の戻りが virtual props 付きの型であり、
 * `Maze | undefined` で受けると「剥離が要る」ことが型に現れず誤解を生むため。
 *
 * @param mazeId URL クエリの `mazeId`（未指定なら null）
 * @param row 迷路コレクションから引いた行（不在なら undefined）
 * @returns 画面が分岐する対象状態（{@link ArRunTarget}）
 */
export const resolveArRunTarget = (mazeId: string | null, row: unknown): ArRunTarget => {
  if (mazeId === null || mazeId === "") {
    return { kind: "unselected" };
  }

  if (row === undefined || row === null) {
    return { kind: "not-found" };
  }

  const playable = PlayableMazeSchema.safeParse(row);
  if (playable.success) {
    return { kind: "ready", maze: playable.data };
  }

  const structural = MazeSchema.safeParse(row);
  if (structural.success) {
    return { kind: "unplayable", mazeName: structural.data.name };
  }

  return { kind: "not-found" };
};

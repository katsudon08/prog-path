/**
 * コマンドパス比較・キー化ユーティリティ（FSD: widgets/command-panel/lib）
 *
 * ID を持たないコマンド木を描くとき、描画時のパスから決定的にキーと選択判定を作る。
 * 比較の素は `shared/lib` の `shallowArrayEqual` を用い、`features/command-management` の
 * 非公開 `pathsEqual` には依存しない（型は Public API 経由で借りる。パス比較の意味論は
 * ドメイン固有ではなく汎用の配列一致なので shared のプリミティブに集約する）。
 */
import type { CommandPath, InsertionPoint } from "@/features/command-management";
import { shallowArrayEqual } from "@/shared/lib";

/**
 * 2 つのコマンドパスが同一（長さと各 index）かを判定する。
 *
 * どちらかが未指定（例: `activePath` 未指定）の場合は同一とみなさず `false` を返す。
 *
 * @param a 比較するパス（未指定可）
 * @param b 比較するパス（未指定可）
 * @returns 長さと全要素が一致すれば `true`
 */
export const isSamePath = (a: CommandPath | undefined, b: CommandPath | undefined): boolean => {
  if (a === undefined || b === undefined) return false;
  return shallowArrayEqual(a, b);
};

/**
 * パスの集合に指定パスが含まれるかを判定する。
 *
 * 「このループはまだ閉じていないか」（`openLoopPaths` への所属）の判定に使う。
 * 集合が未指定なら `false`（判定材料が無いときは通常表示にフォールバックする）。
 *
 * @param paths 探索対象のパス集合（未指定可）
 * @param path 探すパス
 * @returns いずれかのパスと完全一致すれば `true`
 */
export const containsPath = (
  paths: readonly CommandPath[] | undefined,
  path: CommandPath,
): boolean => paths !== undefined && paths.some((candidate) => isSamePath(candidate, path));

/**
 * コマンドパスを React の key / 状態管理に使う安定な文字列へ変換する。
 *
 * root（空配列）は `"root"`、それ以外は index を `/` で連結する（例 `[0,1]` → `"0/1"`）。
 *
 * @param path キー化するパス
 * @returns 決定的なキー文字列
 */
export const commandPathKey = (path: CommandPath): string =>
  path.length === 0 ? "root" : path.join("/");

/**
 * 2 つの挿入位置（コンテナ + index）が同一かを判定する。
 *
 * @param a 比較する挿入位置（未指定可）
 * @param b 比較する挿入位置（未指定可）
 * @returns index とコンテナパスがともに一致すれば `true`
 */
export const isSameInsertionPoint = (
  a: InsertionPoint | undefined,
  b: InsertionPoint | undefined,
): boolean => {
  if (a === undefined || b === undefined) return false;
  return a.index === b.index && isSamePath(a.containerPath, b.containerPath);
};

/**
 * 挿入位置がコンテナの末尾（既定の追加位置）を指すかを判定する。
 *
 * @param point 判定する挿入位置
 * @param containerLength 対象コンテナの命令数
 * @returns `point.index` がコンテナ長に等しければ `true`
 */
export const isTailInsertionPoint = (point: InsertionPoint, containerLength: number): boolean =>
  point.index === containerLength;

/**
 * MazePicker（FSD: pages/ar-run/ui）【暫定実装】
 *
 * URL に `mazeId` が無いときに出す、実行する迷路の選択画面。カードを押すと呼び出し側が
 * クエリを書き換え、AR セッションが始まる。この画面では ArStage を描かないため、
 * 迷路を選ぶまでカメラ権限を要求しない。
 *
 * **本ファイルは #196（`widgets/maze-library`）/ #199（`pages/home`）の本実装で削除する。**
 * ホームから対象迷路を選んで `/ar-run?mazeId=...` へ遷移する導線がそちらで用意されるまでの
 * 繋ぎであり、サムネイル・フォルダ分け・並べ替え・検索はここに足さない（#196 と二重実装になる）。
 *
 * 「ホームへもどる」ボタンを置かない理由: パスの単一の正は `app/routing/route-paths.ts` にあり、
 * pages から app を import するのは FSD の逆流になる。画面間の移動は AppShell の仮 navbar
 * （#198 で `widgets/navbar` へ差し替え予定）に任せる。
 */
import type { Maze } from "@/entities/maze";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui";

/** {@link MazePicker} の props。 */
export interface MazePickerProps {
  /** 選べる迷路（渡された順にそのまま並べる）。 */
  mazes: readonly Maze[];
  /** 迷路が選ばれたときに呼ぶ（引数は `maze.id`）。 */
  onSelect: (mazeId: string) => void;
  /** 既定クラスへの上書き・拡張（cn 経由）。 */
  className?: string;
}

/** 実行する迷路を選ぶ暫定ピッカー。 */
export const MazePicker = ({ mazes, onSelect, className }: MazePickerProps): React.JSX.Element => {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-6", className)}>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">めいろを えらぼう</h1>
        <p className="text-muted-foreground text-sm">
          あそびたい めいろを えらんでね。カメラは えらんだ あとに つかうよ。
        </p>
      </div>

      {mazes.length === 0 ? (
        <p className="text-muted-foreground">
          めいろが まだ ありません。うえの「めいろをつくる」から つくってね。
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {mazes.map((maze) => (
            <li key={maze.id}>
              {/* Button は 1 行前提（inline-flex / nowrap / 中央寄せ）なので、
                  カード表示に必要な分だけ後勝ちで上書きする（cn = tailwind-merge）。 */}
              <Button
                variant="outline"
                tone="neutral"
                size="lg"
                onClick={() => onSelect(maze.id)}
                className="w-full flex-col items-start gap-1 py-3 text-start whitespace-normal"
              >
                <span className="font-bold">{maze.name}</span>
                <span className="text-muted-foreground text-sm">
                  {maze.size} × {maze.size} マス ・ {maze.floors} かいだて
                </span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

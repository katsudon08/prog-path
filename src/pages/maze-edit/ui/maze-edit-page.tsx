/**
 * 迷路作成・編集画面（プレースホルダ）。
 *
 * #200 で `widgets/maze-editor` を配置して本実装する。#189 では遷移確認用の最小表示のみ。
 */
export const MazeEditPage = (): React.JSX.Element => {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-2xl font-bold">めいろをつくる</h1>
      <p className="text-muted-foreground">グリッドで めいろを へんしゅう（じゅんびちゅう）</p>
    </section>
  );
};

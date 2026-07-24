/**
 * ホーム画面（プレースホルダ）。
 *
 * #199 で `widgets/maze-library` を配置して本実装する。#189 では遷移確認用の最小表示のみ。
 */
export const HomePage = (): React.JSX.Element => {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-2xl font-bold">ホーム</h1>
      <p className="text-muted-foreground">めいろの いちらん（じゅんびちゅう）</p>
    </section>
  );
};

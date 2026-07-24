/**
 * AR 実行画面（★中心価値・プレースホルダ）。
 *
 * #190 で `widgets/ar-stage`・`widgets/command-panel` を配置し、命令作成→実行→成功/失敗までを
 * 一気通貫で本実装する（M2 の到達点）。#189 では遷移確認用の最小表示のみ。
 */
export const ArRunPage = (): React.JSX.Element => {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-2xl font-bold">AR でうごかす</h1>
      <p className="text-muted-foreground">カメラ＋3D＋QR めいれい（じゅんびちゅう）</p>
    </section>
  );
};

/**
 * LoopCountDialog（FSD: widgets/ar-stage/ui）
 *
 * loopStart カード読み取り後の「くりかえす回数」入力ダイアログ。回数が確定するまで
 * QR 追加は受け付けられない（features 側で ignored）ため、`dismissible=false` で
 * ×・Esc・外側クリックでは閉じない（［けってい］/［やめる］のみ）。
 *
 * 2〜3 人で 1 台を囲む共有画面前提のため、数値入力ではなく −/＋ の大きなボタンと
 * 大きな数字表示で操作する（誤入力が起きにくく、離れた席からも読める）。
 * 回数の範囲は shared/config の LOOP_COUNT_MIN〜LOOP_COUNT_MAX が正。
 */
import { useEffect, useState } from "react";
import { Minus, Plus, Repeat } from "lucide-react";

import { LOOP_COUNT_MAX, LOOP_COUNT_MIN } from "@/shared/config";
import { clamp } from "@/shared/lib";
import { Button, Modal } from "@/shared/ui";

interface LoopCountDialogProps {
  /** 開閉状態（controller.loopDialogOpen）。 */
  open: boolean;
  /** 回数の確定（controller.confirmLoop）。 */
  onConfirm: (count: number) => void;
  /** 保留中 loopStart の破棄（controller.cancelLoop）。 */
  onCancel: () => void;
}

/** ループ回数入力ダイアログ。 */
export const LoopCountDialog = ({
  open,
  onConfirm,
  onCancel,
}: LoopCountDialogProps): React.JSX.Element => {
  const [count, setCount] = useState<number>(LOOP_COUNT_MIN);

  // 開くたびに最小値へ戻す（前回の選択を持ち越さない）。
  useEffect(() => {
    if (open) {
      setCount(LOOP_COUNT_MIN);
    }
  }, [open]);

  const step = (delta: number): void => {
    setCount((prev) => clamp(prev + delta, LOOP_COUNT_MIN, LOOP_COUNT_MAX));
  };

  return (
    <Modal
      open={open}
      // dismissible=false のため Radix からの close 要求は来ないが、契約上は cancel に写す。
      onOpenChange={(next) => {
        if (!next) {
          onCancel();
        }
      }}
      dismissible={false}
      tone="primary"
      icon={<Repeat aria-hidden="true" />}
      title="なんかい くりかえす？"
      description={`くりかえす かいすうを えらんでね（${LOOP_COUNT_MIN}〜${LOOP_COUNT_MAX}かい）`}
      footer={
        <>
          <Button variant="ghost" tone="neutral" size="lg" onClick={onCancel}>
            やめる
          </Button>
          <Button size="lg" onClick={() => onConfirm(count)}>
            けってい
          </Button>
        </>
      }
    >
      <div className="flex items-center justify-center gap-6 py-4">
        <Button
          variant="outline"
          tone="neutral"
          size="lg"
          aria-label="へらす"
          onClick={() => step(-1)}
          disabled={count <= LOOP_COUNT_MIN}
        >
          <Minus aria-hidden="true" />
        </Button>
        <div className="flex min-w-28 flex-col items-center leading-none">
          <span aria-live="polite" className="text-6xl font-bold tabular-nums">
            {count}
          </span>
          <span className="mt-1 text-base text-muted-foreground">かい</span>
        </div>
        <Button
          variant="outline"
          tone="neutral"
          size="lg"
          aria-label="ふやす"
          onClick={() => step(1)}
          disabled={count >= LOOP_COUNT_MAX}
        >
          <Plus aria-hidden="true" />
        </Button>
      </div>
    </Modal>
  );
};

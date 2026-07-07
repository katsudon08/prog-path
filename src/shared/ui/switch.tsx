import { Switch as SwitchPrimitive } from "radix-ui";
import type { ComponentPropsWithRef } from "react";

import { cn } from "@/shared/lib";

type SwitchProps = ComponentPropsWithRef<typeof SwitchPrimitive.Root>;

/**
 * Radix Switch をラップした共通スイッチ（オン/オフ切替）。
 *
 * 動作（キーボード操作・aria-checked 等のアクセシビリティ）は Radix が担い、
 * 見た目はデザイントークン（#174）で与える。既定クラスは `className` で上書き・拡張できる（cn 経由）。
 *
 * @remarks 配色はセマンティックトークン（muted/primary/ring）を参照し、ライト/ダークに追従する。
 *
 * @todo #169 由来のアクセシビリティ課題（本 UI 部品の本格実装時にまとめて対応）:
 *  1. タップ領域が 24px 高で、規約の 48px（tap）/ WCAG 2.5.5 の 44px に未達。当たり判定の拡張が必要。
 *  2. ライト×オフ時、トラック(slate-3)/白サムが背景と 3:1（SC 1.4.11）を満たさず視認しにくい。
 *     Radix の明色ステップでは単純な枠線で 3:1 に届かないため、オフ表現の再設計が要る。
 *  3. サムが `bg-white` 固定（トークン非依存）。上記オフ表現とあわせて見直す。
 */
export const Switch = ({ className, ...props }: SwitchProps): React.JSX.Element => {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-muted p-0.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=checked]:bg-primary",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-5" />
    </SwitchPrimitive.Root>
  );
};

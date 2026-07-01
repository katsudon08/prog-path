import { Switch as SwitchPrimitive } from "radix-ui";
import type { ComponentPropsWithRef } from "react";

import { cn } from "@/shared/lib";

type SwitchProps = ComponentPropsWithRef<typeof SwitchPrimitive.Root>;

/**
 * Radix Switch をラップした共通スイッチ（オン/オフ切替）。
 *
 * 動作（キーボード操作・aria-checked 等のアクセシビリティ）は Radix が担い、
 * 見た目は Tailwind で与える。既定クラスは `className` で上書き・拡張できる（cn 経由）。
 *
 * @remarks 最終的な配色・サイズは #174 のデザイントークンで確定する。
 */
export const Switch = ({ className, ...props }: SwitchProps): React.JSX.Element => {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-gray-300 p-0.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 data-[state=checked]:bg-blue-600",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-5" />
    </SwitchPrimitive.Root>
  );
};

import { cn } from "@/shared/lib";

/** 見た目の種類。solid=塗り / outline=枠線 / ghost=背景なし。 */
export type ButtonVariant = "solid" | "outline" | "ghost";

/** 調子（意味づけ）。 */
export type ButtonTone = "neutral" | "primary" | "destructive";

/** 大きさ。タップ領域は md=48px（tap 標準）を満たす。 */
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ComponentPropsWithRef<"button"> {
  /** 見た目の種類。既定 "solid"。 */
  variant?: ButtonVariant;
  /** 調子（意味づけ）。既定 "primary"。 */
  tone?: ButtonTone;
  /** 大きさ。既定 "md"。 */
  size?: ButtonSize;
}

const BUTTON_BASE =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-button font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-5 [&_svg]:shrink-0";

// 距離のある教室前提でタップ領域を大きめに（→ docs/design-tokens.md §8）。
const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: "min-h-tap-min px-3 text-sm",
  md: "min-h-tap px-5 text-base",
  lg: "min-h-tap-lg px-6 text-lg",
};

// variant × tone のクラス（すべてトークン参照でライト/ダーク追従）。
const BUTTON_VARIANT_TONE: Record<ButtonVariant, Record<ButtonTone, string>> = {
  solid: {
    neutral: "bg-secondary text-secondary-foreground hover:bg-accent",
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  },
  outline: {
    neutral: "border border-input bg-transparent text-foreground hover:bg-accent",
    primary: "border border-primary bg-transparent text-primary hover:bg-primary/10",
    destructive:
      "border border-destructive bg-transparent text-destructive hover:bg-destructive/10",
  },
  ghost: {
    neutral: "bg-transparent text-foreground hover:bg-accent",
    primary: "bg-transparent text-primary hover:bg-primary/10",
    destructive: "bg-transparent text-destructive hover:bg-destructive/10",
  },
};

/**
 * 最小のボタン・プリミティブ。
 *
 * `variant` × `tone` × `size` の組み合わせで見た目を決める純 UI 部品。ビジネスロジックは持たない。
 * React 19 のため `ref` は通常の prop として受け取る（forwardRef 不要）。
 *
 * @remarks 配色はデザイントークン（#174）を参照し、ライト/ダークに追従する。既定クラスは
 *   `className` で上書き・拡張できる（cn 経由）。
 */
export const Button = ({
  variant = "solid",
  tone = "primary",
  size = "md",
  type = "button",
  className,
  ...props
}: ButtonProps): React.JSX.Element => {
  return (
    <button
      type={type}
      className={cn(BUTTON_BASE, BUTTON_SIZE[size], BUTTON_VARIANT_TONE[variant][tone], className)}
      {...props}
    />
  );
};
